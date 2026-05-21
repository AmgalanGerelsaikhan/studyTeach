/**
 * Integration test — real Postgres, no mocks.
 * Fixtures use phone prefix 'TEST-Q-' on users so they don't collide with seed.
 */
import 'dotenv/config';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

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

async function createStudent(db: Db, userId: number, schoolId: number | null): Promise<number> {
  const { rows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolId],
  );
  return rows[0]!.student_id;
}

async function createSchool(db: Db, code: string, isMoza: boolean): Promise<number> {
  const { rows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban, is_moza_partner)
     VALUES ($1, $2, 'Улаанбаатар', TRUE, $3)
     RETURNING school_id`,
    [code, `Test ${code}`, isMoza],
  );
  return rows[0]!.school_id;
}

async function insertSessions(db: Db, studentId: number, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await db.query(
      `INSERT INTO ai_tutor_sessions (student_id, lang, subject, grade)
       VALUES ($1, 'mn-Cyrl', 'physics', 11)`,
      [studentId],
    );
  }
}

describe('QuotaService.inspect (integration)', () => {
  let db: Db;
  let service: QuotaService;

  beforeAll(async () => {
    db = new Db(loadEnv());
    service = new QuotaService(db);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-Q-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-Q-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-Q-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-Q-%'`);
  });

  it('returns 0 used and not blocked for a fresh student', async () => {
    const userId = await createUser(db, 'TEST-Q-1');
    const schoolId = await createSchool(db, 'TEST-Q-S1', false);
    const studentId = await createStudent(db, userId, schoolId);

    const state = await service.inspect(studentId);
    expect(state.used).toBe(0);
    expect(state.blocked).toBe(false);
    expect(state.unlimited).toBe(false);
    expect(state.remaining).toBe(FREE_TIER_SESSIONS_PER_MONTH);
  });

  it('blocks once free-tier ceiling is reached', async () => {
    const userId = await createUser(db, 'TEST-Q-2');
    const schoolId = await createSchool(db, 'TEST-Q-S2', false);
    const studentId = await createStudent(db, userId, schoolId);

    await insertSessions(db, studentId, FREE_TIER_SESSIONS_PER_MONTH - 1);
    const nearLimit = await service.inspect(studentId);
    expect(nearLimit.blocked).toBe(false);
    expect(nearLimit.remaining).toBe(1);

    await insertSessions(db, studentId, 1);
    const atLimit = await service.inspect(studentId);
    expect(atLimit.used).toBe(FREE_TIER_SESSIONS_PER_MONTH);
    expect(atLimit.blocked).toBe(true);
    expect(atLimit.remaining).toBe(0);
  });

  it('never blocks a student whose school is a Moza partner', async () => {
    const userId = await createUser(db, 'TEST-Q-3');
    const schoolId = await createSchool(db, 'TEST-Q-S3', true);
    const studentId = await createStudent(db, userId, schoolId);

    await insertSessions(db, studentId, FREE_TIER_SESSIONS_PER_MONTH + 5);
    const state = await service.inspect(studentId);
    expect(state.unlimited).toBe(true);
    expect(state.blocked).toBe(false);
    expect(state.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it('throws on unknown student_id', async () => {
    await expect(service.inspect(999_999_999)).rejects.toThrow(/No student row/);
  });
});
