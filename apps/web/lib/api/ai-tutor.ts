import type { TutorSubject } from '@studyteach/contracts';

import { uuidv7 } from '../offline/uuid';

import { apiFetch } from './base';

export interface StartSessionInput {
  lang: 'mn-Cyrl' | 'mn-Latn' | 'en';
  subject: TutorSubject;
  grade: number;
  /** Optional override; defaults to a fresh UUIDv7 so retries are safe. */
  idempotencyKey?: string;
}

export interface SessionDescriptor {
  session_id: string;
  lang: 'mn-Cyrl' | 'mn-Latn' | 'en';
  subject: TutorSubject;
  grade: number;
  replayed: boolean;
}

export interface AssistantTurnResult {
  role: 'assistant';
  text: string;
  citations: { source_ref: string; strand: string }[];
}

export interface RefusalTurnResult {
  role: 'refusal';
  refusal_key: string;
  text: string;
}

export type TurnResult = AssistantTurnResult | RefusalTurnResult;

export function startSession(input: StartSessionInput): Promise<SessionDescriptor> {
  return apiFetch<SessionDescriptor>('/ai-tutor/sessions', {
    method: 'POST',
    body: {
      lang: input.lang,
      subject: input.subject,
      grade: input.grade,
      idempotency_key: input.idempotencyKey ?? uuidv7(),
    },
  });
}

export function sendTurn(sessionId: string, text: string): Promise<TurnResult> {
  return apiFetch<TurnResult>(`/ai-tutor/sessions/${encodeURIComponent(sessionId)}/turns`, {
    method: 'POST',
    body: { text },
  });
}

export interface PracticeProblem {
  problem_id: number;
  strand: string;
  subject: string;
  grade: number;
  lang: string;
  prompt: string;
  answer_key: string;
  difficulty: number;
}

export interface FindPracticeInput {
  lang: 'mn-Cyrl' | 'mn-Latn' | 'en';
  subject: TutorSubject;
  grade: number;
  strand?: string;
  k?: number;
}

export function findPractice(input: FindPracticeInput): Promise<PracticeProblem[]> {
  const qs = new URLSearchParams({
    lang: input.lang,
    subject: input.subject,
    grade: String(input.grade),
    k: String(input.k ?? 2),
  });
  if (input.strand) qs.set('strand', input.strand);
  return apiFetch<PracticeProblem[]>(`/practice-problems?${qs.toString()}`);
}
