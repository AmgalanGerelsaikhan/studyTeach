import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  getRefusalText,
  type Citation,
  type RefusalKey,
  type TutorSubject,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';
import { LlmService } from '../../lib/llm/llm.module';
import { CurriculumService } from '../curriculum/curriculum.service';

import { BktService } from './bkt.service';
import { QuotaService } from './quota.service';
import { classifyRefusal } from './refusal.classifier';

type Locale = 'mn-Cyrl';

export interface StartSessionInput {
  studentId: number;
  lang: Locale;
  subject: TutorSubject;
  grade: number;
  /** Client-supplied UUIDv7 from offline queue; idempotent. */
  idempotencyKey: string;
}

export interface StartSessionResult {
  session_id: string;
  lang: Locale;
  subject: TutorSubject;
  grade: number;
  /** True when the same idempotency_key returned an existing session unchanged. */
  replayed: boolean;
}

export interface TurnInput {
  sessionId: string;
  studentId: number;
  userText: string;
}

export type TurnResult =
  | {
      role: 'assistant';
      text: string;
      citations: Citation[];
    }
  | {
      role: 'refusal';
      refusal_key: RefusalKey;
      text: string;
    };

export type StreamEvent =
  | { kind: 'delta'; delta: string }
  | { kind: 'done'; text: string; citations: Citation[] }
  | { kind: 'refusal'; refusal_key: RefusalKey; text: string };

export interface TranscriptMessageRow {
  message_id: number;
  role: 'user' | 'assistant' | 'system' | 'refusal';
  content: string;
  citations: Citation[];
  refusal_key: RefusalKey | null;
  created_at: string;
}

const RAG_K = 3;

@Injectable()
export class AiTutorService {
  constructor(
    private readonly db: Db,
    private readonly llm: LlmService,
    private readonly curriculum: CurriculumService,
    private readonly quota: QuotaService,
    private readonly bkt: BktService,
  ) {}

  async startSession(input: StartSessionInput): Promise<StartSessionResult> {
    // Quota is checked BEFORE the session row is created — a quota-blocked
    // student must not consume a session slot just by trying.
    const state = await this.quota.inspect(input.studentId);
    if (state.blocked) {
      throw new ForbiddenException(
        `Сарын ${state.used} ярилцлагын дээд хэмжээнд хүрсэн байна. Дараа сар хүртэл хүлээнэ үү.`,
      );
    }

    const { rows } = await this.db.query<{
      session_id: string;
      lang: Locale;
      subject: TutorSubject;
      grade: number;
      replayed: boolean;
    }>(
      `INSERT INTO ai_tutor_sessions (student_id, lang, subject, grade, created_idempotency_key)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (created_idempotency_key) DO UPDATE
         SET created_idempotency_key = EXCLUDED.created_idempotency_key
       RETURNING session_id::text,
                 lang,
                 subject::text AS subject,
                 grade,
                 (xmax <> 0) AS replayed`,
      [input.studentId, input.lang, input.subject, input.grade, input.idempotencyKey],
    );
    const session = rows[0];
    if (!session) throw new Error('startSession: INSERT returned no row');
    return session;
  }

