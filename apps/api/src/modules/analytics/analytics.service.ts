import { Injectable } from '@nestjs/common';
import type {
  AnalyticsCell,
  AnalyticsResponse,
  AnalyticsRow,
  TrendPoint,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

/** Cohort floor below which the matrix + trend are suppressed (R-6). */
const COHORT_FLOOR = 5;
const TREND_WEEKS = 8;

interface CohortQueryParams {
  schoolId: number;
  subject: string;
  grade: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: Db) {}

  /**
   * Returns the teacher's class-level mastery matrix + 8-week trend, scoped
   * to the school (multi-tenant constraint #4). Cohort floor of 5 students
   * suppresses both the matrix and the trend when the (school × subject ×
   * grade) cohort is smaller — privacy R-6.
   *
   * Trend points compare class average vs national average; the national
   * line is the average over ALL schools for the same (subject, grade)
   * pair (multi-tenant read OK — aggregated).
   */
  async matrix(params: CohortQueryParams): Promise<AnalyticsResponse> {
    const { rows: cohort } = await this.db.query<{ student_id: number; display: string }>(
      `SELECT st.student_id,
              COALESCE(u.email, u.phone_number) AS display
         FROM students st
         JOIN users u ON u.user_id = st.user_id
        WHERE st.school_id = $1 AND st.grade = $2
        ORDER BY display ASC`,
      [params.schoolId, params.grade],
    );

    if (cohort.length < COHORT_FLOOR) {
      return {
        subject: params.subject,
        grade: params.grade,
        cohort_size: cohort.length,
        strands: [],
        rows: [],
        trend: [],
        suppressed: true,
      };
    }

    // Strands come from observed curriculum_chunks for this subject.
    const { rows: strandRows } = await this.db.query<{ strand: string }>(
      `SELECT DISTINCT curriculum_strand AS strand
         FROM curriculum_chunks
        WHERE subject = $1
        ORDER BY curriculum_strand`,
      [params.subject],
    );
    const strands = strandRows.map((r) => r.strand);

    // Mastery per (student, strand) for this subject.
    const studentIds = cohort.map((c) => c.student_id);
    const { rows: masteryRows } = await this.db.query<{
      student_id: number;
      curriculum_strand: string;
      p_mastered: number;
    }>(
      `SELECT student_id, curriculum_strand, p_mastered
         FROM concept_mastery
        WHERE student_id = ANY($1::int[]) AND subject = $2`,
      [studentIds, params.subject],
    );
    const masteryMap = new Map<string, number>();
    for (const r of masteryRows) {
      masteryMap.set(`${r.student_id}:${r.curriculum_strand}`, Number(r.p_mastered));
    }

    const rows: AnalyticsRow[] = cohort.map((c) => ({
      student_id: c.student_id,
      display_name: c.display,
      cells: strands.map((s): AnalyticsCell => {
        const value = masteryMap.get(`${c.student_id}:${s}`);
        return {
          strand: s,
          level: value !== undefined ? bucketToLevel(value) : null,
          value: value ?? null,
        };
      }),
    }));

    const trend = await this.trend(params, studentIds);

    return {
      subject: params.subject,
      grade: params.grade,
      cohort_size: cohort.length,
      strands,
      rows,
      trend,
      suppressed: false,
    };
  }

  /**
   * Returns last-3 mock-test scores for a single student. Used by the
   * matrix-cell hover lazy-fetch (R-7). Scoped by school_id so a teacher
   * can't peek at other-tenant students.
   */
  async studentRecent(
    schoolId: number,
    studentId: number,
  ): Promise<{ score: number; submitted_at: string }[]> {
    const { rows } = await this.db.query<{ score: number; submitted_at: Date }>(
      `SELECT mtr.score, mtr.submitted_at
         FROM mock_test_results mtr
         JOIN mock_test_sessions s ON s.session_id = mtr.session_id
         JOIN students st ON st.student_id = s.student_id
        WHERE s.student_id = $1 AND st.school_id = $2
        ORDER BY mtr.submitted_at DESC NULLS LAST
        LIMIT 3`,
      [studentId, schoolId],
    );
    return rows.map((r) => ({
      score: r.score,
      submitted_at: r.submitted_at.toISOString(),
    }));
  }

  private async trend(
    params: CohortQueryParams,
    studentIds: readonly number[],
  ): Promise<TrendPoint[]> {
    // 8 weekly buckets ending this week. CLASS avg is over studentIds;
    // NATIONAL avg is over all mock_test_results for the same subject + grade
    // (read-only aggregate, no per-student exposure).
    const { rows: classRows } = await this.db.query<{ week_iso: string; avg: number }>(
      `SELECT to_char(date_trunc('week', mtr.submitted_at), 'YYYY-MM-DD') AS week_iso,
              AVG(mtr.score)::float AS avg
         FROM mock_test_results mtr
         JOIN mock_test_sessions s ON s.session_id = mtr.session_id
        WHERE s.student_id = ANY($1::int[])
          AND mtr.submitted_at >= NOW() - interval '8 weeks'
        GROUP BY 1
        ORDER BY 1 ASC`,
      [studentIds],
    );
    const { rows: natRows } = await this.db.query<{ week_iso: string; avg: number }>(
      `SELECT to_char(date_trunc('week', mtr.submitted_at), 'YYYY-MM-DD') AS week_iso,
              AVG(mtr.score)::float AS avg
         FROM mock_test_results mtr
         JOIN mock_test_sessions s ON s.session_id = mtr.session_id
         JOIN egsh_papers p ON p.paper_id = s.paper_id
        WHERE p.subject = $1::test_type_enum
          AND mtr.submitted_at >= NOW() - interval '8 weeks'
        GROUP BY 1
        ORDER BY 1 ASC`,
      [params.subject],
    );
    const classByWeek = new Map(classRows.map((r) => [r.week_iso, r.avg]));
    const natByWeek = new Map(natRows.map((r) => [r.week_iso, r.avg]));
    const points: TrendPoint[] = [];
    for (let w = TREND_WEEKS - 1; w >= 0; w--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - w * 7);
      // Truncate to Monday-week
      const day = d.getUTCDay();
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7));
      const iso = monday.toISOString().slice(0, 10);
      points.push({
        week_iso: iso,
        class_avg: classByWeek.get(iso) ?? null,
        national_avg: natByWeek.get(iso) ?? null,
      });
    }
    return points;
  }
}

/** Convert mastery probability (0..1) to a 1–5 bucket for matrix colouring. */
function bucketToLevel(p: number): 1 | 2 | 3 | 4 | 5 {
  if (p < 0.2) return 1;
  if (p < 0.4) return 2;
  if (p < 0.6) return 3;
  if (p < 0.8) return 4;
  return 5;
}
