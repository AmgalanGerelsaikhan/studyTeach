import { z } from 'zod';

// Wellbeing Pulse (PRD §4.7a, P2). Anonymous weekly mental-health pulse for
// boarding students. CLAUDE.md hard constraint #6: wellbeing data is
// sacrosanct — never used to train AI, never logged outside the audit trail,
// de-anonymised ONLY via the crisis-flag pathway.

export const WellbeingPulseRequest = z.object({
  /** ISO week — server validates current-week-only to prevent backfill. */
  pulse_week: z.number().int().min(1).max(53),
  /** Anon token derived client-side from (student_id, pulse_week, secret). */
  anon_token: z.string().min(32).max(128),
  /** 5-point Likert scales (1=worst, 5=best). */
  q1_mood: z.number().int().min(1).max(5),
  q2_sleep: z.number().int().min(1).max(5),
  q3_connection: z.number().int().min(1).max(5),
  q4_safety: z.number().int().min(1).max(5),
  /** Free-text. Server scans for crisis phrases — see crisis-phrases.ts. */
  q5_freetext: z.string().max(2000).nullable(),
});
export type WellbeingPulseRequest = z.infer<typeof WellbeingPulseRequest>;

export const WellbeingPulseResponse = z.object({
  response_id: z.number().int(),
  submitted_at: z.string().datetime(),
  /** TRUE only when a crisis phrase matched. Surfaces a brief safety message
   *  to the student so they know help is available — NOT the matched phrase. */
  safety_resources_shown: z.boolean(),
});
export type WellbeingPulseResponse = z.infer<typeof WellbeingPulseResponse>;

export const WellbeingCanSubmit = z.object({
  can_submit: z.boolean(),
  /** Current ISO week number per the server clock. */
  current_week: z.number().int(),
  /** UTC ISO date when the next pulse window opens, when can_submit=false. */
  next_window_opens: z.string().datetime().nullable(),
});
export type WellbeingCanSubmit = z.infer<typeof WellbeingCanSubmit>;

// ── Counselor surface ────────────────────────────────────────────────────

export const WellbeingCrisisStatus = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED']);
export type WellbeingCrisisStatus = z.infer<typeof WellbeingCrisisStatus>;

export const WellbeingCrisisFlag = z.object({
  flag_id: z.number().int(),
  response_id: z.number().int(),
  student_id: z.number().int(),
  school_id: z.number().int(),
  matched_phrase: z.string(),
  status: WellbeingCrisisStatus,
  assigned_to_user_id: z.number().int().nullable(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
  /** Counselor view ONLY: shows the q5_freetext that triggered the flag. */
  freetext_excerpt: z.string().nullable(),
  /** Anonymised student handle for the counselor inbox — surfaces grade +
   *  is_boarding, never name/email until the counselor explicitly reads. */
  student_handle: z.string(),
});
export type WellbeingCrisisFlag = z.infer<typeof WellbeingCrisisFlag>;

export const WellbeingCrisisFlagListResponse = z.object({
  items: z.array(WellbeingCrisisFlag),
});
export type WellbeingCrisisFlagListResponse = z.infer<typeof WellbeingCrisisFlagListResponse>;

export const UpdateCrisisFlagRequest = z.object({
  status: WellbeingCrisisStatus,
  /** Counselor's case note. Persisted in notes_jsonb. */
  note: z.string().max(2000).optional(),
});
export type UpdateCrisisFlagRequest = z.infer<typeof UpdateCrisisFlagRequest>;
