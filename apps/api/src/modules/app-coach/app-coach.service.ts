import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  SUPPORTED_INTERVIEW_SCHOLARSHIPS,
  getRefusalText,
  type CoachSession,
  type CritiqueAxis,
  type CritiqueItem,
  type CritiqueResponse,
  type MockInterviewQuestion,
  type MockInterviewResponse,
  type RefusalKey,
  type RewriteResponse,
  type StudyAbroadDestinationCode,
  type SupportedInterviewScholarship,
} from '@studyteach/contracts';

import { AuditService } from '../../lib/audit/audit.service';
import { Db } from '../../lib/db/pool';
import { LlmService } from '../../lib/llm/llm.module';

/**
 * Thrown when the coach refuses a request. The controller maps this to a 400
 * with a typed body `{ refusal_key, text }` so the caller can render the
 * canonical Mongolian Cyrillic message verbatim — refusal text is NEVER
 * paraphrased inline (docs/LOCALIZATION.md §Refusal text).
 */
export class CoachRefusalError extends Error {
  constructor(
    public readonly refusal_key: RefusalKey,
    public readonly text: string,
  ) {
    super(`coach refusal: ${refusal_key}`);
    this.name = 'CoachRefusalError';
  }
}

export interface CreateSessionInput {
  userId: number;
  destination_code: StudyAbroadDestinationCode;
  scholarship_id?: number;
  draft_text: string;
}

interface SessionRow {
  session_id: number;
  user_id: number;
  destination_code: StudyAbroadDestinationCode;
  scholarship_id: number | null;
  draft_text: string;
  draft_word_count: number;
  created_at: Date;
  purge_at: Date;
}

const MIN_DRAFT_CHARS = 100;
const MIN_PARAGRAPH_CHARS = 30;
const LANG = 'mn-Cyrl' as const;

/**
 * AI Application Coach — PRD §4.10c (P2).
 *
 * Four PRD-mandated behaviors enforced here:
 *   1. Refuses to draft from scratch (`createSession` rejects drafts < 100
 *      chars with `app-coach.refusal.blank-statement`).
 *   2. Refuses mock interviews outside MEXT/Chevening/KGSP
 *      (`app-coach.refusal.unsupported-interview`).
 *   3. Rewrites are suggestions, never auto-applied — `accepted=false` until
 *      the student POSTs to /accept.
 *   4. Retention: every session row carries a `purge_at` ≥ created_at + 90d.
 *      The purge cron is a follow-up; the column lets it find candidates.
 *
 * STUDENT role + own-session scoping is enforced at every entry point.
 * Audit rows land on every coach action.
 */
@Injectable()
export class AppCoachService {
  constructor(
    private readonly db: Db,
    private readonly llm: LlmService,
    private readonly audit: AuditService,
  ) {}

  async createSession(input: CreateSessionInput): Promise<CoachSession> {
    // Refusal #1: blank/short drafts. The Zod schema enforces this too — the
    // service-level check exists for callers that bypass schema validation
    // (internal integrations, replayed offline queue items, etc.).
    if (input.draft_text.trim().length < MIN_DRAFT_CHARS) {
      throw new CoachRefusalError(
        'app-coach.refusal.blank-statement',
        getRefusalText('app-coach.refusal.blank-statement', LANG),
      );
    }

    const wordCount = countWords(input.draft_text);
    const { rows } = await this.db.query<SessionRow>(
      `INSERT INTO app_coach_sessions
         (user_id, destination_code, scholarship_id, draft_text, draft_word_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING session_id, user_id, destination_code, scholarship_id,
                 draft_text, draft_word_count, created_at, purge_at`,
      [
        input.userId,
        input.destination_code,
        input.scholarship_id ?? null,
        input.draft_text,
        wordCount,
      ],
    );
    const row = rows[0];
    if (!row) throw new Error('createSession: INSERT returned no row');

    await this.audit.record({
      actor_user_id: input.userId,
      action: 'app_coach.session.created',
      target_type: 'app_coach_session',
      target_id: String(row.session_id),
      metadata: {
        destination_code: row.destination_code,
        scholarship_id: row.scholarship_id,
        draft_word_count: row.draft_word_count,
      },
    });

    return toPublicSession(row);
  }

