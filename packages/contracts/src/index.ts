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
