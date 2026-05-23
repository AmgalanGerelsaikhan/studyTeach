import type {
  CohortResponse,
  MockStartResponse,
  MockSubmitResponse,
  PaperDescriptor,
  PaperWithQuestions,
  PredictorResponse,
} from '@studyteach/contracts';

import { uuidv7 } from '../offline/uuid';

import { apiFetch } from './base';

export function listPapers(
  filter: { subject?: string; year?: number } = {},
): Promise<PaperDescriptor[]> {
  const qs = new URLSearchParams();
  if (filter.subject) qs.set('subject', filter.subject);
  if (filter.year !== undefined) qs.set('year', String(filter.year));
  const q = qs.toString();
  return apiFetch<PaperDescriptor[]>(`/egsh/papers${q ? `?${q}` : ''}`);
}

export function getPaper(paperId: string): Promise<PaperWithQuestions> {
  return apiFetch<PaperWithQuestions>(`/egsh/papers/${encodeURIComponent(paperId)}`);
}

export function startMock(paperId: string, idempotencyKey?: string): Promise<MockStartResponse> {
  return apiFetch<MockStartResponse>('/egsh/mocks', {
    method: 'POST',
    body: { paper_id: paperId, idempotency_key: idempotencyKey ?? uuidv7() },
  });
}

export function submitMock(
  sessionId: string,
  answers: { question_id: string; chosen_index: number }[],
): Promise<MockSubmitResponse> {
  return apiFetch<MockSubmitResponse>(`/egsh/mocks/${encodeURIComponent(sessionId)}/submit`, {
    method: 'POST',
    body: { answers },
  });
}

export function getPredictor(subject: string): Promise<PredictorResponse> {
  return apiFetch<PredictorResponse>(`/egsh/predictor?subject=${encodeURIComponent(subject)}`);
}

export function getCohort(input: {
  subject: string;
  grade: number;
  aimag?: string;
}): Promise<CohortResponse> {
  const qs = new URLSearchParams({ subject: input.subject, grade: String(input.grade) });
  if (input.aimag) qs.set('aimag', input.aimag);
  return apiFetch<CohortResponse>(`/egsh/cohort?${qs.toString()}`);
}
