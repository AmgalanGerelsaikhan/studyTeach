import type {
  ActiveFocusSession,
  CreateFocusSessionRequest,
  FocusSession,
  FocusSessionSummary,
  JoinFocusSessionRequest,
} from '@studyteach/contracts';

import { apiBase, apiFetch, ApiError } from './base';

// Focus Mode (E-039 / PRD §4.6) typed client. Mirrors lib/api/teacher-academy.ts
// for the cookie-forwarding pattern.
//
// Reads from server components run on the Node server, so the HttpOnly session
// cookie is forwarded explicitly via `cookieHeader` (constraint #8).
//
// Writes go through `apiFetch` (cookies travel via `credentials: 'include'`).
// They are NOT offline-queued — focus mode is fundamentally synchronous
// (you can't join, create, or close a session without a live server).

// ── Server-component reads (explicit cookie forwarding) ──────────────────────

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    // Focus sessions are short-lived and user-specific. Never cache.
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

/**
 * Teacher-only: read of the post-creation session is approximated via the
 * summary endpoint (no GET /focus/sessions/:id exists yet).
 * TODO(focus): once a dedicated session-read endpoint lands, swap this caller
 * to it so we can show `live_participant_count` directly.
 */
export function getFocusSummaryServer(
  sessionId: number,
  cookieHeader: string,
): Promise<FocusSessionSummary> {
  return serverGet<FocusSessionSummary>(`/focus/sessions/${sessionId}/summary`, cookieHeader);
}

/** Student-only: the lock-screen guard. Returns null when no active session. */
export function getActiveFocusSessionServer(
  cookieHeader: string,
): Promise<ActiveFocusSession | null> {
  return serverGet<ActiveFocusSession | null>(`/focus/me/active`, cookieHeader);
}

// ── Client-component writes (cookies via credentials: 'include') ─────────────

export function createFocusSessionClient(body: CreateFocusSessionRequest): Promise<FocusSession> {
  return apiFetch<FocusSession>('/focus/sessions', { method: 'POST', body });
}

export function joinFocusSessionClient(body: JoinFocusSessionRequest): Promise<ActiveFocusSession> {
  return apiFetch<ActiveFocusSession>('/focus/sessions/join', { method: 'POST', body });
}

export function closeFocusSessionClient(sessionId: number): Promise<{ closed: true }> {
  return apiFetch<{ closed: true }>(`/focus/sessions/${sessionId}/close`, { method: 'POST' });
}

/** Polled by the teacher's hero card to surface a "live" participant count. */
export function getFocusSummaryClient(sessionId: number): Promise<FocusSessionSummary> {
  return apiFetch<FocusSessionSummary>(`/focus/sessions/${sessionId}/summary`);
}

/** Used by the student client island to detect an active session on demand. */
export function getActiveFocusSessionClient(): Promise<ActiveFocusSession | null> {
  return apiFetch<ActiveFocusSession | null>(`/focus/me/active`);
}
