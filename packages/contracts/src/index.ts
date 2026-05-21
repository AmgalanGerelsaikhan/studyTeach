import { z } from 'zod';

// User role enum — matches user_role_enum in PRD §7.3
export const UserRole = z.enum(['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
export type UserRole = z.infer<typeof UserRole>;

export const Locale = z.enum(['mn-Cyrl', 'mn-Latn', 'en']);
export type Locale = z.infer<typeof Locale>;

// Identity returned by GET /me
export const Me = z.object({
  user_id: z.number().int().positive(),
  primary_role: UserRole,
  organization_code: z.string().nullable(),
  locale: Locale,
});
export type Me = z.infer<typeof Me>;

// Health response from GET /health
export const Health = z.object({
  status: z.literal('ok'),
  service: z.literal('@studyteach/api'),
  version: z.string(),
  uptime_seconds: z.number().nonnegative(),
});
export type Health = z.infer<typeof Health>;

export { RefusalKey, REFUSAL_KEYS, getRefusalText, type GetRefusalTextOptions } from './refusals';
