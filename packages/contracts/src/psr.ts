import { z } from 'zod';

// Portable Student Record — PRD §4.9. National-ID-keyed transcript that
// follows a herder family's child across school transfers. Owner controls
// per-school read access; every read writes an audit_log row.

export const PsrIdentity = z.object({
  portable_record_uuid: z.string().uuid(),
  display_name: z.string(),
  current_school_code: z.string().nullable(),
  current_school_name: z.string().nullable(),
  grade: z.number().int().nullable(),
  is_boarding: z.boolean(),
});
export type PsrIdentity = z.infer<typeof PsrIdentity>;

export const PsrGradeEntry = z.object({
  test_id: z.number().int(),
  subject: z.string(),
  test_type: z.string(),
  score: z.number().int(),
  max_score: z.number().int(),
  percentile: z.number().nullable(),
  taken_at: z.string().datetime(),
});
export type PsrGradeEntry = z.infer<typeof PsrGradeEntry>;

export const PsrOlympiadEntry = z.object({
  registration_id: z.number().int(),
  olympiad_id: z.number().int(),
  title: z.string(),
  organizer: z.string(),
  subject: z.string(),
  exam_date: z.string().datetime(),
  payment_status: z.string(),
});
export type PsrOlympiadEntry = z.infer<typeof PsrOlympiadEntry>;

export const PsrTeacherCpdEntry = z.object({
  certification_id: z.number().int(),
  course_title: z.string(),
  cpd_credits: z.number().nonnegative(),
  moe_endorsed: z.boolean(),
  issued_at: z.string().datetime(),
});
export type PsrTeacherCpdEntry = z.infer<typeof PsrTeacherCpdEntry>;

export const PortableStudentRecord = z.object({
  identity: PsrIdentity,
  grades: z.array(PsrGradeEntry),
  olympiads: z.array(PsrOlympiadEntry),
  teacher_cpd: z.array(PsrTeacherCpdEntry),
  // wellbeing_flags omitted in v1 — gated on §4.7a landing, counselor-only.
});
export type PortableStudentRecord = z.infer<typeof PortableStudentRecord>;

export const PsrAccessGrant = z.object({
  grant_id: z.number().int(),
  portable_record_uuid: z.string().uuid(),
  grantee_school_code: z.string(),
  granted_by_user_id: z.number().int(),
  reason: z.string().nullable(),
  granted_at: z.string().datetime(),
  revoked_at: z.string().datetime().nullable(),
});
export type PsrAccessGrant = z.infer<typeof PsrAccessGrant>;

export const CreatePsrGrantRequest = z.object({
  grantee_school_code: z.string().min(1),
  reason: z.string().max(500).optional(),
});
export type CreatePsrGrantRequest = z.infer<typeof CreatePsrGrantRequest>;

export const PsrAuditEntry = z.object({
  action: z.string(),
  reader_role: z.string(),
  reader_organization_code: z.string().nullable(),
  occurred_at: z.string().datetime(),
  reason: z.string().nullable(),
});
export type PsrAuditEntry = z.infer<typeof PsrAuditEntry>;
