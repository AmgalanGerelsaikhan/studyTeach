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

export interface MasteryRow {
  curriculum_strand: string;
  level: 'NOT_STARTED' | 'INTRODUCED' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  p_mastered: number;
  last_updated: string;
}

export function fetchMyMastery(strandPrefix?: string): Promise<MasteryRow[]> {
  const qs = strandPrefix ? `?strand_prefix=${encodeURIComponent(strandPrefix)}` : '';
  return apiFetch<MasteryRow[]>(`/me/mastery${qs}`);
}

export interface TranscriptMessage {
  message_id: number;
  role: 'user' | 'assistant' | 'system' | 'refusal';
  content: string;
  citations: { source_ref: string; strand: string }[];
  refusal_key: string | null;
  created_at: string;
}

export function fetchTranscript(
  sessionId: string,
  opts: { limit?: number; before?: number } = {},
): Promise<{ messages: TranscriptMessage[]; next_before: number | null }> {
  const qs = new URLSearchParams();
  qs.set('limit', String(opts.limit ?? 200));
  if (opts.before !== undefined) qs.set('before', String(opts.before));
  return apiFetch(`/ai-tutor/sessions/${encodeURIComponent(sessionId)}/messages?${qs.toString()}`);
}

/**
 * Stream a turn via Nest SSE. Returns an AsyncIterable of StreamEvent values.
 * Uses fetch+ReadableStream (NOT EventSource — EventSource can't pass cookies
 * cross-port). Each SSE frame is `data: <json>\n\n`; we accumulate the buffer
 * and emit complete frames as they arrive.
 */
export type StreamEvent =
  | { kind: 'delta'; delta: string }
  | { kind: 'done'; text: string; citations: { source_ref: string; strand: string }[] }
  | { kind: 'refusal'; refusal_key: string; text: string };

export async function* streamTurn(
  sessionId: string,
  text: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent, void, void> {
  const url = `/ai-tutor/sessions/${encodeURIComponent(sessionId)}/stream?text=${encodeURIComponent(text)}`;
  const { apiBase } = await import('./base');
  const init: RequestInit = {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'text/event-stream' },
  };
  if (signal) init.signal = signal;
  const res = await fetch(`${apiBase()}${url}`, init);
  if (!res.ok || !res.body) throw new Error(`stream failed: HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split('\n')) {
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload) yield JSON.parse(payload) as StreamEvent;
        }
      }
    }
  }
}