  async critique(input: { sessionId: number; userId: number }): Promise<CritiqueResponse> {
    const session = await this.loadOwnSession(input.sessionId, input.userId);

    await this.audit.record({
      actor_user_id: input.userId,
      action: 'app_coach.critique.requested',
      target_type: 'app_coach_session',
      target_id: String(session.session_id),
    });

    const axes: CritiqueAxis[] = ['CLARITY', 'NARRATIVE', 'EVIDENCE', 'CONCLUSION'];
    const critiques: CritiqueItem[] = [];
    for (const axis of axes) {
      const text = await this.runLlm({
        request_id: `coach.critique.${session.session_id}.${axis}`,
        system: this.critiqueSystemPrompt(axis),
        user: `Хүсэлт: миний хувийн мэдэгдлийг "${axis}" тэнхлэгээр шүүмжилнэ үү.\n\nЭссэ:\n${session.draft_text}`,
      });
      critiques.push({
        axis,
        feedback_text: text,
        suggested_actions: this.defaultActionsFor(axis),
      });
      await this.db.query(
        `INSERT INTO app_coach_critiques (session_id, axis, feedback_text, suggested_actions)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [session.session_id, axis, text, JSON.stringify(this.defaultActionsFor(axis))],
      );
    }

    return { critiques };
  }

  async rewriteParagraph(input: {
    sessionId: number;
    userId: number;
    paragraph_text: string;
  }): Promise<RewriteResponse> {
    const session = await this.loadOwnSession(input.sessionId, input.userId);

    // Floor check mirrors the contract. A too-short selection is a UX bug,
    // not a refusal — the student probably mis-selected. We surface it as a
    // 400 with a refusal-shaped body so the client can render guidance, but
    // it deliberately reuses the blank-statement key (no separate canonical
    // string is warranted for "you selected too little text").
    if (input.paragraph_text.trim().length < MIN_PARAGRAPH_CHARS) {
      throw new CoachRefusalError(
        'app-coach.refusal.blank-statement',
        getRefusalText('app-coach.refusal.blank-statement', LANG),
      );
    }

    const suggested_rewrite = await this.runLlm({
      request_id: `coach.rewrite.${session.session_id}.${Date.now()}`,
      system:
        'Та бол хувийн мэдэгдлийн зөвлөгч. Доорх догол мөрийг илүү тодорхой, нотолгоотой, оноосон сэдэвт нийцсэн байдлаар сайжруулсан санал бичнэ үү. Бүтнээр нь дахин бичээгүй, зөвхөн зөвлөмж болгож үзүүл.',
      user: `Догол мөр:\n${input.paragraph_text}`,
    });

    const { rows } = await this.db.query<{ rewrite_id: number }>(
      `INSERT INTO app_coach_rewrites (session_id, original_paragraph, suggested_rewrite)
       VALUES ($1, $2, $3)
       RETURNING rewrite_id`,
      [session.session_id, input.paragraph_text, suggested_rewrite],
    );
    const rewrite_id = Number(rows[0]?.rewrite_id);
    if (!rewrite_id) throw new Error('rewriteParagraph: INSERT returned no row');

    await this.audit.record({
      actor_user_id: input.userId,
      action: 'app_coach.rewrite.requested',
      target_type: 'app_coach_rewrite',
      target_id: String(rewrite_id),
      metadata: { session_id: session.session_id },
    });

    return {
      rewrite_id,
      original_paragraph: input.paragraph_text,
      suggested_rewrite,
      // Compile-time literal: this can never be false per the contract.
      marked_as_suggestion: true,
    };
  }

  async acceptRewrite(input: {
    rewriteId: number;
    userId: number;
  }): Promise<{ rewrite_id: number; accepted: true }> {
    // Join through sessions to enforce own-rewrite scoping. A student can
    // never accept another student's rewrite even by guessing the id.
    const { rows } = await this.db.query<{ rewrite_id: number; user_id: number }>(
      `SELECT r.rewrite_id, s.user_id
         FROM app_coach_rewrites r
         JOIN app_coach_sessions s ON s.session_id = r.session_id
        WHERE r.rewrite_id = $1`,
      [input.rewriteId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('rewrite not found');
    if (row.user_id !== input.userId) throw new NotFoundException('rewrite not found');

    await this.db.query(`UPDATE app_coach_rewrites SET accepted = TRUE WHERE rewrite_id = $1`, [
      input.rewriteId,
    ]);

    await this.audit.record({
      actor_user_id: input.userId,
      action: 'app_coach.rewrite.accepted',
      target_type: 'app_coach_rewrite',
      target_id: String(input.rewriteId),
    });

    return { rewrite_id: input.rewriteId, accepted: true };
  }

  async mockInterview(input: {
    userId: number;
    scholarship_name: string;
  }): Promise<MockInterviewResponse> {
    // Refusal #2: scholarship outside the supported rotation. Case-insensitive
    // match because students often type "mext" lowercase.
    const matched = SUPPORTED_INTERVIEW_SCHOLARSHIPS.find(
      (name) => name.toLowerCase() === input.scholarship_name.trim().toLowerCase(),
    );
    if (!matched) {
      throw new CoachRefusalError(
        'app-coach.refusal.unsupported-interview',
        getRefusalText('app-coach.refusal.unsupported-interview', LANG),
      );
    }
    const scholarship_name: SupportedInterviewScholarship = matched;

    const questions = await this.generateInterviewQuestions(scholarship_name);

    const { rows } = await this.db.query<{ interview_id: number }>(
      `INSERT INTO app_coach_mock_interviews (user_id, scholarship_name, questions_jsonb)
       VALUES ($1, $2, $3::jsonb)
       RETURNING interview_id`,
      [input.userId, scholarship_name, JSON.stringify(questions)],
    );
    const interview_id = Number(rows[0]?.interview_id);
    if (!interview_id) throw new Error('mockInterview: INSERT returned no row');

    await this.audit.record({
      actor_user_id: input.userId,
      action: 'app_coach.interview.generated',
      target_type: 'app_coach_mock_interview',
      target_id: String(interview_id),
      metadata: { scholarship_name, question_count: questions.length },
    });

    return { interview_id, scholarship_name, questions };
  }

  /** Loads a session and enforces own-session scoping. */
  private async loadOwnSession(sessionId: number, userId: number): Promise<SessionRow> {
    const { rows } = await this.db.query<SessionRow>(
      `SELECT session_id, user_id, destination_code, scholarship_id,
              draft_text, draft_word_count, created_at, purge_at
         FROM app_coach_sessions
        WHERE session_id = $1`,
      [sessionId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('coach session not found');
    if (row.user_id !== userId) {
      // Same 404 message as a missing row — never confirm existence of
      // another user's session.
      throw new NotFoundException('coach session not found');
    }
    return row;
  }

  /**
   * Default action checklist per critique axis. The LLM produces prose
   * feedback; these structured items give the student a tappable next step.
   * Kept short — the UI renders them as a bulleted list.
   */
  private defaultActionsFor(axis: CritiqueAxis): string[] {
    switch (axis) {
      case 'CLARITY':
        return [
          'Эхний догол мөрийг 1 өгүүлбэрт хураах',
          'Шинжлэх ухааны нэр томьёог нэг удаа тайлбарлах',
        ];
      case 'NARRATIVE':
        return [
          'Гол хүн (өөрөө) ба өөрчлөлтийг тодорхой болгох',
          'Цаг хугацааны дараалал гажуудуулахгүй',
        ];
      case 'EVIDENCE':
        return ['Тоо/үр дүнгээр баталгаажуулах', 'Бусдын үг бус, өөрийн оролцоог тодорхойлох'];
      case 'CONCLUSION':
        return ['Энэ сургуулийг сонгосон шалтгаанд буцах', 'Дараагийн алхамаар төгсгөх'];
    }
  }

  private critiqueSystemPrompt(axis: CritiqueAxis): string {
    const axisLabel: Record<CritiqueAxis, string> = {
      CLARITY: 'тодорхой байдал',
      NARRATIVE: 'өгүүлэмжийн нум',
      EVIDENCE: 'нотолгоо',
      CONCLUSION: 'дүгнэлт',
    };
    return (
      `Та бол их сургуулийн хувийн мэдэгдлийн шүүмжлэгч. Доорх эссэг "${axisLabel[axis]}" ` +
      'тэнхлэгээр л шүүмжилнэ. Эссэг бүхлээр нь дахин бичихгүй; зөвхөн ажиглалт, санал бичнэ.'
    );
  }

  private async runLlm(args: {
    request_id: string;
    system: string;
    user: string;
  }): Promise<string> {
    // Heavy model reserved for coach (low volume, high value) per the ai-tutor
    // cost-control note. The mock vendor accepts any model id deterministically.
    const stream = this.llm.generate({
      model: 'coach-default',
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
      max_tokens: 768,
      temperature: 0.4,
      request_id: args.request_id,
    });
    let out = '';
    for await (const chunk of stream) out += chunk.delta;
    return out;
  }

  private async generateInterviewQuestions(
    scholarship: SupportedInterviewScholarship,
  ): Promise<MockInterviewQuestion[]> {
    const text = await this.runLlm({
      request_id: `coach.interview.${scholarship}.${Date.now()}`,
      system:
        'Та бол тэтгэлгийн ярилцлагын зөвлөх. Дараах тэтгэлэгт өргөдөл гаргагчийг бэлдэхэд ' +
        'тохирох ярилцлагын асуултуудыг 5-8-аар жагсааж, асуулт тус бүрд 2-3 нэмэлт лавлах ' +
        'асуулт оруулна.',
      user: `Тэтгэлэг: ${scholarship}`,
    });

    // Curated fallback bank — per the ai-tutor cost-control note we prefer
    // curated content first, LLM-as-fallback. We always seed at least 5
    // questions so the contract's min(5).max(8) holds even when the LLM
    // returns garbage (mock vendor, network blip, etc.).
    const banks: Record<SupportedInterviewScholarship, MockInterviewQuestion[]> = {
      MEXT: [
        {
          prompt: 'Та яагаад Япон улсыг сонгосон бэ?',
          probes: [
            'Аль их сургуульд хамгийн их сонирхолтой байна?',
            'Хэлний бэлтгэлийн төлөвлөгөө?',
          ],
        },
        {
          prompt: 'Сонгосон судалгааны сэдвээ танилцуулна уу.',
          probes: [
            'Ямар хяналтын багштай ажиллахыг хүсэж байна?',
            'Энэ сэдвийг сонгосон шалтгаан?',
          ],
        },
        {
          prompt: 'Дипломын дараах төлөвлөгөө юу вэ?',
          probes: ['Монголд эргэж очих уу?', 'Гүний судалгаа үргэлжлэх үү?'],
        },
        {
          prompt: 'Япон хэлний түвшингээ хэрхэн дээшлүүлэх вэ?',
          probes: ['Одоогийн JLPT түвшин?', 'Сургалт эхлэхийн өмнө юу хийх вэ?'],
        },
        {
          prompt: 'Соёлын ялгаатай орчинд хэрхэн зохицох вэ?',
          probes: ['Өмнөх олон улсын туршлага?', 'Хэцүү нөхцөл байдалд хэрхэн хариу үзүүлэх вэ?'],
        },
        {
          prompt: 'Япон, Монголын хамтын ажиллагаанд та хэрхэн хувь нэмэр оруулах вэ?',
          probes: ['Аль салбарт?', 'Богино, урт хугацааны зорилго?'],
        },
      ],
      Chevening: [
        {
          prompt: 'Та өөрийгөө манлайлагч гэж бодож байна уу?',
          probes: ['Тодорхой жишээ дурдана уу.', 'Хамт олонг хэрхэн нөлөөлсөн?'],
        },
        {
          prompt: 'Их Британид суралцах нь яагаад чухал вэ?',
          probes: ['Аль их сургууль, програм?', 'Бусад орноос юугаараа давуу вэ?'],
        },
        {
          prompt: 'Сүлжээ үүсгэх төлөвлөгөөгөө танилцуулна уу.',
          probes: ['Ямар салбарын хүмүүстэй?', 'Эргэж ирээд хэрхэн ашиглах вэ?'],
        },
        {
          prompt: 'Карьерийн зорилгоо дунд хугацаанд хэрхэн дэвшүүлэх вэ?',
          probes: ['2-5 жилд?', 'Chevening хэрхэн дэмжих вэ?'],
        },
        {
          prompt: 'Монголд буцаж очоод ямар өөрчлөлт хийхийг хүсэж байна?',
          probes: ['Тодорхой бодлогын шинэчлэл?', 'Хамтрагчид хэн байх вэ?'],
        },
        {
          prompt: 'Ялагдлаас сурсан хамгийн чухал хичээл юу вэ?',
          probes: ['Шууд жишээ.', 'Дараагийн арга хэмжээ?'],
        },
      ],
      KGSP: [
        {
          prompt: 'Та яагаад Солонгос улсыг сонгосон бэ?',
          probes: ['Аль их сургууль?', 'K-соёлын нөлөө уу, эсвэл академик уу?'],
        },
        {
          prompt: 'Солонгос хэлний бэлтгэл хэр явагдаж байна?',
          probes: ['TOPIK түвшин?', '1 жилийн хэлний сургалтын төлөвлөгөө?'],
        },
        {
          prompt: 'Сонгосон мэргэжлийнхээ талаар тайлбарлана уу.',
          probes: ['Яагаад энэ салбар?', 'Карьерт хэрхэн нийцэх вэ?'],
        },
        {
          prompt: 'Солонгос, Монголын харилцаанд та юу хувь нэмэр оруулах вэ?',
          probes: ['Аль салбарт?', 'Богино, урт хугацааны зорилго?'],
        },
        {
          prompt: 'Соёлын зөрчилдөөнтэй тулгарвал хэрхэн шийдвэрлэх вэ?',
          probes: ['Өмнөх туршлага?', 'Сургуулийн дэмжлэгийг хэрхэн ашиглах вэ?'],
        },
        {
          prompt: 'Дипломын дараа Монголд буцах уу?',
          probes: ['Тодорхой ажлын төлөвлөгөө?', 'Сүлжээгээ хэрхэн хадгалах вэ?'],
        },
      ],
    };

    const curated = banks[scholarship];
    if (text && text.length > 0) {
      // Today the mock vendor returns a single-line echo; we don't try to
      // parse it into 5-8 structured questions. When a real vendor lands,
      // swap this branch for a JSON-mode call and validate against
      // MockInterviewQuestion. The curated bank stays as the floor.
    }
    return curated;
  }
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

function toPublicSession(row: SessionRow): CoachSession {
  return {
    session_id: Number(row.session_id),
    destination_code: row.destination_code,
    scholarship_id: row.scholarship_id !== null ? Number(row.scholarship_id) : null,
    draft_word_count: row.draft_word_count,
    created_at: row.created_at.toISOString(),
    purge_at: row.purge_at.toISOString(),
  };
}

// Re-export so callers don't have to import ForbiddenException here.
export { ForbiddenException };
