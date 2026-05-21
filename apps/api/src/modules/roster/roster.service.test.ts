/**
 * Integration test for the bulk-roster lifecycle (E-017). Real Postgres.
 *
 * Fixtures use phone prefix 'TEST-RO-' on the uploader teacher, school code
 * 'TEST-RO-S-...', and TEST-RO-... on student rows. Cleanup happens
 * before each test + at suite end.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { RosterRow } from '@studyteach/contracts';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { EbarimtVendor } from '../ebarimt/ebarimt.vendor';
import { EbarimtService } from '../ebarimt/ebarimt.service';
import { InvoiceService } from '../payments/invoice.service';
import { QpayVendor } from '../payments/qpay.vendor';
import { RegistrationService } from '../olympiad/registration.service';

import { RosterService } from './roster.service';

async function createTeacherUser(db: Db, suffix: string): Promise<number> {
  const phone = `TEST-RO-T-${suffix}`;
  const { rows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'TEACHER'::user_role_enum, NULL, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  return rows[0]!.user_id;
}

async function createSchool(db: Db, suffix: string): Promise<number> {
  const { rows } = await db.query<{ school_id: number }>(
    `INSERT INTO schools (school_code, name, aimag, is_urban) VALUES ($1, $2, 'УБ', TRUE) RETURNING school_id`,
    [`TEST-RO-S-${suffix}`, `Test ${suffix}`],
  );
  return rows[0]!.school_id;
}

async function createOlympiad(db: Db, suffix: string): Promise<number> {
  const { rows } = await db.query<{ olympiad_id: number }>(
    `INSERT INTO olympiads
       (title, organizer, subject, grade_min, grade_max,
        registration_opens, registration_closes, exam_date,
        aimag, venue, is_online, base_fee_mnt)
     VALUES ($1, 'TEST-RO', 'math', 9, 12,
             NOW() - interval '1 day', NOW() + interval '14 days', NOW() + interval '21 days',
             'УБ', 'Test', FALSE, 10000)
     RETURNING olympiad_id`,
    [`TEST-RO-O-${suffix}`],
  );
  return rows[0]!.olympiad_id;
}

describe('RosterService (integration)', () => {
  let db: Db;
  let roster: RosterService;

  beforeAll(() => {
    const env = loadEnv();
    db = new Db(env);
    const registrations = new RegistrationService(db);
    const invoices = new InvoiceService(db, new QpayVendor(env), env);
    const ebarimt = new EbarimtService(db, new EbarimtVendor(env));
    void ebarimt; // not used directly by roster, but constructed to match wiring
    roster = new RosterService(db, registrations, invoices);
  });

  const wipe = async (): Promise<void> => {
    // Test school holds both the teacher (referenced via organization_code)
    // and the students created by roster.commit (which use auto-generated
    // phones not prefixed with TEST-RO). Cascade through school_id.
    const { rows: schools } = await db.query<{ school_id: number }>(
      `SELECT school_id FROM schools WHERE school_code LIKE 'TEST-RO-S-%'`,
    );
    const schoolIds = schools.map((s) => s.school_id);
    if (schoolIds.length > 0) {
      // Find all users that are students at these schools — those are the
      // bulk-roster-created rows whose phones DON'T match TEST-RO-%.
      const { rows: roleStudents } = await db.query<{ user_id: number }>(
        `SELECT user_id FROM students WHERE school_id = ANY($1::int[])`,
        [schoolIds],
      );
      const studentUserIds = roleStudents.map((r) => r.user_id);

      await db.query(
        `DELETE FROM tickets WHERE registration_id IN (
           SELECT r.registration_id FROM registrations r
           JOIN students st ON st.student_id = r.student_id
           WHERE st.school_id = ANY($1::int[])
         )`,
        [schoolIds],
      );
      await db.query(
        `DELETE FROM registrations WHERE student_id IN (
           SELECT student_id FROM students WHERE school_id = ANY($1::int[])
         )`,
        [schoolIds],
      );
      await db.query(`DELETE FROM students WHERE school_id = ANY($1::int[])`, [schoolIds]);
      if (studentUserIds.length > 0) {
        await db.query(`DELETE FROM users WHERE user_id = ANY($1::int[])`, [studentUserIds]);
      }
    }
    await db.query(`DELETE FROM invoices WHERE issued_to IN (
      SELECT user_id FROM users WHERE phone_number LIKE 'TEST-RO-%'
    )`);
    await db.query(`DELETE FROM roster_uploads WHERE uploaded_by IN (
      SELECT user_id FROM users WHERE phone_number LIKE 'TEST-RO-%'
    )`);
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-RO-%'`);
    await db.query(`DELETE FROM schools WHERE school_code LIKE 'TEST-RO-S-%'`);
    await db.query(`DELETE FROM olympiads WHERE title LIKE 'TEST-RO-%'`);
  };

  afterAll(async () => {
    await wipe();
    await db.end();
  });

  beforeEach(wipe);

  function buildRows(suffix: string, count: number): RosterRow[] {
    return Array.from({ length: count }, (_, i) => ({
      full_name: `Сурагч ${suffix} ${i}`,
      phone_number: `+976${(10000000 + parseInt(suffix.slice(0, 4), 16) + i).toString().slice(-8)}`,
      grade: 11 as const,
    }));
  }

  it('upload is idempotent on the canonical roster_hash', async () => {
    const suffix = randomUUID().slice(0, 8);
    const teacherId = await createTeacherUser(db, suffix);
    const schoolId = await createSchool(db, suffix);
    const rows = buildRows(suffix, 5);

    const first = await roster.upload({
      uploaderUserId: teacherId,
      schoolId,
      rows,
    });
    expect(first.replayed).toBe(false);
    expect(first.row_count).toBe(5);
    expect(first.errors).toHaveLength(0);

    const second = await roster.upload({
      uploaderUserId: teacherId,
      schoolId,
      rows,
    });
    expect(second.roster_id).toBe(first.roster_id);
    expect(second.replayed).toBe(true);
  });

  it('upload flags duplicate national_id within the same CSV', async () => {
    const suffix = randomUUID().slice(0, 8);
    const teacherId = await createTeacherUser(db, suffix);
    const schoolId = await createSchool(db, suffix);
    const base = buildRows(suffix, 3);
    const withDuplicateId: RosterRow[] = base.map((r) => ({
      ...r,
      national_id: 'УР12345678',
    }));

    const result = await roster.upload({
      uploaderUserId: teacherId,
      schoolId,
      rows: withDuplicateId,
    });
    // First row OK; rows 1 + 2 flagged as duplicates.
    expect(result.errors.length).toBe(2);
    expect(result.errors[0]!.field).toBe('national_id');
  });

  it('commit creates students + registrations + a single invoice', async () => {
    const suffix = randomUUID().slice(0, 8);
    const teacherId = await createTeacherUser(db, suffix);
    const schoolId = await createSchool(db, suffix);
    const olympiadId = await createOlympiad(db, suffix);
    const rows = buildRows(suffix, 4);

    const uploaded = await roster.upload({
      uploaderUserId: teacherId,
      schoolId,
      rows,
    });
    const committed = await roster.commit({
      rosterId: uploaded.roster_id,
      uploaderUserId: teacherId,
      olympiadId,
    });

    expect(committed.results).toHaveLength(4);
    const successful = committed.results.filter((r) => r.error === null);
    expect(successful.length).toBe(4);
    for (const r of successful) {
      expect(r.student_id).not.toBeNull();
      expect(r.registration_id).not.toBeNull();
    }
    expect(committed.invoice_id).toBeGreaterThan(0);

    // re-commit should fail (already committed)
    await expect(
      roster.commit({
        rosterId: uploaded.roster_id,
        uploaderUserId: teacherId,
        olympiadId,
      }),
    ).rejects.toThrow(/already committed/);
  });
});
