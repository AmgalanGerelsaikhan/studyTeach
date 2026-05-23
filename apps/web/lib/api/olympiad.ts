import type { OlympiadListResponse, RegistrationDescriptor } from '@studyteach/contracts';

import { uuidv7 } from '../offline/uuid';

import { apiFetch } from './base';

export interface OlympiadFilter {
  subject?: string[];
  grade?: number;
  is_online?: boolean;
  aimag?: string;
  fee_max?: number;
  window?: 'open' | 'upcoming' | 'closed';
  cursor?: string;
  limit?: number;
}

export function listOlympiads(filter: OlympiadFilter = {}): Promise<OlympiadListResponse> {
  const qs = new URLSearchParams();
  if (filter.subject) for (const s of filter.subject) qs.append('subject', s);
  if (filter.grade !== undefined) qs.set('grade', String(filter.grade));
  if (filter.is_online !== undefined) qs.set('is_online', String(filter.is_online));
  if (filter.aimag) qs.set('aimag', filter.aimag);
  if (filter.fee_max !== undefined) qs.set('fee_max', String(filter.fee_max));
  if (filter.window) qs.set('window', filter.window);
  if (filter.cursor) qs.set('cursor', filter.cursor);
  if (filter.limit !== undefined) qs.set('limit', String(filter.limit));
  const q = qs.toString();
  return apiFetch<OlympiadListResponse>(`/olympiads${q ? `?${q}` : ''}`);
}

export function registerForOlympiad(olympiadId: number): Promise<RegistrationDescriptor> {
  return apiFetch<RegistrationDescriptor>('/registrations', {
    method: 'POST',
    body: { olympiad_id: olympiadId, idempotency_key: uuidv7() },
  });
}

export function listMyRegistrations(): Promise<RegistrationDescriptor[]> {
  return apiFetch<RegistrationDescriptor[]>('/registrations');
}
