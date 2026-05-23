import { z } from 'zod';

// Parent Portal — PRD §4.8 (web subset; USSD deferred). A PARENT links to
// one or more STUDENT users via national-ID hash + school code + SMS OTP.

export const ParentLinkStatus = z.enum(['PENDING', 'VERIFIED', 'REVOKED']);
export type ParentLinkStatus = z.infer<typeof ParentLinkStatus>;

/** Initiating a link — server replies with otp_challenge that the SMS carries. */
export const CreateParentLinkRequest = z.object({
  national_id_hash: z.string().min(8),
  school_code: z.string().min(1),
});
export type CreateParentLinkRequest = z.infer<typeof CreateParentLinkRequest>;

export const CreateParentLinkResponse = z.object({
  link_id: z.number().int(),
  status: ParentLinkStatus,
  otp_challenge: z.string(),
});
export type CreateParentLinkResponse = z.infer<typeof CreateParentLinkResponse>;

export const VerifyParentLinkRequest = z.object({
  challenge: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});
export type VerifyParentLinkRequest = z.infer<typeof VerifyParentLinkRequest>;

export const LinkedChild = z.object({
  link_id: z.number().int(),
  student_id: z.number().int(),
  student_name: z.string(),
  school_code: z.string(),
  school_name: z.string(),
  grade: z.number().int().nullable(),
  is_boarding: z.boolean(),
  verified_at: z.string().datetime(),
});
export type LinkedChild = z.infer<typeof LinkedChild>;

export const UpcomingOlympiad = z.object({
  olympiad_id: z.number().int(),
  title: z.string(),
  exam_date: z.string().datetime(),
  registration_status: z.enum(['REGISTERED', 'PAID', 'PENDING_PAYMENT', 'CANCELLED']),
});
export type UpcomingOlympiad = z.infer<typeof UpcomingOlympiad>;

export const MockTrajectoryPoint = z.object({
  test_date: z.string().datetime(),
  subject: z.string(),
  score: z.number().int().min(0).max(100),
});
export type MockTrajectoryPoint = z.infer<typeof MockTrajectoryPoint>;

export const PaymentRecord = z.object({
  invoice_id: z.number().int(),
  amount: z.number(),
  status: z.string(),
  created_at: z.string().datetime(),
  description: z.string().nullable(),
});
export type PaymentRecord = z.infer<typeof PaymentRecord>;

export const ChildSummary = z.object({
  student_id: z.number().int(),
  student_name: z.string(),
  upcoming_olympiads: z.array(UpcomingOlympiad),
  recent_mocks: z.array(MockTrajectoryPoint),
  payments: z.array(PaymentRecord),
  is_boarding: z.boolean(),
});
export type ChildSummary = z.infer<typeof ChildSummary>;

export const RevokeSchoolAccessRequest = z.object({
  school_code: z.string().min(1),
  reason: z.string().max(500).optional(),
});
export type RevokeSchoolAccessRequest = z.infer<typeof RevokeSchoolAccessRequest>;

export const ParentAuditEntry = z.object({
  action: z.string(),
  reader_role: z.string(),
  reader_organization_code: z.string().nullable(),
  occurred_at: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type ParentAuditEntry = z.infer<typeof ParentAuditEntry>;
