import { z } from 'zod';

// User role enum — matches user_role_enum in PRD §7.3
export const UserRole = z.enum(['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
export type UserRole = z.infer<typeof UserRole>;

// Mongolian Cyrillic only (CLAUDE.md constraint #1, tightened S06).
// Latn / en were removed when the platform was scoped to Mongolian-only.
export const Locale = z.enum(['mn-Cyrl']);
export type Locale = z.infer<typeof Locale>;

// Identity returned by GET /me
export const Me = z.object({
  user_id: z.number().int().positive(),
  primary_role: UserRole,
  organization_code: z.string().nullable(),
  locale: Locale,
});
export type Me = z.infer<typeof Me>;

// POST /auth/register — self-signup via the n8n-style wizard.
// Phone is Mongolia E.164; password has an OWASP-aligned minimum length.
// `organization_code` references schools.school_code and becomes the user's
// tenant scope. `profile` carries the role-specific wizard answers and
// lands in the user_profiles table.
//
// PLATFORM_ADMIN cannot self-sign-up — controller rejects with 403. The
// enum-level role list still includes it because /me + /login surface
// existing platform admins; the registration restriction lives in the
// handler, not the type.
export const SignupProfile = z.object({
  full_name: z.string().min(2).max(80),
  grade: z.string().max(10).optional(),
  subject: z.string().max(40).optional(),
  experience_years: z.string().max(10).optional(),
  position: z.string().max(40).optional(),
  child_school_code: z.string().max(50).optional(),
});
export type SignupProfile = z.infer<typeof SignupProfile>;

export const RegisterInput = z.object({
  phone_number: z.string().regex(/^\+976\d{8}$/, 'must be E.164 +976XXXXXXXX'),
  password: z.string().min(8, 'at least 8 characters'),
  primary_role: UserRole,
  email: z.string().email().max(150).optional(),
  organization_code: z.string().min(1).max(50).optional(),
  profile: SignupProfile,
});
export type RegisterInput = z.infer<typeof RegisterInput>;

// GET /schools/lookup?q=<text>&limit=<n> — anonymous school-picker source.
// Returns the safe public subset of `schools`. No PII; rate-limited.
export const SchoolLookupResult = z.object({
  school_code: z.string(),
  name: z.string(),
  aimag: z.string(),
  soum: z.string().nullable(),
  is_urban: z.boolean(),
});
export type SchoolLookupResult = z.infer<typeof SchoolLookupResult>;

// GET /public/stats — anonymous landing-page payload. All aggregates are
// rounded and contain no PII. Cached for 5 minutes server-side. Designed
// to render the hero stats + ЕЕШ showcase + destination carousel without
// further round-trips.
export const PublicStatsTotals = z.object({
  schools: z.number().int().nonnegative(),
  students: z.number().int().nonnegative(),
  egsh_papers: z.number().int().nonnegative(),
  destinations: z.number().int().nonnegative(),
  scholarships: z.number().int().nonnegative(),
});
export type PublicStatsTotals = z.infer<typeof PublicStatsTotals>;

export const PublicEgshSubject = z.object({
  subject: z.string(),
  label_mn: z.string(),
  year: z.number().int(),
});
export type PublicEgshSubject = z.infer<typeof PublicEgshSubject>;

export const PublicDestination = z.object({
  destination_code: z.string(),
  name_mn: z.string(),
  pathway_mn: z.string(),
  scholarship_count: z.number().int().nonnegative(),
});
export type PublicDestination = z.infer<typeof PublicDestination>;

export const PublicSampleQuestion = z.object({
  subject: z.string(),
  label_mn: z.string(),
  year: z.number().int(),
  prompt: z.string(),
  options: z.array(z.string()),
  answer_index: z.number().int().nonnegative(),
  strand: z.string().nullable(),
});
export type PublicSampleQuestion = z.infer<typeof PublicSampleQuestion>;

export const PublicStats = z.object({
  totals: PublicStatsTotals,
  egsh_subjects: z.array(PublicEgshSubject),
  destinations: z.array(PublicDestination),
  sample_question: PublicSampleQuestion.nullable(),
});
export type PublicStats = z.infer<typeof PublicStats>;

// Health response from GET /health
export const Health = z.object({
  status: z.literal('ok'),
  service: z.literal('@studyteach/api'),
  version: z.string(),
  uptime_seconds: z.number().nonnegative(),
});
export type Health = z.infer<typeof Health>;

export { RefusalKey, REFUSAL_KEYS, getRefusalText, type GetRefusalTextOptions } from './refusals';

export {
  TutorSubject,
  TutorGrade,
  IdempotencyKey,
  SessionStartRequest,
  SessionStartResponse,
  TurnRequest,
  TurnResponse,
  Citation,
  AssistantTurn,
  RefusalTurn,
  TranscriptReplayQuery,
  TranscriptReplayResponse,
  TranscriptMessage,
  StreamEvent,
} from './ai-tutor';

export {
  EgshSubject,
  PaperDescriptor,
  PaperWithQuestions,
  Question,
  MockStartRequest,
  MockStartResponse,
  AnswerSubmission,
  MockSubmitRequest,
  MockSubmitResponse,
  StrandResult,
  MissedConcept,
  PredictorResponse,
  CohortResponse,
} from './egsh';

export {
  OlympiadWindow,
  OlympiadCard,
  OlympiadListQuery,
  OlympiadListResponse,
  RegistrationRequest,
  RegistrationDescriptor,
} from './olympiad';

export {
  PaymentStatus,
  InvoiceCreateRequest,
  InvoiceDescriptor,
  QpayWebhookPayload,
  EbarimtReceipt,
} from './payments';

export { SignedTicketPayload, PublicKeyJwk, TicketResponse } from './ticket';

export {
  RosterRow,
  RosterValidationError,
  RosterUploadRequest,
  RosterUploadResponse,
  RosterCommitRequest,
  RosterCommitRowResult,
  RosterCommitResponse,
} from './roster';

export { AnalyticsCell, AnalyticsRow, TrendPoint, AnalyticsResponse } from './analytics';

export { SmsStatus, SmsTemplateKey, InboundSmsPayload, SmsDeliveryStatusPayload } from './sms';

export { SurgeToken, QueuePositionResponse } from './surge';

export {
  ContentPackAssetKind,
  ContentPackAsset,
  ContentPackManifest,
  ContentPackDescriptor,
  SignedContentPack,
} from './content-packs';

export {
  ParentLinkStatus,
  CreateParentLinkRequest,
  CreateParentLinkResponse,
  VerifyParentLinkRequest,
  LinkedChild,
  UpcomingOlympiad,
  MockTrajectoryPoint,
  PaymentRecord,
  ChildSummary,
  RevokeSchoolAccessRequest,
  ParentAuditEntry,
} from './parent';

export {
  FocusActivityKind,
  FocusActivityRef,
  CreateFocusSessionRequest,
  FocusSession,
  JoinFocusSessionRequest,
  FocusParticipant,
  ActiveFocusSession,
  FocusSessionSummary,
} from './focus';

export {
  PsrIdentity,
  PsrGradeEntry,
  PsrOlympiadEntry,
  PsrTeacherCpdEntry,
  PortableStudentRecord,
  PsrAccessGrant,
  CreatePsrGrantRequest,
  PsrAuditEntry,
} from './psr';

export {
  StudyAbroadDestinationCode,
  StudyAbroadBlueprintSection,
  ScholarshipLevel,
  ScholarshipFundingType,
  Destination,
  DestinationBlueprint,
  DestinationDetail,
  Scholarship,
  ScholarshipListQuery,
  ScholarshipWatch,
} from './study-abroad';

export { SchoolTeacherRow, SchoolTeachersResponse } from './school';

export {
  AcademyLanguageTrack,
  AcademyEnrollmentMode,
  CourseProgress,
  CourseCard,
  CourseListQuery,
  CourseListResponse,
  AcademyFacets,
  LessonSummary,
  LessonAsset,
  LessonContent,
  CourseEnrollmentState,
  CourseDetail,
  EnrollmentRequest,
  EnrollmentDescriptor,
  LessonCompleteRequest,
  LessonCompleteResponse,
  PlaybackToken,
  AssessmentQuestionKind,
  AssessmentKind,
  AssessmentQuestion,
  Assessment,
  AssessmentSubmitRequest,
  QuestionResult,
  AssessmentSubmitResponse,
  Certification,
  CpdTranscript,
} from './teacher-academy';
