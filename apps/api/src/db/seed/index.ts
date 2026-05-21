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

    const { rows: schoolCount } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM schools',
    );
    const { rows: userCount } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM users',
    );

    console.warn(`[seed] schools: ${schoolCount[0]?.count} · users: ${userCount[0]?.count}`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
