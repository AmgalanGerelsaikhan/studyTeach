import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';

import { G11_PRACTICE } from './practice-g11';

/**
 * Practice-problem ingest CLI.
 *
 *   pnpm --filter @studyteach/api ingest:practice
 *
 * Idempotent on (subject, grade, lang, prompt) per migration 0006.
 * No embeddings — practice_problems are looked up by strand, not by
 * vector similarity.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    for (const p of G11_PRACTICE) {
      await pool.query(
        `INSERT INTO practice_problems (strand, grade, subject, lang, prompt, answer_key, difficulty, source, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'curated', NOW())
         ON CONFLICT (subject, grade, lang, prompt) DO UPDATE
           SET strand     = EXCLUDED.strand,
               answer_key = EXCLUDED.answer_key,
               difficulty = EXCLUDED.difficulty`,
        [p.strand, p.grade, p.subject, p.lang, p.prompt, p.answer_key, p.difficulty],
      );
    }
    const { rows } = await pool.query<{ subject: string; count: string }>(
      'SELECT subject, COUNT(*)::text AS count FROM practice_problems GROUP BY subject ORDER BY subject',
    );
    console.warn(
      `[ingest:practice] upserted ${G11_PRACTICE.length} problems · by subject: ${rows
        .map((r) => `${r.subject}=${r.count}`)
        .join(', ')}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ingest:practice] failed:', err);
  process.exit(1);
});
