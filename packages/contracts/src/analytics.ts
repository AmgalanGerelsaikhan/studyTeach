import { z } from 'zod';

/**
 * One cell of the teacher's mastery matrix. `level` is the bucket per
 * mastery_level_enum, surfaced as a 1–5 ordinal so the client can colour
 * deterministically.
 *
 * `student_id` is opaque to the UI — the surface renders per-row metadata
 * separately. `value` is null when the (student, strand) pair has no
 * mock-test or tutor evidence yet.
 */
export const AnalyticsCell = z.object({
  strand: z.string(),
  level: z.number().int().min(1).max(5).nullable(),
  /** 0..1 probability — for hover tooltip. Null when level is null. */
  value: z.number().min(0).max(1).nullable(),
});
export type AnalyticsCell = z.infer<typeof AnalyticsCell>;

export const AnalyticsRow = z.object({
  student_id: z.number().int(),
  display_name: z.string(),
  /** Last-3 mock scores, oldest → newest. Surfaced on hover (lazy). */
  cells: z.array(AnalyticsCell),
});
export type AnalyticsRow = z.infer<typeof AnalyticsRow>;

/** One point in the 8-week trend chart. `week_iso` is the Monday ISO date. */
export const TrendPoint = z.object({
  week_iso: z.string(),
  class_avg: z.number().nullable(),
  national_avg: z.number().nullable(),
});
export type TrendPoint = z.infer<typeof TrendPoint>;

export const AnalyticsResponse = z.object({
  subject: z.string(),
  grade: z.number().int().min(1).max(12),
  cohort_size: z.number().int(),
  /** Strands in column order. */
  strands: z.array(z.string()),
  /** Rows in display order (alphabetical by display_name). Empty if cohort_size < 5. */
  rows: z.array(AnalyticsRow),
  /** 8-week trend. Empty if cohort_size < 5. */
  trend: z.array(TrendPoint),
  /** True when the matrix is suppressed for cohort-size privacy. */
  suppressed: z.boolean(),
});
export type AnalyticsResponse = z.infer<typeof AnalyticsResponse>;
