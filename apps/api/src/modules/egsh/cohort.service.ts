import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export const MIN_COHORT_SIZE = 30;

export type CohortResult =
  | {
      insufficient_data: false;
      grade: number;
      subject: string;
      aimag: string | null;
      cohort_size: number;
      percentile: number;
    }
  | {
      insufficient_data: true;
      min_required: number;
      cohort_size: number;
    };

/**
 * Anonymous percentile against grade × subject (+ optional aimag). Returns
 * `insufficient_data: true` when the cohort is below MIN_COHORT_SIZE — never
 * leaks individual identifiers, never returns a percentile that could be
 * triangulated from a small group (PRD §10.2 + module doc).
 *
 * Uses the student's most recent result for the (subject) as the focal score.
 */
@Injectable()
export class CohortService {
  constructor(private readonly db: Db) {}

  async percentile(input: {
    studentId: number;
    grade: number;
    subject: string;
    aimag?: string;
  }): Promise<CohortResult> {
    // The student's most recent score, as a percentage.
    const { rows: focalRows } = await this.db.query<{ pct: string }>(
      `SELECT (score::numeric * 100 / max_score)::text AS pct
         FROM mock_test_results
        WHERE student_id = $1 AND subject = $2
        ORDER BY taken_at DESC
        LIMIT 1`,
      [input.studentId, input.subject],
    );
    const focal = focalRows[0] ? Number(focalRows[0].pct) : null;
    if (focal === null) {
      return { insufficient_data: true, min_required: MIN_COHORT_SIZE, cohort_size: 0 };
    }

    // Cohort = every student at this grade who has at least one result for
    // this subject; if `aimag` is given, restrict by their school's aimag.
    // We compare on each cohort member's most recent score.
    const params: unknown[] = [input.subject, input.grade];
    let aimagClause = '';
    if (input.aimag) {
      params.push(input.aimag);
      aimagClause = ` AND sch.aimag = $${params.length}`;
    }
    const { rows } = await this.db.query<{ pct: string }>(
      `WITH latest AS (
         SELECT DISTINCT ON (mr.student_id)
                mr.student_id,
                (mr.score::numeric * 100 / mr.max_score) AS pct
           FROM mock_test_results mr
           JOIN students st  ON st.student_id = mr.student_id
           LEFT JOIN schools sch ON sch.school_id = st.school_id
          WHERE mr.subject = $1
            AND st.grade   = $2
            ${aimagClause}
          ORDER BY mr.student_id, mr.taken_at DESC
       )
       SELECT pct::text FROM latest`,
      params,
    );
    const cohortSize = rows.length;
    if (cohortSize < MIN_COHORT_SIZE) {
      return { insufficient_data: true, min_required: MIN_COHORT_SIZE, cohort_size: cohortSize };
    }
    const cohortPcts = rows.map((r) => Number(r.pct)).sort((a, b) => a - b);
    // Percentile = % of cohort scoring at or below focal.
    const belowOrEqual = cohortPcts.filter((p) => p <= focal).length;
    const percentile = (belowOrEqual / cohortSize) * 100;
    return {
      insufficient_data: false,
      grade: input.grade,
      subject: input.subject,
      aimag: input.aimag ?? null,
      cohort_size: cohortSize,
      percentile: Math.round(percentile * 100) / 100,
    };
  }
}
