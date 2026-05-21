import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';

import { EGSH_2024_PAPERS } from './papers-2024';

/**
 * EGSh past-paper ingest CLI.
 *
 *   pnpm --filter @studyteach/api ingest:egsh
 *
 * Idempotent on (paper_id). Body is the canonical JSON the mock controller
 * reads — answer keys are stored server-side and stripped from the API
 * response that the timed mock UI receives.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    for (const paper of EGSH_2024_PAPERS) {
      const body = { questions: paper.questions };
      await pool.query(
        `INSERT INTO egsh_papers (paper_id, subject, year, lang, body, updated_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
         ON CONFLICT (paper_id) DO UPDATE
           SET subject    = EXCLUDED.subject,
               year       = EXCLUDED.year,
               lang       = EXCLUDED.lang,
               body       = EXCLUDED.body,
               updated_at = NOW()`,
        [paper.paper_id, paper.subject, paper.year, paper.lang, JSON.stringify(body)],
      );
    }
    const { rows } = await pool.query<{ subject: string; count: string }>(
      'SELECT subject, COUNT(*)::text AS count FROM egsh_papers GROUP BY subject ORDER BY subject',
    );
    console.warn(
      `[ingest:egsh] upserted ${EGSH_2024_PAPERS.length} papers · by subject: ${rows
        .map((r) => `${r.subject}=${r.count}`)
        .join(', ')}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ingest:egsh] failed:', err);
  process.exit(1);
});
