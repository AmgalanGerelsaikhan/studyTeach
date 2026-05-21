import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';

import { OLYMPIAD_FIXTURES } from './fixtures';

/**
 * Olympiad directory ingest CLI.
 *
 *   pnpm --filter @studyteach/api ingest:olympiads
 *
 * Idempotent on (title, exam_date) per migration 0008.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    for (const o of OLYMPIAD_FIXTURES) {
      await pool.query(
        `INSERT INTO olympiads (title, organizer, subject, grade_min, grade_max,
                                target_audience, registration_opens, registration_closes,
                                exam_date, aimag, venue, is_online, base_fee_mnt)
         VALUES ($1, $2, $3, $4, $5, 'STUDENT'::target_audience_enum, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (title, exam_date) DO UPDATE
           SET organizer           = EXCLUDED.organizer,
               subject             = EXCLUDED.subject,
               grade_min           = EXCLUDED.grade_min,
               grade_max           = EXCLUDED.grade_max,
               registration_opens  = EXCLUDED.registration_opens,
               registration_closes = EXCLUDED.registration_closes,
               aimag               = EXCLUDED.aimag,
               venue               = EXCLUDED.venue,
               is_online           = EXCLUDED.is_online,
               base_fee_mnt        = EXCLUDED.base_fee_mnt`,
        [
          o.title,
          o.organizer,
          o.subject,
          o.grade_min,
          o.grade_max,
          o.registration_opens,
          o.registration_closes,
          o.exam_date,
          o.aimag,
          o.venue,
          o.is_online,
          o.base_fee_mnt,
        ],
      );
    }
    const { rows } = await pool.query<{ subject: string; count: string }>(
      'SELECT subject, COUNT(*)::text AS count FROM olympiads GROUP BY subject ORDER BY subject',
    );
    console.warn(
      `[ingest:olympiads] upserted ${OLYMPIAD_FIXTURES.length} rows · by subject: ${rows
        .map((r) => `${r.subject}=${r.count}`)
        .join(', ')}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ingest:olympiads] failed:', err);
  process.exit(1);
});
