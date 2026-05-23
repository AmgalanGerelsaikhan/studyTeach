import { z } from 'zod';

import { StudyAbroadDestinationCode } from './study-abroad';

// AI Application Coach — PRD §4.10c (P2).
//
// The coach never writes a personal statement from scratch — the contract
// enforces a draft-text floor (100 chars) and per-paragraph floor (30 chars).
// Rewrites are always marked as suggestions; the boolean `marked_as_suggestion`
// is part of the public response so callers can't be confused about intent.
//
// Mock interviews are gated server-side to the supported scholarship rotation
// (MEXT / Chevening / KGSP). Off-list submissions return the canonical
// `app-coach.refusal.unsupported-interview` refusal.

/** Supported scholarship rotation for the mock-interview generator. */
export const SUPPORTED_INTERVIEW_SCHOLARSHIPS = ['MEXT', 'Chevening', 'KGSP'] as const;
export const SupportedInterviewScholarship = z.enum(SUPPORTED_INTERVIEW_SCHOLARSHIPS);
export type SupportedInterviewScholarship = z.infer<typeof SupportedInterviewScholarship>;

/** Critique axes (PRD §4.10c). The LLM returns one feedback row per axis. */
export const CritiqueAxis = z.enum(['CLARITY', 'NARRATIVE', 'EVIDENCE', 'CONCLUSION']);
export type CritiqueAxis = z.infer<typeof CritiqueAxis>;

/**
 * Session creation. `draft_text` must be ≥ 100 chars — a blank or near-blank
 * submission triggers the `app-coach.refusal.blank-statement` refusal (the
 * coach NEVER produces a statement from scratch — PRD §4.10c).
 */
export const CreateCoachSessionRequest = z.object({
  destination_code: StudyAbroadDestinationCode,
  scholarship_id: z.number().int().positive().optional(),
  draft_text: z.string().min(100, 'draft_text must be at least 100 characters'),
});
export type CreateCoachSessionRequest = z.infer<typeof CreateCoachSessionRequest>;

/** Public view of a coach session. `purge_at` is surfaced so the UI can
 *  display the 90-day retention countdown. */
export const CoachSession = z.object({
  session_id: z.number().int().positive(),
  destination_code: StudyAbroadDestinationCode,
  scholarship_id: z.number().int().positive().nullable(),
  draft_word_count: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  purge_at: z.string().datetime(),
});
export type CoachSession = z.infer<typeof CoachSession>;

/** One structured-feedback row per axis. `suggested_actions` is a free-form
 *  array of short imperative phrases ("Tighten the second paragraph", …). */
export const CritiqueItem = z.object({
  axis: CritiqueAxis,
  feedback_text: z.string(),
  suggested_actions: z.array(z.string()),
});
export type CritiqueItem = z.infer<typeof CritiqueItem>;

export const CritiqueResponse = z.object({
  critiques: z.array(CritiqueItem),
});
export type CritiqueResponse = z.infer<typeof CritiqueResponse>;

/**
 * Paragraph rewrite request. The `paragraph_text` floor (30 chars) keeps the
 * coach from rewriting a single sentence fragment — if a student wants that
 * level of granularity they should ask the AI Tutor instead.
 */
export const RewriteParagraphRequest = z.object({
  paragraph_text: z.string().min(30, 'paragraph_text must be at least 30 characters'),
});
export type RewriteParagraphRequest = z.infer<typeof RewriteParagraphRequest>;

/**
 * Rewrite suggestion. `marked_as_suggestion: true` is a contract-level flag,
 * not a default — every rewrite the coach returns is a suggestion, and the
 * caller MUST explicitly POST to /accept before the rewrite is recorded as
 * applied. The boolean exists so a UI that omits the accept step still
 * communicates the intent.
 */
export const RewriteResponse = z.object({
  rewrite_id: z.number().int().positive(),
  original_paragraph: z.string(),
  suggested_rewrite: z.string(),
  marked_as_suggestion: z.literal(true),
});
export type RewriteResponse = z.infer<typeof RewriteResponse>;

export const AcceptRewriteResponse = z.object({
  rewrite_id: z.number().int().positive(),
  accepted: z.literal(true),
});
export type AcceptRewriteResponse = z.infer<typeof AcceptRewriteResponse>;

/**
 * Mock-interview generation request. `scholarship_name` is validated against
 * SUPPORTED_INTERVIEW_SCHOLARSHIPS — anything else is refused with the
 * canonical `app-coach.refusal.unsupported-interview` text.
 */
export const MockInterviewRequest = z.object({
  scholarship_name: z.string().min(1),
});
export type MockInterviewRequest = z.infer<typeof MockInterviewRequest>;

export const MockInterviewQuestion = z.object({
  prompt: z.string(),
  probes: z.array(z.string()),
});
export type MockInterviewQuestion = z.infer<typeof MockInterviewQuestion>;

export const MockInterviewResponse = z.object({
  interview_id: z.number().int().positive(),
  scholarship_name: SupportedInterviewScholarship,
  questions: z.array(MockInterviewQuestion).min(5).max(8),
});
export type MockInterviewResponse = z.infer<typeof MockInterviewResponse>;
