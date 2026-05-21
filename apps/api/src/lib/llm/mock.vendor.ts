import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type { GenerateInput, LlmVendor, TokenChunk } from './types';

/**
 * Deterministic mock vendor. Same input → same output stream. No network.
 *
 * Why deterministic: tests for citations / refusals / quota / mastery must be
 * reproducible without snapshots and without an OpenAI key. The body of every
 * generated response embeds a `[MOCK:<hash>]` sentinel so tests can assert
 * both the stream contents and the upstream prompt that produced it.
 *
 * Embeddings are also deterministic — a 1024-dim vector derived from the SHA-256
 * of the text, expanded with a seeded LCG. Real-vendor cosine similarity won't
 * align (different model entirely) but the mock RAG pipeline still exercises
 * pgvector index code paths end-to-end.
 */
@Injectable()
export class MockLlmVendor implements LlmVendor {
  readonly name = 'mock' as const;

  async *generate(input: GenerateInput): AsyncIterable<TokenChunk> {
    const hash = createHash('sha256').update(JSON.stringify(input.messages)).digest('hex');
    const lastUser = [...input.messages].reverse().find((m) => m.role === 'user');
    const echo = (lastUser?.content ?? '').slice(0, 60);
    const body = `Хариулт (mock): ${echo} [MOCK:${hash.slice(0, 12)}]`;

    // Stream one token per word so first-token latency is observable.
    const tokens = body.split(/(\s+)/);
    for (let i = 0; i < tokens.length; i += 1) {
      const piece = tokens[i] ?? '';
      const last = i === tokens.length - 1;
      yield { delta: piece, ...(last ? { finish_reason: 'stop' as const } : {}) };
    }
  }

  async embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((t) => pseudoVector(t, 1024)));
  }
}

/**
 * Produces a deterministic, unit-normalized 1024-dim vector from `text`.
 * Uses SHA-256 as the seed for an LCG to keep stdlib-only.
 */
function pseudoVector(text: string, dim: number): number[] {
  const seedBuf = createHash('sha256')
    .update(text || randomBytes(8))
    .digest();
  // Mix the 32 bytes of the SHA-256 into a single 32-bit LCG seed.
  let state = 0;
  for (let i = 0; i < seedBuf.length; i += 1) {
    state = (state * 31 + (seedBuf[i] ?? 0)) >>> 0;
  }
  const out = new Array<number>(dim);
  let sumSq = 0;
  for (let i = 0; i < dim; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const v = state / 0xffffffff - 0.5; // ∈ [-0.5, 0.5)
    out[i] = v;
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dim; i += 1) {
    out[i] = (out[i] ?? 0) / norm;
  }
  return out;
}
