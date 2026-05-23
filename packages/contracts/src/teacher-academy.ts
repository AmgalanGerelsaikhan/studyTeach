import { z } from 'zod';

import { IdempotencyKey } from './index';

// Teacher Academy — E-025/E-026 (PRD §4.5). Catalog + player + lesson quizzes,
// FINAL grading, and CPD badges + transcript. Cohorts (E-027) extend this.

export const AcademyLanguageTrack = z.enum([
  'GENERAL',
  'ENGLISH_A1',
  'ENGLISH_A2',
  'ENGLISH_B1',
  'ENGLISH_B2',
]);
export type AcademyLanguageTrack = z.infer<typeof AcademyLanguageTrack>;

export const AcademyEnrollmentMode = z.enum(['SELF_PACED', 'COHORT']);
export type AcademyEnrollmentMode = z.infer<typeof AcademyEnrollmentMode>;

/** Course progress for the calling teacher. */
export const CourseProgress = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type CourseProgress = z.infer<typeof CourseProgress>;

// ── Certification + CPD transcript (E-026) ───────────────────────────────────
// Declared early because CourseDetail carries the caller's certification.

/** A CPD badge issued on a passing FINAL when all course lessons are complete. */
export const Certification = z.object({
  certification_id: z.number().int(),
  course_id: z.number().int(),
  course_title: z.string(),
  subject: z.string(),
  language_track: AcademyLanguageTrack,
  /** Final-assessment percentage at issuance (0-100). */
  score: z.number().int().min(0).max(100),
  /** Snapshot of academy_courses.cpd_credits at issuance — does not re-price. */
  cpd_credits: z.number().nonnegative(),
  /** TRUE once the MoE partnership endorses this course's credit (PRD §11.1). */
  moe_endorsed: z.boolean(),
  issued_at: z.string().datetime(),
});
export type Certification = z.infer<typeof Certification>;

/** A teacher's CPD transcript — totals + every badge issued. */
export const CpdTranscript = z.object({
  teacher_user_id: z.number().int(),
  total_cpd_credits: z.number().nonnegative(),
  total_courses_completed: z.number().int().nonnegative(),
  /** Subset of total_cpd_credits whose courses are MoE-endorsed. */
  moe_endorsed_credits: z.number().nonnegative(),
  certifications: z.array(Certification),
});
export type CpdTranscript = z.infer<typeof CpdTranscript>;

// ── Catalog ──────────────────────────────────────────────────────────────────

/** A card in the catalog grid. */
export const CourseCard = z.object({
  course_id: z.number().int(),
  title: z.string(),
  subject: z.string(),
  grade_min: z.number().int(),
  grade_max: z.number().int(),
  methodology: z.string().nullable(),
  language_track: AcademyLanguageTrack,
  cpd_credits: z.number().nonnegative(),
  estimated_minutes: z.number().int().positive(),
  summary: z.string(),
  lesson_count: z.number().int().nonnegative(),
  /** Distinct teachers enrolled — the prototype's "peer count". */
  peer_count: z.number().int().nonnegative(),
  /** Caller's progress when enrolled; null = not enrolled. */
  progress: CourseProgress.nullable(),
});
export type CourseCard = z.infer<typeof CourseCard>;

