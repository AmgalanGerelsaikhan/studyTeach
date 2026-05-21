/**
 * Integration test — real PG. Confirms mastery is per-student and that the
 * strand-prefix filter scopes correctly. Fixtures use TEST-MS- on phones +
 * school codes so they don't collide.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { MasteryService } from './mastery.service';

async function setupStudent(
  db: Db,
  suffix: string,
): Promise<{ userId: number; studentId: number }> {
  const phone = `TEST-MS-${suffix}`;
  const { rows: userRows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  const userId = userRows[0]!.user_id;
  const { rows: schoolRows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban) VALUES ($1, $2, 'УБ', TRUE) RETURNING school_id`,
    [`TEST-MS-S-${suffix}`, `Test ${suffix}`],
  );
  const { rows: studentRows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolRows[0]!.school_id],
  );
  return { userId, studentId: studentRows[0]!.student_id };
}

describe('MasteryService.forUser (integration)', () => {
  let db: Db;
  let service: MasteryService;

  beforeAll(() => {
    db = new Db(loadEnv());
    service = new MasteryService(db);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-MS-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-MS-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-MS-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-MS-%'`);
  });

  it('returns rows for the requested user, none for siblings', async () => {
    const a = await setupStudent(db, randomUUID().slice(0, 8));
    const b = await setupStudent(db, randomUUID().slice(0, 8));
    await db.query(
      `INSERT INTO concept_mastery (student_id, curriculum_strand, p_mastered, level)
       VALUES ($1, 'TEST/Mech', 0.42, 'DEVELOPING'::mastery_level_enum),
              ($1, 'TEST/Algebra', 0.30, 'INTRODUCED'::mastery_level_enum),
              ($2, 'TEST/Mech', 0.99, 'MASTERED'::mastery_level_enum)`,
      [a.studentId, b.studentId],
    );
    const got = await service.forUser(a.userId);
    expect(got).toHaveLength(2);
    expect(got.map((r) => r.curriculum_strand).sort()).toEqual(['TEST/Algebra', 'TEST/Mech']);
    for (const row of got) {
      expect(row.p_mastered).toBeGreaterThan(0);
    }
  });

  it('orders by p_mastered DESC', async () => {
    const a = await setupStudent(db, randomUUID().slice(0, 8));
    await db.query(
      `INSERT INTO concept_mastery (student_id, curriculum_strand, p_mastered, level)
       VALUES ($1, 'TEST/A', 0.2, 'INTRODUCED'::mastery_level_enum),
              ($1, 'TEST/B', 0.7, 'PROFICIENT'::mastery_level_enum),
              ($1, 'TEST/C', 0.45, 'DEVELOPING'::mastery_level_enum)`,
      [a.studentId],
    );
    const got = await service.forUser(a.userId);
    expect(got.map((r) => r.curriculum_strand)).toEqual(['TEST/B', 'TEST/C', 'TEST/A']);
  });

  it('honors strand prefix filter', async () => {
    const a = await setupStudent(db, randomUUID().slice(0, 8));
    await db.query(
      `INSERT INTO concept_mastery (student_id, curriculum_strand, p_mastered, level)
       VALUES ($1, 'Алгебр', 0.3, 'INTRODUCED'::mastery_level_enum),
              ($1, 'Алгоритм', 0.6, 'PROFICIENT'::mastery_level_enum),
              ($1, 'Геометр', 0.5, 'DEVELOPING'::mastery_level_enum)`,
      [a.studentId],
    );
    const got = await service.forUser(a.userId, 'Алг');
    expect(got.map((r) => r.curriculum_strand).sort()).toEqual(['Алгебр', 'Алгоритм']);
  });

  it('throws when the user has no students row', async () => {
    const phone = `TEST-MS-${randomUUID().slice(0, 8)}`;
    const { rows } = await db.query<{ user_id: number }>(
      `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
       VALUES ($1, $1, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
       RETURNING user_id`,
      [phone],
    );
    await expect(service.forUser(rows[0]!.user_id)).rejects.toThrow(/student record/);
  });
});
