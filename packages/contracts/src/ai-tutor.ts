import { z } from 'zod';

import { Locale } from './index';
import { RefusalKey } from './refusals';

/**
 * Subject keys are the same identifiers the design system glyphs use
 * (`apps/web/components/st/motifs.tsx#StSubjectGlyph`). The curriculum corpus
 * stores `subject` as VARCHAR(50), so the enum is the source of truth that
 * keeps API + DB + UI aligned.
 */
export const TutorSubject = z.enum([
  'math',
  'physics',
  'chem',
  'bio',
  'history',
  'english',
  'mongolian',
  'info',
]);
export type TutorSubject = z.infer<typeof TutorSubject>;

export const TutorGrade = z.number().int().min(1).max(12);
export type TutorGrade = z.infer<typeof TutorGrade>;

/** UUIDv7 from the offline sync queue. Server uses for session-create dedup. */
export const IdempotencyKey = z
  .string()
  .uuid({ message: 'idempotency_key must be a UUID' })
  .max(36);
export type IdempotencyKey = z.infer<typeof IdempotencyKey>;

export const SessionStartRequest = z.object({
  lang: Locale.default('mn-Cyrl'),
  subject: TutorSubject,
  grade: TutorGrade,
  /** Client-generated UUIDv7; same key → same session row. */
  idempotency_key: IdempotencyKey,
});
export type SessionStartRequest = z.infer<typeof SessionStartRequest>;

export const SessionStartResponse = z.object({
  session_id: z.string().uuid(),
  lang: Locale,
  subject: TutorSubject,
  grade: TutorGrade,
  /** True if the same idempotency_key returned an existing session unchanged. */
  replayed: z.boolean(),
});
export type SessionStartResponse = z.infer<typeof SessionStartResponse>;

export const TurnRequest = z.object({
  text: z.string().min(1, 'text required').max(2000, 'text exceeds 2000 chars'),
});
export type TurnRequest = z.infer<typeof TurnRequest>;

/** Each citation points back to a curriculum_chunks row by source_ref. */
export const Citation = z.object({
  source_ref: z.string(),
  strand: z.string(),
});
export type Citation = z.infer<typeof Citation>;

export const AssistantTurn = z.object({
  role: z.literal('assistant'),
  text: z.string(),
  citations: z.array(Citation).min(1, 'assistant turn must have ≥1 citation'),
});

export const RefusalTurn = z.object({
  role: z.literal('refusal'),
  refusal_key: RefusalKey,
  text: z.string(),
});

export const TurnResponse = z.discriminatedUnion('role', [AssistantTurn, RefusalTurn]);
export type TurnResponse = z.infer<typeof TurnResponse>;

/** GET /ai-tutor/sessions/:id/messages — flat list, descending by message_id. */
export const TranscriptReplayQuery = z.object({
  limit: z.number().int().min(1).max(500).default(200),
  /** Cursor: return messages older than this message_id. */
  before: z.coerce.number().int().positive().optional(),
});
export type TranscriptReplayQuery = z.infer<typeof TranscriptReplayQuery>;

export const TranscriptMessage = z.object({
  message_id: z.number().int(),
  role: z.enum(['user', 'assistant', 'system', 'refusal']),
  content: z.string(),
  citations: z.array(Citation),
  refusal_key: RefusalKey.nullable(),
  created_at: z.string().datetime(),
});
export type TranscriptMessage = z.infer<typeof TranscriptMessage>;

export const TranscriptReplayResponse = z.object({
  messages: z.array(TranscriptMessage),
  next_before: z.number().int().nullable(),
});
export type TranscriptReplayResponse = z.infer<typeof TranscriptReplayResponse>;

/** SSE event types streamed during POST /ai-tutor/sessions/:id/turns. */
export const StreamEvent = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('delta'), delta: z.string() }),
  z.object({
    kind: z.literal('done'),
    citations: z.array(Citation).min(1),
    text: z.string(),
  }),
  z.object({
    kind: z.literal('refusal'),
    refusal_key: RefusalKey,
    text: z.string(),
  }),
]);
export type StreamEvent = z.infer<typeof StreamEvent>;
