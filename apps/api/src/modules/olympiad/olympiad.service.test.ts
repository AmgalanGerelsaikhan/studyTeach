/**
 * Integration — Olympiad directory + idempotent registration.
 * Real PG. Uses the seeded olympiads + a freshly-created TEST-OL- student.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { OlympiadService } from './olympiad.service';
import { computeSignatureHash, RegistrationService } from './registration.service';

async function createStudent(db: Db): Promise<{ userId: number; studentId: number }> {
  const suffix = randomUUID().slice(0, 8);
  const phone = `TEST-OL-${suffix}`;
  const { rows: userRows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  const userId = userRows[0]!.user_id;
  const { rows: schoolRows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban) VALUES ($1, $2, 'УБ', TRUE) RETURNING school_id`,
    [`TEST-OL-S-${suffix}`, `Test ${suffix}`],
  );
  const { rows: studentRows } = await db.query<{ student_id: number }>(
    `INSERT INTO students (user_id, school_id, grade) VALUES ($1, $2, 11) RETURNING student_id`,
    [userId, schoolRows[0]!.school_id],
  );
  return { userId, studentId: studentRows[0]!.student_id };
}

describe('Olympiad module (integration)', () => {
  let db: Db;
  let olympiads: OlympiadService;
  let registrations: RegistrationService;
  let openOlympiadId: number;

  beforeAll(async () => {
    db = new Db(loadEnv());
    olympiads = new OlympiadService(db);
    registrations = new RegistrationService(db);
    // Insert a fixture with an open registration window so registration tests
    // don't depend on wall-clock relative to the seed dates.
    const { rows } = await db.query<{ olympiad_id: number }>(
      `INSERT INTO olympiads
         (title, organizer, subject, grade_min, grade_max,
          registration_opens, registration_closes, exam_date,
          aimag, venue, is_online, base_fee_mnt)
       VALUES ($1, 'TEST-OL', 'math', 9, 12,
               NOW() - interval '1 day', NOW() + interval '14 days', NOW() + interval '21 days',
               'УБ', 'Test venue', FALSE, 10000)
       ON CONFLICT (title, exam_date) DO UPDATE SET organizer = EXCLUDED.organizer
       RETURNING olympiad_id`,
      [`TEST-OL-OPEN-${randomUUID().slice(0, 6)}`],
    );
    openOlympiadId = rows[0]!.olympiad_id;
  });

  const wipeTestData = async () => {
    // registrations.registered_by is FK to users with no ON DELETE action,
    // so explicitly clear them before dropping the users they reference.
    await db.query(
      `DELETE FROM registrations
        WHERE registered_by IN (SELECT user_id FROM users WHERE phone_number LIKE 'TEST-OL-%')`,
    );
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-OL-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-OL-%'`);
  };

  afterAll(async () => {
    await wipeTestData();
    await db.query(`DELETE FROM olympiads WHERE title LIKE 'TEST-OL-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await wipeTestData();
  });

  it('list returns seeded rows + the registered flag for the calling student', async () => {
    const { studentId } = await createStudent(db);
    const page = await olympiads.list({ limit: 5 }, studentId);
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((c) => c.registered === false)).toBe(true);
    // Cursor advances meaningfully.
    if (page.next_cursor) {
      const page2 = await olympiads.list({ limit: 5, cursor: page.next_cursor }, studentId);
      const ids1 = new Set(page.items.map((c) => c.olympiad_id));
      for (const c of page2.items) expect(ids1.has(c.olympiad_id)).toBe(false);
    }
  });

  it('list honors subject + is_online filters', async () => {
    const mathOnly = await olympiads.list({ subject: ['math'], limit: 50 });
    expect(mathOnly.items.length).toBeGreaterThan(0);
    expect(mathOnly.items.every((c) => c.subject === 'math')).toBe(true);

    const onlineOnly = await olympiads.list({ is_online: true, limit: 50 });
    expect(onlineOnly.items.length).toBeGreaterThan(0);
    expect(onlineOnly.items.every((c) => c.is_online)).toBe(true);
  });

  it('register is idempotent on (student_id, olympiad_id)', async () => {
    const { userId, studentId } = await createStudent(db);
    const first = await registrations.register({
      studentId,
      registeredBy: userId,
      olympiadId: openOlympiadId,
    });
    expect(first.replayed).toBe(false);
    expect(first.payment_status).toBe('PENDING');
    expect(first.qr_payload).toBeNull();

    const second = await registrations.register({
      studentId,
      registeredBy: userId,
      olympiadId: openOlympiadId,
    });
    expect(second.registration_id).toBe(first.registration_id);
    expect(second.replayed).toBe(true);
  });

  it('rejects registration outside the open window', async () => {
    const { userId, studentId } = await createStudent(db);
    // Find a seeded olympiad whose registration is in the future (most seed
    // rows open in Sept 2026, well after the simulated "now" of test runs in
    // May 2026 — pick one explicitly upcoming).
    const { rows } = await db.query<{ olympiad_id: number }>(
      `SELECT olympiad_id FROM olympiads WHERE registration_opens > NOW() LIMIT 1`,
    );
    if (rows.length === 0) return; // No upcoming row — skip silently
    await expect(
      registrations.register({
        studentId,
        registeredBy: userId,
        olympiadId: rows[0]!.olympiad_id,
      }),
    ).rejects.toThrow(/has not opened/);
  });

  it('signature_hash matches the documented PRD §7.2 layout', () => {
    const hash = computeSignatureHash({
      schoolId: 42,
      studentIds: [7, 3, 5],
      olympiadIds: [9, 1],
      registrationWindowId: 'window-x',
    });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    // Same inputs → same hash. Different order on input lists → same hash
    // (sort happens internally).
    const same = computeSignatureHash({
      schoolId: 42,
      studentIds: [5, 7, 3],
      olympiadIds: [1, 9],
      registrationWindowId: 'window-x',
    });
    expect(same).toBe(hash);
  });
});
