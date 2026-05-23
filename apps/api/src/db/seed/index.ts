import 'dotenv/config';
import { argon2id, hash } from 'argon2';

import { loadEnv } from '../../lib/config/env';
import { Pool } from 'pg';

/**
 * Seed minimal fixtures so the dev app has something to render.
 * - 3 schools across UB / Khentii / Bayankhongor (mix urban + soum).
 * - 5 fixture users covering all 5 roles, all on phone +976 9X XX XX XX.
 *
 * Mongolian-fluent fixtures (per CODING_STANDARDS.md "fixtures use Mongolian Cyrillic").
 * Idempotent: ON CONFLICT DO NOTHING. Safe to re-run.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    const passwordHash = await hash('dev-password', {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const schools = [
      {
        code: 'UB-23',
        name: '23-р дунд сургууль',
        aimag: 'Улаанбаатар',
        soum: null,
        is_urban: true,
        has_boarding: false,
      },
      {
        code: 'KH-04',
        name: 'Хэнтий аймгийн 4-р сургууль',
        aimag: 'Хэнтий',
        soum: 'Хэрлэн',
        is_urban: false,
        has_boarding: true,
      },
      {
        code: 'BH-01',
        name: 'Баянхонгор аймгийн төв сургууль',
        aimag: 'Баянхонгор',
        soum: 'Баянхонгор',
        is_urban: false,
        has_boarding: false,
      },
    ];

    for (const s of schools) {
      await pool.query(
        `INSERT INTO schools (school_code, name, aimag, soum, is_urban, has_boarding)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (school_code) DO NOTHING`,
        [s.code, s.name, s.aimag, s.soum, s.is_urban, s.has_boarding],
      );
    }

    const users = [
      {
        phone: '+97688110001',
        email: 'student@dev.local',
        role: 'STUDENT',
        org: 'UB-23',
        locale: 'mn-Cyrl',
      },
      {
        phone: '+97688110002',
        email: 'teacher@dev.local',
        role: 'TEACHER',
        org: 'UB-23',
        locale: 'mn-Cyrl',
      },
      {
        phone: '+97688110003',
        email: 'parent@dev.local',
        role: 'PARENT',
        org: 'UB-23',
        locale: 'mn-Cyrl',
      },
      {
        phone: '+97688110004',
        email: 'admin@dev.local',
        role: 'SCHOOL_ADMIN',
        org: 'KH-04',
        locale: 'mn-Cyrl',
      },
      {
        phone: '+97688110005',
        email: 'platform@dev.local',
        role: 'PLATFORM_ADMIN',
        org: null,
        locale: 'mn-Cyrl',
      },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
         VALUES ($1, $2, $3, $4::user_role_enum, $5, $6)
         ON CONFLICT (phone_number) DO NOTHING`,
        [u.phone, u.email, passwordHash, u.role, u.org, u.locale],
      );
    }

    // Dev convenience: turn 2FA off on every seeded fixture user. The auth
    // controller's 2FA branch still works against any user whose
    // two_factor_enabled = TRUE — this just keeps local logins one-step.
    // Never run this against a non-dev DB.
    await pool.query(
      `UPDATE users SET two_factor_enabled = FALSE
       WHERE phone_number = ANY($1::text[])`,
      [users.map((u) => u.phone)],
    );

    // Ensure the seeded STUDENT user has a `students` row at UB-23 with a
    // deterministic national_id_hash so the Parent Portal flow (E-033) can
    // resolve them. The hash is dev-only and not derived from a real ID.
    const DEV_STUDENT_NID_HASH = 'dev-student-001-' + 'a'.repeat(48); // pad to 64 chars
    await pool.query(
      `WITH stu AS (SELECT user_id FROM users WHERE phone_number = '+97688110001'),
            sch AS (SELECT school_id FROM schools WHERE school_code = 'UB-23')
       INSERT INTO students (user_id, school_id, grade, is_boarding, national_id_hash)
       SELECT stu.user_id, sch.school_id, 11, FALSE, $1
         FROM stu, sch
        ON CONFLICT (user_id) DO UPDATE
           SET school_id        = EXCLUDED.school_id,
               grade            = EXCLUDED.grade,
               national_id_hash = EXCLUDED.national_id_hash`,
      [DEV_STUDENT_NID_HASH],
    );

    // Pre-verify a link from the seeded PARENT to the seeded STUDENT so the
    // dev /parent flow has data on first load — no OTP round-trip needed.
    await pool.query(
      `WITH par AS (SELECT user_id FROM users WHERE phone_number = '+97688110003'),
            stu AS (SELECT s.student_id, s.national_id_hash, sc.school_code
                      FROM students s JOIN schools sc ON sc.school_id = s.school_id
                     WHERE s.national_id_hash = $1)
       INSERT INTO parent_child_links
         (parent_user_id, student_id, national_id_hash, school_code, status, verified_at)
       SELECT par.user_id, stu.student_id, stu.national_id_hash, stu.school_code,
              'VERIFIED'::parent_link_status, NOW()
         FROM par, stu
        ON CONFLICT (parent_user_id, student_id, status) DO NOTHING`,
      [DEV_STUDENT_NID_HASH],
    );

    const { rows: schoolCount } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM schools',
    );
    const { rows: userCount } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM users',
    );
    const { rows: linkCount } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM parent_child_links WHERE status = 'VERIFIED'`,
    );

    console.warn(
      `[seed] schools: ${schoolCount[0]?.count} · users: ${userCount[0]?.count} · parent_links: ${linkCount[0]?.count}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
