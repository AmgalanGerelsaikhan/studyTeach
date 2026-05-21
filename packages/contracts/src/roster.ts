import { z } from 'zod';

import { IdempotencyKey } from './index';

/**
 * One row in a teacher bulk roster upload. Phone is E.164 Mongolian;
 * national_id is OPTIONAL — when present it's hashed server-side before
 * persisting (PDP Law §4 data-minimization). Plain national_id NEVER
 * round-trips back from the server.
 */
export const RosterRow = z.object({
  full_name: z.string().min(1).max(120),
  phone_number: z.string().regex(/^\+976\d{8}$/, 'must be E.164 +976XXXXXXXX'),
  national_id: z
    .string()
    .regex(/^[А-ЯЁӨҮ]{2}\d{8}$/, 'Mongolian national ID format')
    .optional(),
  grade: z.number().int().min(1).max(12),
});
export type RosterRow = z.infer<typeof RosterRow>;

export const RosterValidationError = z.object({
  row_index: z.number().int().nonnegative(),
  field: z.string(),
  message: z.string(),
});
export type RosterValidationError = z.infer<typeof RosterValidationError>;

export const RosterUploadRequest = z.object({
  /** Rows are client-parsed (PapaParse worker mode) before submit. */
  rows: z.array(RosterRow).min(1).max(1000),
  idempotency_key: IdempotencyKey,
});
export type RosterUploadRequest = z.infer<typeof RosterUploadRequest>;

export const RosterUploadResponse = z.object({
  roster_id: z.number().int(),
  roster_hash: z.string().length(64),
  row_count: z.number().int().nonnegative(),
  errors: z.array(RosterValidationError),
  /** True if this roster was returned via idempotency, not freshly stored. */
  replayed: z.boolean(),
});
export type RosterUploadResponse = z.infer<typeof RosterUploadResponse>;

export const RosterCommitRequest = z.object({
  olympiad_id: z.number().int().positive(),
});
export type RosterCommitRequest = z.infer<typeof RosterCommitRequest>;

export const RosterCommitRowResult = z.object({
  row_index: z.number().int(),
  student_id: z.number().int().nullable(),
  registration_id: z.number().int().nullable(),
  error: z.string().nullable(),
});
export type RosterCommitRowResult = z.infer<typeof RosterCommitRowResult>;

export const RosterCommitResponse = z.object({
  roster_id: z.number().int(),
  results: z.array(RosterCommitRowResult),
  /** Invoice covering all successful registrations, ready for QPay. */
  invoice_id: z.number().int(),
});
export type RosterCommitResponse = z.infer<typeof RosterCommitResponse>;
