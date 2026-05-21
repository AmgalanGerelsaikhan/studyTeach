import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';
import { LlmService } from '../../lib/llm/llm.module';

export interface RetrieveInput {
  lang: 'mn-Cyrl' | 'mn-Latn' | 'en';
  grade: number;
  subject: string;
  query: string;
  k: number;
}

export interface RetrievedChunk {
  chunk_id: number;
  strand: string;
  subject: string;
  grade: number;
  lang: string;
  body: string;
  source_ref: string;
  /** Cosine distance ∈ [0, 2] from pgvector's `<=>` operator. Lower = closer. */
  distance: number;
}

/**
 * RAG retrieval over the shared curriculum_chunks corpus.
 *
 * Scope is enforced in SQL: lang + subject + grade are mandatory filters
 * applied BEFORE the HNSW order-by, so the planner can use idx_cc_strand_grade
 * to prune the candidate set and the HNSW index for ordering. The corpus is
 * not tenant-scoped (CLAUDE.md: shared national curriculum) so no
 * organization_code filter — that intent is explicit in the WHERE clause as a
 * reminder to reviewers.
 */
@Injectable()
export class CurriculumService {
  constructor(
    private readonly db: Db,
    private readonly llm: LlmService,
  ) {}

  async retrieve(input: RetrieveInput): Promise<RetrievedChunk[]> {
    if (input.k <= 0 || input.k > 50) {
      throw new Error(`k must be in (0, 50], got ${input.k}`);
    }
    const [vec] = await this.llm.embed([input.query]);
    if (!vec) throw new Error('Embedder returned no vector for query');
    const vectorLiteral = `[${vec.join(',')}]`;

    const { rows } = await this.db.query<{
      chunk_id: string;
      strand: string;
      subject: string;
      grade: number;
      lang: string;
      body: string;
      source_ref: string;
      distance: string;
    }>(
      `SELECT chunk_id::text,
              strand,
              subject,
              grade,
              lang,
              body,
              source_ref,
              (embedding <=> $1::vector)::text AS distance
       FROM curriculum_chunks
       WHERE lang    = $2
         AND subject = $3
         AND grade   = $4
       ORDER BY embedding <=> $1::vector
       LIMIT $5`,
      [vectorLiteral, input.lang, input.subject, input.grade, input.k],
    );

    return rows.map((r) => ({
      chunk_id: Number(r.chunk_id),
      strand: r.strand,
      subject: r.subject,
      grade: r.grade,
      lang: r.lang,
      body: r.body,
      source_ref: r.source_ref,
      distance: Number(r.distance),
    }));
  }
}
