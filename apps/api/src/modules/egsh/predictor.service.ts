import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export interface PredictorBand {
  subject: string;
  sample_count: number;
  band: { low: number; mid: number; high: number } | null;
  window_started_at: string;
}

/**
 * Score-band predictor — rolling 4-week window per (student, subject), reset
 * weekly at Monday 00:00 Asia/Ulaanbaatar (week boundary chosen because
 * Mongolian school weeks start on Monday).
 *
 * Mid = mean of percent-score over the window.
 * Band low/high = mid ± 1 stddev (clamped to [0, 100]). null when no samples.
 *
 * "Reset weekly" means the window's start is anchored to the most recent
 * Monday — so a Tuesday read shows a 1-day window; a Sunday read shows ~6
 * days. This is intentional, per module doc "predictor reset weekly to
 * prevent gaming".
 */
@Injectable()
export class PredictorService {
  constructor(private readonly db: Db) {}

  async predict(
    studentId: number,
    subject: string,
    asOf: Date = new Date(),
  ): Promise<PredictorBand> {
    const windowStart = mondayOfWeekUlat(asOf);
    const { rows } = await this.db.query<{
      pct: string;
    }>(
      `SELECT (score::numeric * 100 / max_score)::text AS pct
         FROM mock_test_results
        WHERE student_id = $1 AND subject = $2 AND taken_at >= $3`,
      [studentId, subject, windowStart.toISOString()],
    );
    if (rows.length === 0) {
      return {
        subject,
        sample_count: 0,
        band: null,
        window_started_at: windowStart.toISOString(),
      };
    }
    const pcts = rows.map((r) => Number(r.pct));
    const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const variance = pcts.reduce((acc, p) => acc + (p - mean) ** 2, 0) / pcts.length;
    const stddev = Math.sqrt(variance);
    return {
      subject,
      sample_count: pcts.length,
      band: {
        low: Math.max(0, Math.round(mean - stddev)),
        mid: Math.round(mean),
        high: Math.min(100, Math.round(mean + stddev)),
      },
      window_started_at: windowStart.toISOString(),
    };
  }
}

/**
 * Returns the timestamp of the most recent Monday 00:00 in Asia/Ulaanbaatar
 * (UTC+8, no DST). Implementation uses a fixed offset since the platform is
 * Mongolia-only.
 */
export function mondayOfWeekUlat(now: Date): Date {
  const ULAT_OFFSET_MIN = 8 * 60;
  const utcMs = now.getTime();
  const ulatMs = utcMs + ULAT_OFFSET_MIN * 60 * 1000;
  const ulat = new Date(ulatMs);
  // JS getUTCDay: Sun=0 ... Sat=6. We want days since Monday.
  const dayFromMonday = (ulat.getUTCDay() + 6) % 7;
  const mondayUtcMs =
    Date.UTC(
      ulat.getUTCFullYear(),
      ulat.getUTCMonth(),
      ulat.getUTCDate() - dayFromMonday,
      0,
      0,
      0,
    ) -
    ULAT_OFFSET_MIN * 60 * 1000;
  return new Date(mondayUtcMs);
}
