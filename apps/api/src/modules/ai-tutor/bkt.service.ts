import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

/**
 * Bayesian Knowledge Tracing — MVP "exposure bump".
 *
 * Proper BKT needs an observation (right / wrong on a probe). The tutor turn
 * alone gives us exposure but no graded answer, so for S03 we apply the
 * one-sided update P' = P + (1 - P) * α — monotonically increasing toward
 * 1.0 but capped at MAX_EXPOSURE_P to keep "unverified exposure" below the
 * MASTERED bucket (≥0.8). Once EGSh probes feed correctness in S04 we replace
 * this with the full BKT update (p_slip, p_guess, p_transit) in the same
 * service surface.
 *
 * Mastery_level_enum buckets (per migration 0004 comment):
 *   <0.20 NOT_STARTED · <0.40 INTRODUCED · <0.60 DEVELOPING
 *   <0.80 PROFICIENT  · ≥0.80 MASTERED
 */
const ALPHA = 0.1;
const MAX_EXPOSURE_P = 0.75;

function bucketLevel(
  p: number,
): 'NOT_STARTED' | 'INTRODUCED' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED' {
  if (p < 0.2) return 'NOT_STARTED';
  if (p < 0.4) return 'INTRODUCED';
  if (p < 0.6) return 'DEVELOPING';
  if (p < 0.8) return 'PROFICIENT';
  return 'MASTERED';
}

@Injectable()
export class BktService {
  constructor(private readonly db: Db) {}

  /**
   * Applies an exposure bump to every distinct strand the student saw this
   * turn. Concurrent-safe via UPSERT on (student_id, curriculum_strand).
   */
  async bumpExposure(studentId: number, strands: readonly string[]): Promise<void> {
    if (strands.length === 0) return;
    const distinct = Array.from(new Set(strands));
    await this.db.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        for (const strand of distinct) {
          // SELECT existing row first so the bump math sees the current posterior.
          const { rows } = await client.query<{ p_mastered: string }>(
            `SELECT p_mastered::text FROM concept_mastery
              WHERE student_id = $1 AND curriculum_strand = $2`,
            [studentId, strand],
          );
          const prior = rows[0] ? Number(rows[0].p_mastered) : 0.3; // schema default
          const next = Math.min(MAX_EXPOSURE_P, prior + (1 - prior) * ALPHA);
          await client.query(
            `INSERT INTO concept_mastery (student_id, curriculum_strand, p_mastered, level, last_updated)
             VALUES ($1, $2, $3, $4::mastery_level_enum, NOW())
             ON CONFLICT (student_id, curriculum_strand) DO UPDATE
               SET p_mastered = EXCLUDED.p_mastered,
                   level      = EXCLUDED.level,
                   last_updated = NOW()`,
            [studentId, strand, next.toFixed(4), bucketLevel(next)],
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });
  }
}