  async turn(input: TurnInput): Promise<TurnResult> {
    const session = await this.loadSession(input.sessionId);
    if (session.student_id !== input.studentId) {
      // Tenant-isolation cousin: a student can never read another student's
      // transcript even by guessing a session UUID.
      throw new NotFoundException('session not found');
    }

    // Persist the user turn first so the transcript exists even if downstream
    // fails. `citations` defaults to '[]' which satisfies the CHECK (it only
    // bites on role='assistant').
    await this.db.query(
      `INSERT INTO ai_tutor_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [input.sessionId, input.userText],
    );

    const refusal = classifyRefusal({
      userText: input.userText,
      inActiveMockTest: session.in_active_mock_test,
    });
    if (refusal) {
      const text = getRefusalText(refusal, session.lang);
      await this.db.query(
        `INSERT INTO ai_tutor_messages (session_id, role, content, refusal_key)
         VALUES ($1, 'refusal', $2, $3)`,
        [input.sessionId, text, refusal],
      );
      return { role: 'refusal', refusal_key: refusal, text };
    }

    const chunks = await this.curriculum.retrieve({
      lang: session.lang,
      grade: session.grade,
      subject: session.subject,
      query: input.userText,
      k: RAG_K,
    });

    // No retrieved chunks ⇒ we cannot satisfy the "≥1 citation" invariant.
    // Refuse as out-of-corpus rather than fabricate. Reuses non-academic key
    // (no scope match); a dedicated 'out-of-corpus' key can land in S04.
    if (chunks.length === 0) {
      const text = getRefusalText('ai-tutor.refusal.non-academic', session.lang);
      await this.db.query(
        `INSERT INTO ai_tutor_messages (session_id, role, content, refusal_key)
         VALUES ($1, 'refusal', $2, 'ai-tutor.refusal.non-academic')`,
        [input.sessionId, text],
      );
      return { role: 'refusal', refusal_key: 'ai-tutor.refusal.non-academic', text };
    }

    const stream = this.llm.generate({
      model: 'tutor-default',
      messages: [
        { role: 'system', content: this.systemPrompt(session.lang) },
        ...this.contextMessages(chunks),
        { role: 'user', content: input.userText },
      ],
      max_tokens: 512,
      temperature: 0.3,
      request_id: input.sessionId,
    });
    let assistantText = '';
    for await (const chunk of stream) assistantText += chunk.delta;

    const citations: Citation[] = chunks.map((c) => ({
      source_ref: c.source_ref,
      strand: c.strand,
    }));

    await this.db.query(
      `INSERT INTO ai_tutor_messages (session_id, role, content, citations)
       VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [input.sessionId, assistantText, JSON.stringify(citations)],
    );

    await this.bkt.bumpExposure(
      input.studentId,
      chunks.map((c) => c.strand),
    );

    return { role: 'assistant', text: assistantText, citations };
  }

