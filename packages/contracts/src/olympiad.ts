import { z } from 'zod';

import { IdempotencyKey } from './index';

export const OlympiadWindow = z.enum(['open', 'upcoming', 'closed']);
export type OlympiadWindow = z.infer<typeof OlympiadWindow>;

export const OlympiadCard = z.object({
  olympiad_id: z.number().int(),
  title: z.string(),
  organizer: z.string(),
  subject: z.string(),
  grade_min: z.number().int(),
  grade_max: z.number().int(),
  registration_opens: z.string().datetime(),
  registration_closes: z.string().datetime(),
  exam_date: z.string().datetime(),
  aimag: z.string().nullable(),
  venue: z.string().nullable(),
  is_online: z.boolean(),
  base_fee_mnt: z.number().int().nonnegative(),
  /** Whether the calling student already has a registrations row. */
  registered: z.boolean().optional(),
});
export type OlympiadCard = z.infer<typeof OlympiadCard>;

export const OlympiadListQuery = z.object({
  subject: z.array(z.string()).optional(),
  grade: z.number().int().min(1).max(12).optional(),
  is_online: z.boolean().optional(),
  aimag: z.string().optional(),
  fee_max: z.number().int().nonnegative().optional(),
  window: OlympiadWindow.optional(),
  /** Cursor = ISO exam_date of the last seen card (desc order). */
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type OlympiadListQuery = z.infer<typeof OlympiadListQuery>;

export const OlympiadListResponse = z.object({
  items: z.array(OlympiadCard),
  /** Null when no more pages. */
  next_cursor: z.string().datetime().nullable(),
});
export type OlympiadListResponse = z.infer<typeof OlympiadListResponse>;

export const RegistrationRequest = z.object({
  olympiad_id: z.number().int(),
  /** UUIDv7 from offline queue. */
  idempotency_key: IdempotencyKey,
});
export type RegistrationRequest = z.infer<typeof RegistrationRequest>;

export const RegistrationDescriptor = z.object({
  registration_id: z.number().int(),
  student_id: z.number().int(),
  olympiad_id: z.number().int(),
  signature_hash: z.string().length(64),
  payment_status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']),
  qr_payload: z.string().nullable(),
  created_at: z.string().datetime(),
  /** True if the same idempotency hash returned an existing row unchanged. */
  replayed: z.boolean(),
});
export type RegistrationDescriptor = z.infer<typeof RegistrationDescriptor>;