export const CourseListQuery = z.object({
  subject: z.array(z.string()).optional(),
  grade: z.number().int().min(1).max(12).optional(),
  methodology: z.string().optional(),
  language_track: AcademyLanguageTrack.optional(),
  /** Cursor = course_id of the last seen card. */
  cursor: z.number().int().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type CourseListQuery = z.infer<typeof CourseListQuery>;

export const CourseListResponse = z.object({
  items: z.array(CourseCard),
  /** Null when no more pages. */
  next_cursor: z.number().int().nullable(),
});
export type CourseListResponse = z.infer<typeof CourseListResponse>;

/**
 * Catalog facets — distinct values present in the PUBLISHED corpus. Drives the
 * filter dropdowns so a new course's methodology shows up without a code change.
 * `subjects` are raw codes (e.g. 'pedagogy', 'math'); the web layer maps codes
 * to mn-Cyrl labels via i18n. `methodologies` are already mn-Cyrl strings.
 */
export const AcademyFacets = z.object({
  subjects: z.array(z.string()),
  methodologies: z.array(z.string()),
  language_tracks: z.array(AcademyLanguageTrack),
});
export type AcademyFacets = z.infer<typeof AcademyFacets>;

// ── Course detail / syllabus ─────────────────────────────────────────────────

/** A lesson row in the syllabus sidebar. */
export const LessonSummary = z.object({
  lesson_id: z.number().int(),
  ordinal: z.number().int(),
  title: z.string(),
  has_video: z.boolean(),
  video_duration_seconds: z.number().int().nullable(),
  /** Lesson has an embedded quiz the teacher can take. */
  quiz_assessment_id: z.number().int().nullable(),
  /** Caller has completed this lesson. */
  completed: z.boolean(),
});
export type LessonSummary = z.infer<typeof LessonSummary>;

export const LessonAsset = z.object({
  asset_id: z.number().int(),
  kind: z.enum(['SLIDE', 'PDF', 'LINK']),
  url: z.string(),
  label: z.string(),
});
export type LessonAsset = z.infer<typeof LessonAsset>;

/** Per-lesson body — transcript + assets, fetched with the course detail. */
export const LessonContent = z.object({
  lesson_id: z.number().int(),
  transcript_mn: z.string(),
  assets: z.array(LessonAsset),
});
export type LessonContent = z.infer<typeof LessonContent>;

export const CourseEnrollmentState = z.object({
  enrollment_id: z.number().int(),
  mode: AcademyEnrollmentMode,
  enrolled_at: z.string().datetime(),
});
export type CourseEnrollmentState = z.infer<typeof CourseEnrollmentState>;

export const CourseDetail = z.object({
  course_id: z.number().int(),
  title: z.string(),
  subject: z.string(),
  grade_min: z.number().int(),
  grade_max: z.number().int(),
  methodology: z.string().nullable(),
  language_track: AcademyLanguageTrack,
  cpd_credits: z.number().nonnegative(),
  estimated_minutes: z.number().int().positive(),
  summary: z.string(),
  peer_count: z.number().int().nonnegative(),
  lessons: z.array(LessonSummary),
  lesson_content: z.array(LessonContent),
  /** The course's final assessment id; null if none. */
  final_assessment_id: z.number().int().nullable(),
  /** Caller's enrollment, or null. */
  enrollment: CourseEnrollmentState.nullable(),
  progress: CourseProgress,
  /** Caller's CPD badge for this course, or null if not yet earned. */
  caller_certification: Certification.nullable(),
});
export type CourseDetail = z.infer<typeof CourseDetail>;

// ── Enrollment + completion ──────────────────────────────────────────────────

export const EnrollmentRequest = z.object({
  course_id: z.number().int(),
  /** UUIDv7 from the offline queue. */
  idempotency_key: IdempotencyKey,
});
export type EnrollmentRequest = z.infer<typeof EnrollmentRequest>;

export const EnrollmentDescriptor = z.object({
  enrollment_id: z.number().int(),
  course_id: z.number().int(),
  mode: AcademyEnrollmentMode,
  enrolled_at: z.string().datetime(),
  /** True if the same teacher+course returned an existing row unchanged. */
  replayed: z.boolean(),
});
export type EnrollmentDescriptor = z.infer<typeof EnrollmentDescriptor>;

export const LessonCompleteRequest = z.object({
  watch_seconds: z.number().int().nonnegative().default(0),
  idempotency_key: IdempotencyKey,
});
export type LessonCompleteRequest = z.infer<typeof LessonCompleteRequest>;

export const LessonCompleteResponse = z.object({
  lesson_id: z.number().int(),
  completed_at: z.string().datetime(),
  replayed: z.boolean(),
  progress: CourseProgress,
});
export type LessonCompleteResponse = z.infer<typeof LessonCompleteResponse>;

// ── Cloudflare Stream playback ───────────────────────────────────────────────

/** Signed Cloudflare Stream playback grant for one lesson. */
export const PlaybackToken = z.object({
  lesson_id: z.number().int(),
  /** Signed Stream playback token; consumed by the player. */
  token: z.string(),
  /** HLS manifest URL built from the signed token. */
  hls_url: z.string().url(),
  /** Seconds until the token expires. */
  expires_in: z.number().int().positive(),
});
export type PlaybackToken = z.infer<typeof PlaybackToken>;

// ── Quiz / assessment ────────────────────────────────────────────────────────

export const AssessmentQuestionKind = z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER']);
export type AssessmentQuestionKind = z.infer<typeof AssessmentQuestionKind>;

export const AssessmentKind = z.enum(['LESSON_QUIZ', 'FINAL']);
export type AssessmentKind = z.infer<typeof AssessmentKind>;

/** A question as shown to the teacher — never carries the answer key. */
export const AssessmentQuestion = z.object({
  question_id: z.number().int(),
  ordinal: z.number().int(),
  prompt: z.string(),
  kind: AssessmentQuestionKind,
  /** Choices for MULTIPLE_CHOICE; empty for SHORT_ANSWER. */
  choices: z.array(z.string()),
  points: z.number().int().positive(),
});
export type AssessmentQuestion = z.infer<typeof AssessmentQuestion>;

export const Assessment = z.object({
  assessment_id: z.number().int(),
  course_id: z.number().int(),
  lesson_id: z.number().int().nullable(),
  kind: AssessmentKind,
  title: z.string(),
  pass_threshold: z.number().int(),
  questions: z.array(AssessmentQuestion),
});
export type Assessment = z.infer<typeof Assessment>;

/** answers: { [question_id]: choice index (MC) | string (short answer) }. */
export const AssessmentSubmitRequest = z.object({
  answers: z.record(z.string(), z.union([z.number().int(), z.string()])),
  /** UUIDv7 from the offline queue. */
  idempotency_key: IdempotencyKey,
});
export type AssessmentSubmitRequest = z.infer<typeof AssessmentSubmitRequest>;

export const QuestionResult = z.object({
  question_id: z.number().int(),
  /** Null when not auto-graded (SHORT_ANSWER without an answer key). */
  correct: z.boolean().nullable(),
});
export type QuestionResult = z.infer<typeof QuestionResult>;

export const AssessmentSubmitResponse = z.object({
  submission_id: z.number().int(),
  /** Percent 0-100; null when grading is deferred (e.g. SHORT_ANSWER w/o key). */
  score: z.number().int().nullable(),
  passed: z.boolean().nullable(),
  results: z.array(QuestionResult),
  /** True if the same (assessment, enrollment) returned an existing submission. */
  replayed: z.boolean(),
  /** Issued (or replayed) badge when a FINAL submission satisfies the criteria. */
  certification: Certification.nullable().optional(),
});
export type AssessmentSubmitResponse = z.infer<typeof AssessmentSubmitResponse>;
