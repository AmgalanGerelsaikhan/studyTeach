import type {
  WellbeingCanSubmit,
  WellbeingCrisisFlagListResponse,
  WellbeingPulseRequest,
  WellbeingPulseResponse,
} from '@studyteach/contracts';

import { apiBase, apiFetch, ApiError } from './base';

// Wellbeing Pulse (PRD §4.7a). The student form posts the pulse; the
// counselor inbox reads the flags. Everything is anonymous-by-default and
// audited per CLAUDE.md hard constraint #6.

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function getCanSubmitServer(cookieHeader: string): Promise<WellbeingCanSubmit> {
  return serverGet<WellbeingCanSubmit>('/wellbeing/me/can-submit', cookieHeader);
}

export function listCrisisFlagsServer(
  cookieHeader: string,
  onlyOpen = true,
): Promise<WellbeingCrisisFlagListResponse> {
  const qs = onlyOpen ? '?only_open=true' : '';
  return serverGet<WellbeingCrisisFlagListResponse>(`/wellbeing/flags${qs}`, cookieHeader);
}

export function submitPulse(body: WellbeingPulseRequest): Promise<WellbeingPulseResponse> {
  return apiFetch<WellbeingPulseResponse>('/wellbeing/pulse', { method: 'POST', body });
}

export function updateCrisisFlag(
  flagId: number,
  body: { status: string; note?: string },
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/wellbeing/flags/${flagId}`, { method: 'POST', body });
}
