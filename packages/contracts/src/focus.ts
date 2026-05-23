import { z } from 'zod';

// Focus Mode — PRD §4.6 (P1). Teacher-initiated, time-bounded session that
// restricts a student's app surface to a single assigned activity (an AI Tutor
// session on a specific topic, an EGSh practice strand, an Academy lesson, or
// a curriculum reading). See docs/modules/focus-mode.md for the full brief.

export const FocusActivityKind = z.enum([
  'AI_TUTOR',
  'EGSH_PRACTICE',
  'ACADEMY_LESSON',
  'CURRICULUM_READING',
]);
export type FocusActivityKind = z.infer<typeof FocusActivityKind>;

/**
 * Discriminated union of per-kind activity payloads. The DB stores this as an
 * opaque JSONB blob; the contract is the only place that enforces shape.
 *
 *   AI_TUTOR           → { topic: string }
 *   EGSH_PRACTICE      → { subject: string, strand: string }
 *   ACADEMY_LESSON     → { lesson_id: number }
 *   CURRICULUM_READING → { chunk_id: number }
 */
export const FocusActivityRef = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('AI_TUTOR'), topic: z.string().min(1).max(120) }),
  z.object({
    kind: z.literal('EGSH_PRACTICE'),
    subject: z.string().min(1).max(60),
    strand: z.string().min(1).max(120),
  }),
  z.object({ kind: z.literal('ACADEMY_LESSON'), lesson_id: z.number().int().positive() }),
  z.object({ kind: z.literal('CURRICULUM_READING'), chunk_id: z.number().int().positive() }),
]);
export type FocusActivityRef = z.infer<typeof FocusActivityRef>;

/**
 * Per-kind request shape used by POST /focus/sessions. The top-level
 * `activity_kind` discriminator is duplicated inside `activity_ref` so the
 * client can build the ref without worrying about the redundancy — the
 * service cross-checks the two and rejects mismatches.
 */
export const CreateFocusSessionRequest = z.object({
  activity_kind: FocusActivityKind,
  // We intentionally accept `activity_ref` either with or without the `kind`
  // tag — the service injects it from `activity_kind` if missing. The schema
  // here demands the tagged form so it can validate the discriminated union.
  activity_ref: FocusActivityRef,
  scheduled_end: z.string().datetime(),
});
export type CreateFocusSessionRequest = z.infer<typeof CreateFocusSessionRequest>;

/**
 * Public view of a focus session. `live_participant_count` is computed at read
 * time (rows in focus_participants where left_at IS NULL). No student PII.
 */
export const FocusSession = z.object({
  session_id: z.number().int().positive(),
  code: z.string().length(6),
  activity_kind: FocusActivityKind,
  activity_ref: FocusActivityRef,
  scheduled_end: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
  live_participant_count: z.number().int().nonnegative(),
});
export type FocusSession = z.infer<typeof FocusSession>;

export const JoinFocusSessionRequest = z.object({
  code: z.string().length(6),
});
export type JoinFocusSessionRequest = z.infer<typeof JoinFocusSessionRequest>;

export const FocusParticipant = z.object({
  participant_id: z.number().int().positive(),
  session_id: z.number().int().positive(),
  student_user_id: z.number().int().positive(),
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
  leave_reason: z.string().nullable(),
});
export type FocusParticipant = z.infer<typeof FocusParticipant>;

/**
 * Subset returned by GET /focus/me/active. Same shape as FocusSession but
 * `live_participant_count` is omitted (a student doesn't need it) and the
 * code is omitted so a screenshare can't leak it.
 */
export const ActiveFocusSession = z.object({
  session_id: z.number().int().positive(),
  activity_kind: FocusActivityKind,
  activity_ref: FocusActivityRef,
  scheduled_end: z.string().datetime(),
});
export type ActiveFocusSession = z.infer<typeof ActiveFocusSession>;

/**
 * Anonymous post-session summary. No student ids, no per-row leave timestamps.
 * `leave_reasons` is the count breakdown by category; `median_session_minutes`
 * is the median (joined_at → left_at OR ended_at) duration in whole minutes.
 */
export const FocusSessionSummary = z.object({
  session_id: z.number().int().positive(),
  total_joined: z.number().int().nonnegative(),
  leave_reasons: z.object({
    session_ended: z.number().int().nonnegative(),
    teacher_closed: z.number().int().nonnegative(),
    student_left: z.number().int().nonnegative(),
    timeout: z.number().int().nonnegative(),
  }),
  median_session_minutes: z.number().nonnegative().nullable(),
});
export type FocusSessionSummary = z.infer<typeof FocusSessionSummary>;
