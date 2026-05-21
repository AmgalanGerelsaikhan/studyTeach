import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

/**
 * Bayesian Knowledge Tracing.
 *
 * Two entry points share the same row model:
 *
 *   - bumpExposure(strands)  — unsupervised tutor exposure (no graded probe).
 *                              One-sided P' = P + (1 - P) * α capped at
 *                              MAX_EXPOSURE_P so unverified exposure never
 *                              claims the MASTERED bucket (≥0.8).
 *
 *   - observe(strand, correct) — graded probe from EGSh / Olympiad practice.
 *                                Full Corbett & Anderson (1995) update:
 *                                  P(L_n | correct) = P_L_prev (1 - p_slip)
 *                                                     / (P_L_prev (1 - p_slip)
 *                                                        + (1 - P_L_prev) p_guess)
 *                                  P(L_n | wrong)   = P_L_prev p_slip
 *                                                     / (P_L_prev p_slip
 *                                                        + (1 - P_L_prev) (1 - p_guess))
 *                                  P(L_{n+1}) = P(L_n | obs) + (1 - P(L_n | obs)) p_transit
 *
 * Parameters are the classic defaults; tunable via env in a future iteration.
 *
 * mastery_level_enum buckets (migration 0004 comment):
 *   <0.20 NOT_STARTED · <0.40 INTRODUCED · <0.60 DEVELOPING
 *   <0.80 PROFICIENT  · ≥0.80 MASTERED
 */
const ALPHA = 0.1;
const MAX_EXPOSURE_P = 0.75;
const P_INIT = 0.3; // schema default mirrored here for clarity
const P_TRANSIT = 0.1;
const P_SLIP = 0.1;
const P_GUESS = 0.25;

function bucketLevel(
  p: number,
): 'NOT_STARTED' | 'INTRODUCED' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED' {
  if (p < 0.2) return 'NOT_STARTED';
  if (p < 0.4) return 'INTRODUCED';
  if (p < 0.6) return 'DEVELOPING';
  if (p < 0.8) return 'PROFICIENT';
  return 'MASTERED';
}

export interface Observation {
  strand: string;
  correct: boolean;
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
    await this.applyUpdates(studentId, distinct, (prior) =>
      Math.min(MAX_EXPOSURE_P, prior + (1 - prior) * ALPHA),
    );
  }

  /**
   * Applies graded BKT updates for a list of observations. Observations may
   * include multiple probes on the same strand — they are applied in order so
   * the second probe sees the first's posterior, matching the sequential BKT
   * model.
   */
  async observe(studentId: number, observations: readonly Observation[]): Promise<void> {
    if (observations.length === 0) return;
    await this.db.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        // Cache to avoid re-SELECTing per same-strand observation.
        const priors = new Map<string, number>();
        for (const obs of observations) {
          let prior = priors.get(obs.strand);
          if (prior === undefined) {
            const { rows } = await client.query<{ p_mastered: string }>(
              `SELECT p_mastered::text FROM concept_mastery
                WHERE student_id = $1 AND curriculum_strand = $2`,
              [studentId, obs.strand],
            );
            prior = rows[0] ? Number(rows[0].p_mastered) : P_INIT;
          }
          const next = bktUpdate(prior, obs.correct);
          priors.set(obs.strand, next);
          await client.query(
            `INSERT INTO concept_mastery (student_id, curriculum_strand, p_mastered, level, last_updated)
             VALUES ($1, $2, $3, $4::mastery_level_enum, NOW())
             ON CONFLICT (student_id, curriculum_strand) DO UPDATE
               SET p_mastered = EXCLUDED.p_mastered,
                   level      = EXCLUDED.level,
                   last_updated = NOW()`,
            [studentId, obs.strand, next.toFixed(4), bucketLevel(next)],
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });
  }

  private async applyUpdates(
    studentId: number,
    strands: readonly string[],
    nextOf: (prior: number) => number,
  ): Promise<void> {
    await this.db.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        for (const strand of strands) {
          const { rows } = await client.query<{ p_mastered: string }>(
            `SELECT p_mastered::text FROM concept_mastery
              WHERE student_id = $1 AND curriculum_strand = $2`,
            [studentId, strand],
          );
          const prior = rows[0] ? Number(rows[0].p_mastered) : P_INIT;
          const next = nextOf(prior);
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

/**
 * One step of the Corbett & Anderson (1995) BKT update.
 *   - posterior given the observation
 *   - then forward through the transit (learn) probability
 */
export function bktUpdate(prior: number, correct: boolean): number {
  const posterior = correct
    ? (prior * (1 - P_SLIP)) / (prior * (1 - P_SLIP) + (1 - prior) * P_GUESS)
    : (prior * P_SLIP) / (prior * P_SLIP + (1 - prior) * (1 - P_GUESS));
  const next = posterior + (1 - posterior) * P_TRANSIT;
  return Math.max(0, Math.min(0.9999, next));
}
