import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';
import { MockLlmVendor } from '../../../lib/llm/mock.vendor';
import { OpenAiLlmVendor } from '../../../lib/llm/openai.vendor';
import type { LlmVendor } from '../../../lib/llm/types';

import { G11_CHUNKS, type SeedChunk } from './g11';

/**
 * Curriculum ingest CLI: chunk → embed → upsert into curriculum_chunks.
 *
 * Idempotent — re-runs hit `uq_cc_natural_key` (lang, subject, grade, source_ref)
 * and refresh body + embedding in place.
 *
 *   pnpm --filter @studyteach/api ingest:curriculum
 *
 * Vendor selection follows LLM_VENDOR (dev default 'mock' yields deterministic
 * pseudo-random vectors; OpenAI stub still loud-fails without OPENAI_API_KEY).
 */
function buildVendor(): LlmVendor {
  const env = loadEnv();
  switch (env.LLM_VENDOR) {
    case 'mock':
      return new MockLlmVendor();
    case 'openai':
      return new OpenAiLlmVendor(env);
    case 'azure-openai':
    case 'local':
      throw new Error(
        `LLM_VENDOR=${env.LLM_VENDOR} is reserved but not yet implemented. Use 'mock' for dev.`,
      );
    default: {
      const exhaustive: never = env.LLM_VENDOR;
      throw new Error(`Unknown LLM_VENDOR: ${String(exhaustive)}`);
    }
  }
}

/** pgvector accepts `[v1,v2,...]` as text. */
function toPgVector(v: readonly number[]): string {
  return `[${v.join(',')}]`;
}

async function upsertChunk(pool: Pool, chunk: SeedChunk, embedding: number[]): Promise<void> {
  await pool.query(
    `INSERT INTO curriculum_chunks (strand, grade, subject, lang, body, embedding, source_ref, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::vector, $7, NOW())
     ON CONFLICT (lang, subject, grade, source_ref) DO UPDATE
       SET strand     = EXCLUDED.strand,
           body       = EXCLUDED.body,
           embedding  = EXCLUDED.embedding,
           updated_at = NOW()`,
    [
      chunk.strand,
      chunk.grade,
      chunk.subject,
      chunk.lang,
      chunk.body,
      toPgVector(embedding),
      chunk.source_ref,
    ],
  );
}

async function main(): Promise<void> {
  const env = loadEnv();
  const vendor = buildVendor();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    // Embed in one batch — mock vendor is cheap; real vendors will throttle.
    const bodies = G11_CHUNKS.map((c) => c.body);
    const vectors = await vendor.embed(bodies);
    if (vectors.length !== G11_CHUNKS.length) {
      throw new Error(`Embedding count mismatch: ${vectors.length} vs ${G11_CHUNKS.length}`);
    }

    for (let i = 0; i < G11_CHUNKS.length; i += 1) {
      const chunk = G11_CHUNKS[i];
      const vec = vectors[i];
      if (!chunk || !vec) throw new Error(`Missing chunk or vector at index ${i}`);
      await upsertChunk(pool, chunk, vec);
    }

    const { rows } = await pool.query<{ subject: string; count: string }>(
      'SELECT subject, COUNT(*)::text AS count FROM curriculum_chunks GROUP BY subject ORDER BY subject',
    );
    console.warn(
      `[ingest] vendor=${vendor.name} · upserted ${G11_CHUNKS.length} chunks · by subject: ${rows
        .map((r) => `${r.subject}=${r.count}`)
        .join(', ')}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ingest] failed:', err);
  process.exit(1);
});
