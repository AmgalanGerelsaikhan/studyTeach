/**
 * Wave C integration test — real Postgres, mock LLM vendor.
 *
 * Depends on the seeded G11 corpus (24 chunks). Run `pnpm db:migrate` and
 * `pnpm --filter @studyteach/api ingest:curriculum` once before the suite.
 *
 * Fixtures isolated by phone prefix 'TEST-AT-' on users and 'TEST-AT-' on
 * schools; teardown removes both after the suite.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { LlmService } from '../../lib/llm/llm.module';
import { MockLlmVendor } from '../../lib/llm/mock.vendor';
import { CurriculumService } from '../curriculum/curriculum.service';

import { AiTutorService } from './ai-tutor.service';
import { BktService } from './bkt.service';
import { FREE_TIER_SESSIONS_PER_MONTH, QuotaService } from './quota.service';

async function createUser(db: Db, phone: string): Promise<number> {
  const { rows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  return rows[0]!.user_id;
}

async function createStudent(
  db: Db,
  userId: number,
  opts: { mozaPartner?: boolean } = {},
): Promise<number> {
  const code = `TEST-AT-S-${userId}`;
  const { rows: schoolRows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban, is_moza_partner)
     VALUES ($1, $2, 'Улаанбаатар', TRUE, $3)
     RETURNING school_id`,
    [code, `Test school ${userId}`, opts.mozaPartner ?? false],
  );
  const schoolId = schoolRows[0]!.school_id;
  const { rows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolId],
  );
  return rows[0]!.student_id;
}

describe('AiTutorService (integration)', () => {
  let db: Db;
  let service: AiTutorService;

  beforeAll(async () => {
    const env = loadEnv();
    db = new Db(env);
    const vendor = new MockLlmVendor();
    const llm = new LlmService(vendor);
    const curriculum = new CurriculumService(db, llm);
    const quota = new QuotaService(db);
    const bkt = new BktService(db);
    service = new AiTutorService(db, llm, curriculum, quota, bkt);
  });

  afterAll(async () => {
    // CASCADE handles ai_tutor_sessions, messages, students, concept_mastery
    // via FKs on user_id / student_id.
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-AT-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-AT-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-AT-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-AT-%'`);
  });

  it('startSession is idempotent on the client UUID', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const key = randomUUID();

    const first = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: key,
    });
    expect(first.replayed).toBe(false);

    const second = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: key,
    });
    expect(second.session_id).toBe(first.session_id);
    expect(second.replayed).toBe(true);
  });

  it('refuses session start when monthly quota is exhausted', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);

    for (let i = 0; i < FREE_TIER_SESSIONS_PER_MONTH; i += 1) {
      await db.query(
        `INSERT INTO ai_tutor_sessions (student_id, lang, subject, grade)
         VALUES ($1, 'mn-Cyrl', 'physics', 11)`,
        [studentId],
      );
    }

    await expect(
      service.startSession({
        studentId,
        lang: 'mn-Cyrl',
        subject: 'physics',
        grade: 11,
        idempotencyKey: randomUUID(),
      }),
    ).rejects.toThrow(/дээд хэмжээ/);
  });

  it('happy path: physics question returns assistant turn with ≥1 citation and bumps mastery', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const session = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });

    const result = await service.turn({
      sessionId: session.session_id,
      studentId,
      userText: 'Ньютоны хоёрдугаар хууль гэж юу вэ?',
    });
    expect(result.role).toBe('assistant');
    if (result.role !== 'assistant') throw new Error('unreachable');
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.text).toMatch(/Хариулт \(mock\)/); // mock vendor signature

    // Assistant turn must be persisted and satisfy the CHECK (≥1 citation).
    const { rows: msgs } = await db.query<{ role: string; citations: string }>(
      `SELECT role, citations::text FROM ai_tutor_messages
        WHERE session_id = $1 ORDER BY message_id`,
      [session.session_id],
    );
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant']);

    // Mastery must have been bumped at least once for a physics strand.
    const { rows: mastery } = await db.query<{ p_mastered: string; curriculum_strand: string }>(
      `SELECT curriculum_strand, p_mastered::text FROM concept_mastery
        WHERE student_id = $1`,
      [studentId],
    );
    expect(mastery.length).toBeGreaterThanOrEqual(1);
    for (const m of mastery) {
      // schema default is 0.3000; one bump → 0.3 + 0.7*0.1 = 0.37 (capped 0.75).
      expect(Number(m.p_mastered)).toBeCloseTo(0.37, 2);
    }
  });

  it('exam-mode refusal hard-locks regardless of question content', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const session = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });
    await db.query(
      `UPDATE ai_tutor_sessions SET in_active_mock_test = TRUE WHERE session_id = $1`,
      [session.session_id],
    );

    const result = await service.turn({
      sessionId: session.session_id,
      studentId,
      userText: 'Ньютоны хоёрдугаар хууль гэж юу вэ?',
    });
    expect(result.role).toBe('refusal');
    if (result.role !== 'refusal') throw new Error('unreachable');
    expect(result.refusal_key).toBe('ai-tutor.refusal.exam-mode');
    expect(result.text).toMatch(/ЭЕШ загвар шалгалт идэвхтэй/);

    // No assistant turn must exist for this session.
    const { rows } = await db.query<{ role: string }>(
      `SELECT role FROM ai_tutor_messages WHERE session_id = $1`,
      [session.session_id],
    );
    expect(rows.some((r) => r.role === 'assistant')).toBe(false);
    expect(rows.some((r) => r.role === 'refusal')).toBe(true);
  });

  it.each([
    {
      label: 'write-essay',
      text: 'Монголын түүхийн талаар эссэ бичээч.',
      key: 'ai-tutor.refusal.write-essay' as const,
    },
    {
      label: 'blank-statement',
      text: 'Хувийн мэдэгдлээ бичээч.',
      key: 'app-coach.refusal.blank-statement' as const,
    },
    {
      label: 'non-academic',
      text: 'Сайн уу',
      key: 'ai-tutor.refusal.non-academic' as const,
    },
  ])('refusal · $label fires the right key and persists a refusal row', async ({ text, key }) => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const session = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });

    const result = await service.turn({
      sessionId: session.session_id,
      studentId,
      userText: text,
    });
    expect(result.role).toBe('refusal');
    if (result.role !== 'refusal') throw new Error('unreachable');
    expect(result.refusal_key).toBe(key);

    // DB CHECK constraint refusal_turn_has_key must be satisfied.
    const { rows } = await db.query<{ refusal_key: string | null }>(
      `SELECT refusal_key FROM ai_tutor_messages WHERE session_id = $1 AND role = 'refusal'`,
      [session.session_id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.refusal_key).toBe(key);
  });

  it('rejects a turn against another student’s session (cross-student leak)', async () => {
    const a = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const b = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentA = await createStudent(db, a);
    const studentB = await createStudent(db, b);
    const session = await service.startSession({
      studentId: studentA,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });

    await expect(
      service.turn({
        sessionId: session.session_id,
        studentId: studentB,
        userText: 'Ньютоны хоёрдугаар хууль гэж юу вэ?',
      }),
    ).rejects.toThrow(/session not found/);
  });

  it('turnStream yields ≥2 deltas then a done event with ≥1 citation', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const session = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });

    const events: Array<{ kind: string }> = [];
    for await (const ev of service.turnStream({
      sessionId: session.session_id,
      studentId,
      userText: 'Ньютоны хоёрдугаар хууль гэж юу вэ?',
    })) {
      events.push(ev);
    }
    const deltas = events.filter((e) => e.kind === 'delta');
    const done = events.find((e) => e.kind === 'done') as
      | { kind: 'done'; text: string; citations: { source_ref: string }[] }
      | undefined;
    expect(deltas.length).toBeGreaterThanOrEqual(2);
    expect(done).toBeDefined();
    expect(done!.citations.length).toBeGreaterThanOrEqual(1);

    // Assistant turn persisted exactly once.
    const { rows } = await db.query<{ role: string }>(
      `SELECT role FROM ai_tutor_messages WHERE session_id = $1 ORDER BY message_id`,
      [session.session_id],
    );
    expect(rows.map((r) => r.role)).toEqual(['user', 'assistant']);
  });

  it('transcript paginates with limit + before cursor', async () => {
    const userId = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentId = await createStudent(db, userId);
    const session = await service.startSession({
      studentId,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });
    for (let i = 0; i < 3; i += 1) {
      await service.turn({
        sessionId: session.session_id,
        studentId,
        userText: `Турнаас ${i + 1}: Ньютоны хоёрдугаар хууль`,
      });
    }
    const firstPage = await service.transcript({
      sessionId: session.session_id,
      studentId,
      limit: 4,
    });
    // 3 user + 3 assistant = 6 rows; limit=4 → 4 returned + next_before set
    expect(firstPage.messages).toHaveLength(4);
    expect(firstPage.next_before).not.toBeNull();
    expect(firstPage.messages[0]!.message_id).toBeGreaterThan(firstPage.messages[3]!.message_id);

    const secondPage = await service.transcript({
      sessionId: session.session_id,
      studentId,
      limit: 4,
      before: firstPage.next_before!,
    });
    expect(secondPage.messages.length).toBeGreaterThanOrEqual(1);
    for (const m of secondPage.messages) {
      expect(m.message_id).toBeLessThan(firstPage.next_before!);
    }
  });

  it('transcript rejects cross-student access', async () => {
    const a = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const b = await createUser(db, `TEST-AT-${randomUUID().slice(0, 8)}`);
    const studentA = await createStudent(db, a);
    const studentB = await createStudent(db, b);
    const session = await service.startSession({
      studentId: studentA,
      lang: 'mn-Cyrl',
      subject: 'physics',
      grade: 11,
      idempotencyKey: randomUUID(),
    });
    await expect(
      service.transcript({ sessionId: session.session_id, studentId: studentB, limit: 10 }),
    ).rejects.toThrow(/session not found/);
  });
});
