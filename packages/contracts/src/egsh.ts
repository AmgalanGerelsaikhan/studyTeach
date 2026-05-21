import { z } from 'zod';

import { TutorGrade } from './ai-tutor';
import { IdempotencyKey, Locale } from './index';

/** EGSh past-paper subject keys. Superset of TutorSubject (adds Russian + Social + Geography). */
export const EgshSubject = z.enum([
  'math',
  'mongolian',
  'physics',
  'chem',
  'bio',
  'english',
  'russian',
  'history',
  'social',
  'geography',
]);
export type EgshSubject = z.infer<typeof EgshSubject>;

export const PaperDescriptor = z.object({
  paper_id: z.string(),
  subject: EgshSubject,
  year: z.number().int(),
  lang: Locale,
  question_count: z.number().int().nonnegative(),
});
export type PaperDescriptor = z.infer<typeof PaperDescriptor>;

export const Question = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(8),
  strand: z.string(),
});
export type Question = z.infer<typeof Question>;

/** Full paper as the mock UI receives it — answer keys stripped server-side. */
export const PaperWithQuestions = PaperDescriptor.extend({
  questions: z.array(Question),
});
export type PaperWithQuestions = z.infer<typeof PaperWithQuestions>;

export const MockStartRequest = z.object({
  paper_id: z.string(),
  /** Client UUIDv7 from offline queue — server returns existing session on collision. */
  idempotency_key: IdempotencyKey,
});
export type MockStartRequest = z.infer<typeof MockStartRequest>;

export const MockStartResponse = z.object({
  session_id: z.string().uuid(),
  paper_id: z.string(),
  subject: EgshSubject,
  is_proctored_active: z.boolean(),
  started_at: z.string().datetime(),
  replayed: z.boolean(),
});
export type MockStartResponse = z.infer<typeof MockStartResponse>;

export const AnswerSubmission = z.object({
  question_id: z.string(),
  /** Index into the question's options[] that the student picked. */
  chosen_index: z.number().int().min(0),
});
export type AnswerSubmission = z.infer<typeof AnswerSubmission>;

export const MockSubmitRequest = z.object({
  answers: z.array(AnswerSubmission),
});
export type MockSubmitRequest = z.infer<typeof MockSubmitRequest>;

export const StrandResult = z.object({
  strand: z.string(),
  correct: z.number().int().nonnegative(),
  wrong: z.number().int().nonnegative(),
});
export type StrandResult = z.infer<typeof StrandResult>;

export const MissedConcept = z.object({
  strand: z.string(),
  question_id: z.string(),
  prompt: z.string(),
});
export type MissedConcept = z.infer<typeof MissedConcept>;

export const MockSubmitResponse = z.object({
  session_id: z.string().uuid(),
  score: z.number().int(),
  max_score: z.number().int(),
  per_strand: z.array(StrandResult),
  /** Subset of questions answered wrong; powers the "remediate this concept" CTA list. */
  missed: z.array(MissedConcept),
});
export type MockSubmitResponse = z.infer<typeof MockSubmitResponse>;

/** Score-band predictor — rolling window, low/mid/high give the 95% band. */
export const PredictorResponse = z.object({
  subject: EgshSubject,
  sample_count: z.number().int().nonnegative(),
  band: z
    .object({
      low: z.number().int(),
      mid: z.number().int(),
      high: z.number().int(),
    })
    .nullable(),
  /** Boundary of the rolling window the band covers (Monday 00:00 ULAT). */
  window_started_at: z.string().datetime(),
});
export type PredictorResponse = z.infer<typeof PredictorResponse>;

/** Cohort percentile envelope — populated rows only when cohort floor (30) is met. */
export const CohortResponse = z.discriminatedUnion('insufficient_data', [
  z.object({
    insufficient_data: z.literal(false),
    grade: TutorGrade,
    subject: EgshSubject,
    aimag: z.string().nullable(),
    cohort_size: z.number().int().min(30),
    percentile: z.number().min(0).max(100),
  }),
  z.object({
    insufficient_data: z.literal(true),
    min_required: z.number().int().positive(),
    cohort_size: z.number().int().nonnegative(),
  }),
]);
export type CohortResponse = z.infer<typeof CohortResponse>;