  /**
   * Streaming variant of `turn`. Emits StreamEvent values; the persistence
   * (assistant turn row + BKT bump) happens at the end of the stream so the
   * DB CHECK invariants only ever see fully-formed rows.
   *
   * Refusals are still emitted as a single 'refusal' event (no streaming —
   * the canonical refusal text is a static string).
   */
  async *turnStream(input: TurnInput): AsyncGenerator<StreamEvent, void, void> {
    const session = await this.loadSession(input.sessionId);
    if (session.student_id !== input.studentId) {
      throw new NotFoundException('session not found');
    }

    await this.db.query(
      `INSERT INTO ai_tutor_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [input.sessionId, input.userText],
    );

    const refusal = classifyRefusal({
      userText: input.userText,
      inActiveMockTest: session.in_active_mock_test,
    });
    if (refusal) {
      const text = getRefusalText(refusal, session.lang);
      await this.db.query(
        `INSERT INTO ai_tutor_messages (session_id, role, content, refusal_key)
         VALUES ($1, 'refusal', $2, $3)`,
        [input.sessionId, text, refusal],
      );
      yield { kind: 'refusal', refusal_key: refusal, text };
      return;
    }

    const chunks = await this.curriculum.retrieve({
      lang: session.lang,
      grade: session.grade,
      subject: session.subject,
      query: input.userText,
      k: RAG_K,
    });
    if (chunks.length === 0) {
      const text = getRefusalText('ai-tutor.refusal.non-academic', session.lang);
      await this.db.query(
        `INSERT INTO ai_tutor_messages (session_id, role, content, refusal_key)
         VALUES ($1, 'refusal', $2, 'ai-tutor.refusal.non-academic')`,
        [input.sessionId, text],
      );
      yield { kind: 'refusal', refusal_key: 'ai-tutor.refusal.non-academic', text };
      return;
    }

    const stream = this.llm.generate({
      model: 'tutor-default',
      messages: [
        { role: 'system', content: this.systemPrompt(session.lang) },
        ...this.contextMessages(chunks),
        { role: 'user', content: input.userText },
      ],
      max_tokens: 512,
      temperature: 0.3,
      request_id: input.sessionId,
    });

    let assistantText = '';
    for await (const chunk of stream) {
      assistantText += chunk.delta;
      yield { kind: 'delta', delta: chunk.delta };
    }

    const citations: Citation[] = chunks.map((c) => ({
      source_ref: c.source_ref,
      strand: c.strand,
    }));

    await this.db.query(
      `INSERT INTO ai_tutor_messages (session_id, role, content, citations)
       VALUES ($1, 'assistant', $2, $3::jsonb)`,
      [input.sessionId, assistantText, JSON.stringify(citations)],
    );
    await this.bkt.bumpExposure(
      input.studentId,
      chunks.map((c) => c.strand),
    );

    yield { kind: 'done', text: assistantText, citations };
  }

  /**
   * Transcript replay. Per-student isolation enforced — cross-student access
   * returns 404 even if the caller knows the session UUID.
   */
  async transcript(input: {
    sessionId: string;
    studentId: number;
    limit: number;
    before?: number;
  }): Promise<{ messages: TranscriptMessageRow[]; next_before: number | null }> {
    const session = await this.loadSession(input.sessionId);
    if (session.student_id !== input.studentId) {
      throw new NotFoundException('session not found');
    }
    const params: unknown[] = [input.sessionId];
    let where = `session_id = $1`;
    if (input.before !== undefined) {
      params.push(input.before);
      where += ` AND message_id < $${params.length}`;
    }
    params.push(input.limit + 1);
    const limitIdx = params.length;
    const { rows } = await this.db.query<{
      message_id: string;
      role: TranscriptMessageRow['role'];
      content: string;
      citations: Citation[];
      refusal_key: RefusalKey | null;
      created_at: Date;
    }>(
      `SELECT message_id::text, role, content, citations, refusal_key, created_at
         FROM ai_tutor_messages
        WHERE ${where}
        ORDER BY message_id DESC
        LIMIT $${limitIdx}`,
      params,
    );
    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      messages: page.map((r) => ({
        message_id: Number(r.message_id),
        role: r.role,
        content: r.content,
        citations: r.citations,
        refusal_key: r.refusal_key,
        created_at: r.created_at.toISOString(),
      })),
      next_before: hasMore ? Number(page[page.length - 1]!.message_id) : null,
    };
  }

  private systemPrompt(lang: Locale): string {
    if (lang === 'mn-Cyrl') {
      return 'Та сурагчид Монгол хэлээр сургалтын материал дээр тулгуурлан хариулдаг багш. Иш татсан хэсэг бүрд эх сурвалжийг дурд.';
    }
    if (lang === 'mn-Latn') {
      return 'Ta suragchid Mongol heleer surgaltyn material deer tulguurlan hariuldag bagsh. Ish tatsan heseg buurd eh survalzhig durd.';
    }
    return 'You are a tutor answering Mongolian K-12 students using the provided curriculum chunks. Cite every claim back to a chunk source_ref.';
  }

  private contextMessages(
    chunks: ReadonlyArray<{ body: string; source_ref: string; strand: string }>,
  ): Array<{ role: 'system'; content: string }> {
    return chunks.map((c) => ({
      role: 'system' as const,
      content: `[${c.source_ref}] ${c.strand}\n${c.body}`,
    }));
  }

  private async loadSession(sessionId: string): Promise<{
    student_id: number;
    lang: Locale;
    subject: TutorSubject;
    grade: number;
    in_active_mock_test: boolean;
  }> {
    const { rows } = await this.db.query<{
      student_id: number;
      lang: Locale;
      subject: TutorSubject;
      grade: number;
      in_active_mock_test: boolean;
    }>(
      `SELECT student_id, lang, subject::text AS subject, grade, in_active_mock_test
         FROM ai_tutor_sessions
        WHERE session_id = $1`,
      [sessionId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('session not found');
    return row;
  }
}
