import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

/** PRD §4.1 free-tier ceiling. Moza partner schools bypass. */
export const FREE_TIER_SESSIONS_PER_MONTH = 20;

export interface QuotaState {
  used: number;
  remaining: number;
  /** True if this student bypasses the cap (Moza partner school). */
  unlimited: boolean;
  /** True when used >= cap AND not unlimited. */
  blocked: boolean;
}

/**
 * Read-only quota inspection. Counts ai_tutor_sessions for the student in the
 * current calendar month (Asia/Ulaanbaatar). Bypass is decided by joining to
 * schools.is_moza_partner.
 *
 * NOTE: this service does not increment — incrementing happens implicitly when
 * AiTutorService inserts a new session row. The cap must therefore be checked
 * *before* the INSERT to avoid a race (we accept best-effort enforcement for
 * S03; strict serialization can move to Redis if telemetry shows abuse).
 */
@Injectable()
export class QuotaService {
  constructor(private readonly db: Db) {}

  async inspect(studentId: number, asOf: Date = new Date()): Promise<QuotaState> {
    const { rows } = await this.db.query<{ is_moza_partner: boolean; used: string }>(
      `SELECT COALESCE(sch.is_moza_partner, FALSE) AS is_moza_partner,
              (SELECT COUNT(*)::text
                 FROM ai_tutor_sessions s
                WHERE s.student_id = $1
                  AND s.started_at >= date_trunc('month', $2::timestamptz AT TIME ZONE 'Asia/Ulaanbaatar')
                                       AT TIME ZONE 'Asia/Ulaanbaatar') AS used
         FROM students st
         LEFT JOIN schools sch USING (school_id)
        WHERE st.student_id = $1`,
      [studentId, asOf.toISOString()],
    );
    const row = rows[0];
    if (!row) throw new Error(`No student row for student_id=${studentId}`);

    const used = Number(row.used);
    const unlimited = row.is_moza_partner;
    const remaining = unlimited
      ? Number.POSITIVE_INFINITY
      : Math.max(0, FREE_TIER_SESSIONS_PER_MONTH - used);
    return {
      used,
      remaining,
      unlimited,
      blocked: !unlimited && used >= FREE_TIER_SESSIONS_PER_MONTH,
    };
  }
}
