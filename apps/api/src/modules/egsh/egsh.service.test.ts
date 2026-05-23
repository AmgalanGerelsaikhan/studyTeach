/**
 * Wave C integration test — EGSh paper → mock → submit → predictor/cohort.
 * Real Postgres. Uses the seeded EGSH-2024-PHYSICS paper.
 *
 * Fixtures use phone prefix TEST-EG- on users + TEST-EG- on schools; teardown
 * removes both.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { BktService } from '../ai-tutor/bkt.service';

import { CohortService, MIN_COHORT_SIZE } from './cohort.service';
import { MockService } from './mock.service';
import { PaperService } from './paper.service';
import { PredictorService } from './predictor.service';

const PAPER_ID = 'EGSH-2024-PHYSICS';

async function createStudent(
  db: Db,
  opts: { aimag?: string } = {},
): Promise<{ userId: number; studentId: number; aimag: string }> {
  const suffix = randomUUID().slice(0, 8);
  const phone = `TEST-EG-${suffix}`;
  const aimag = opts.aimag ?? 'Улаанбаатар';
  const { rows: userRows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  const userId = userRows[0]!.user_id;
  const { rows: schoolRows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban) VALUES ($1, $2, $3, TRUE) RETURNING school_id`,
    [`TEST-EG-S-${suffix}`, `Test ${suffix}`, aimag],
  );
  const { rows: studentRows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolRows[0]!.school_id],
  );
  return { userId, studentId: studentRows[0]!.student_id, aimag };
}

describe('EGSh module (integration)', () => {
  let db: Db;
  let papers: PaperService;
  let bkt: BktService;
  let mocks: MockService;
  let predictor: PredictorService;
  let cohort: CohortService;

  beforeAll(() => {
    db = new Db(loadEnv());
    papers = new PaperService(db);
    bkt = new BktService(db);
    mocks = new MockService(db, papers, bkt);
    predictor = new PredictorService(db);
    cohort = new CohortService(db);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-EG-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-EG-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-EG-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-EG-%'`);
  });

  it('lists papers and strips answer keys from the public shape', async () => {
    const list = await papers.list({});
    expect(list.length).toBeGreaterThan(0);
    const physics = list.find((p) => p.paper_id === PAPER_ID);
    expect(physics).toBeDefined();
    const paper = await papers.getWithQuestions(PAPER_ID);
    expect(paper.questions.length).toBeGreaterThan(0);
    for (const q of paper.questions) {
      expect((q as unknown as { answer?: unknown }).answer).toBeUndefined();
    }
  });

  it('start is idempotent on the client UUIDv7 and flips the tutor exam flag', async () => {
    const { userId, studentId } = await createStudent(db);
    // Also create an open tutor session for this student so we can prove the flip.
    await db.query(
      `INSERT INTO ai_tutor_sessions (student_id, lang, subject, grade)
       VALUES ($1, 'mn-Cyrl', 'physics', 11)`,
      [studentId],
    );

    const key = randomUUID();
    const first = await mocks.start({ studentId, paperId: PAPER_ID, idempotencyKey: key });
    expect(first.replayed).toBe(false);
    expect(first.is_proctored_active).toBe(true);

    const second = await mocks.start({ studentId, paperId: PAPER_ID, idempotencyKey: key });
    expect(second.session_id).toBe(first.session_id);
    expect(second.replayed).toBe(true);

    // Tutor flag now true on the open session.
    const { rows: tutorRows } = await db.query<{ in_active_mock_test: boolean }>(
      `SELECT in_active_mock_test FROM ai_tutor_sessions WHERE student_id = $1`,
      [studentId],
    );
    expect(tutorRows.every((r) => r.in_active_mock_test)).toBe(true);
    void userId;
  });

  it('submit scores correctly, writes mock_test_results, runs BKT per strand, clears proctor flag', async () => {
    const { studentId } = await createStudent(db);
    const key = randomUUID();
    const session = await mocks.start({ studentId, paperId: PAPER_ID, idempotencyKey: key });

    // Answer all questions: correct on q1+q2 (mechanics), wrong on q3+q4 (EM + thermo).
    // Pull paper to know the correct answers; we override q3+q4 to wrong.
    const paper = await papers.getWithQuestions(PAPER_ID);
    const keyMap = await papers.getAnswerKey(PAPER_ID);
    const answers = paper.questions.map((q, i) => {
      const correctIdx = keyMap.get(q.id)!.answer;
      if (i < 2) return { question_id: q.id, chosen_index: correctIdx };
      return { question_id: q.id, chosen_index: (correctIdx + 1) % q.options.length };
    });

    const result = await mocks.submit({ sessionId: session.session_id, studentId, answers });
    expect(result.score).toBe(2);
    expect(result.max_score).toBe(paper.questions.length);
    expect(result.missed.length).toBe(paper.questions.length - 2);

    // mock_test_results row.
    const { rows: mrRows } = await db.query<{
      score: number;
      max_score: number;
      per_strand_score: Record<string, { correct: number; wrong: number }>;
    }>(
      `SELECT score, max_score, per_strand_score FROM mock_test_results
        WHERE session_id = $1`,
      [session.session_id],
    );
    expect(mrRows.length).toBe(1);
    expect(mrRows[0]!.score).toBe(2);

    // Proctor flag cleared on the mock session and on the tutor session(s).
    const { rows: sessRows } = await db.query<{ is_proctored_active: boolean }>(
      `SELECT is_proctored_active FROM mock_test_sessions WHERE session_id = $1`,
      [session.session_id],
    );
    expect(sessRows[0]?.is_proctored_active).toBe(false);

    // BKT wrote mastery rows for each touched strand.
    const { rows: mastery } = await db.query<{ p_mastered: string; curriculum_strand: string }>(
      `SELECT curriculum_strand, p_mastered::text FROM concept_mastery WHERE student_id = $1`,
      [studentId],
    );
    expect(mastery.length).toBeGreaterThanOrEqual(2);
    const mechanics = mastery.find((m) => m.curriculum_strand === 'Механик');
    expect(mechanics).toBeDefined();
    // Two correct on Механик → posterior > P_INIT (0.3).
    expect(Number(mechanics!.p_mastered)).toBeGreaterThan(0.4);
  });

  it('predictor returns null band with zero samples; populated after a submit', async () => {
    const { studentId } = await createStudent(db);
    const emptyBand = await predictor.predict(studentId, 'physics');
    expect(emptyBand.sample_count).toBe(0);
    expect(emptyBand.band).toBeNull();

    const session = await mocks.start({
      studentId,
      paperId: PAPER_ID,
      idempotencyKey: randomUUID(),
    });
    const paper = await papers.getWithQuestions(PAPER_ID);
    const keyMap = await papers.getAnswerKey(PAPER_ID);
    const answers = paper.questions.map((q) => ({
      question_id: q.id,
      chosen_index: keyMap.get(q.id)!.answer, // all correct → 100%
    }));
    await mocks.submit({ sessionId: session.session_id, studentId, answers });

    const band = await predictor.predict(studentId, 'physics');
    expect(band.sample_count).toBe(1);
    expect(band.band).not.toBeNull();
    expect(band.band!.mid).toBe(100);
  });

  it('cohort returns insufficient_data when below the floor', async () => {
    const { studentId } = await createStudent(db);
    // Submit one result so a focal score exists.
    const session = await mocks.start({
      studentId,
      paperId: PAPER_ID,
      idempotencyKey: randomUUID(),
    });
    const paper = await papers.getWithQuestions(PAPER_ID);
    const keyMap = await papers.getAnswerKey(PAPER_ID);
    const allCorrect = paper.questions.map((q) => ({
      question_id: q.id,
      chosen_index: keyMap.get(q.id)!.answer,
    }));
    await mocks.submit({ sessionId: session.session_id, studentId, answers: allCorrect });

    const result = await cohort.percentile({ studentId, grade: 11, subject: 'physics' });
    expect(result.insufficient_data).toBe(true);
    if (result.insufficient_data) {
      expect(result.min_required).toBe(MIN_COHORT_SIZE);
    }
  });
});
