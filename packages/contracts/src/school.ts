import { z } from 'zod';

// School-admin surface (PRD §4.4). SCHOOL_ADMIN sees the teachers at their
// own organization_code only. PLATFORM_ADMIN can read across orgs via the
// `?organization_code=` query param.

export const SchoolTeacherRow = z.object({
  user_id: z.number().int(),
  email: z.string().nullable(),
  /** Snapshot of academy_certifications count for this teacher. */
  certifications_count: z.number().int().nonnegative(),
  /** Sum of cpd_credits across this teacher's certifications. */
  total_cpd_credits: z.number().nonnegative(),
  /** TIMESTAMPTZ of most-recent certification issuance; null if none. */
  last_certified_at: z.string().datetime().nullable(),
});
export type SchoolTeacherRow = z.infer<typeof SchoolTeacherRow>;

export const SchoolTeachersResponse = z.object({
  organization_code: z.string(),
  items: z.array(SchoolTeacherRow),
});
export type SchoolTeachersResponse = z.infer<typeof SchoolTeachersResponse>;
