import type {
  Destination,
  DestinationDetail,
  Scholarship,
  ScholarshipFundingType,
  ScholarshipLevel,
  ScholarshipWatch,
  StudyAbroadDestinationCode,
} from '@studyteach/contracts';

import { enqueue } from '../offline/queue';

import { apiBase, apiFetch, ApiError } from './base';

// Study Abroad Hub (PRD §4.10a / §4.10b) typed client. Mirrors
// lib/api/parent.ts and lib/api/teacher-academy.ts.
//
// Reads run in server components and forward the HttpOnly session cookie
// explicitly (CLAUDE.md constraint #8 — the cookie is never readable from
// client JS, so it must be threaded through here).
//
// The single write (scholarship watch) carries an offline-queue fallback so
// a student on a flaky 3G link never silently loses the intent to be
// notified (OFFLINE_STRATEGY.md).

// ── Server-component reads (explicit cookie forwarding) ──────────────────────

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    // Destinations + scholarships are read-mostly but personal (the watch
    // flag is per-user later). Skip caching for now so the listing always
    // reflects the latest seed/watch state.
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function listDestinationsServer(cookieHeader: string): Promise<{ items: Destination[] }> {
  return serverGet<{ items: Destination[] }>('/study-abroad/destinations', cookieHeader);
}

export function getDestinationServer(
  code: StudyAbroadDestinationCode,
  cookieHeader: string,
): Promise<DestinationDetail> {
  return serverGet<DestinationDetail>(`/study-abroad/destinations/${code}`, cookieHeader);
}

export interface ScholarshipFilter {
  destination_code?: StudyAbroadDestinationCode;
  level?: ScholarshipLevel;
  funding_type?: ScholarshipFundingType;
  deadline_within_days?: number;
}

function scholarshipListPath(filter: ScholarshipFilter): string {
  const qs = new URLSearchParams();
  if (filter.destination_code) qs.set('destination_code', filter.destination_code);
  if (filter.level) qs.set('level', filter.level);
  if (filter.funding_type) qs.set('funding_type', filter.funding_type);
  if (filter.deadline_within_days !== undefined) {
    qs.set('deadline_within_days', String(filter.deadline_within_days));
  }
  const q = qs.toString();
  return `/study-abroad/scholarships${q ? `?${q}` : ''}`;
}

export function listScholarshipsServer(
  cookieHeader: string,
  filter: ScholarshipFilter = {},
): Promise<{ items: Scholarship[] }> {
  return serverGet<{ items: Scholarship[] }>(scholarshipListPath(filter), cookieHeader);
}

export function getScholarshipServer(
  scholarshipId: number,
  cookieHeader: string,
): Promise<Scholarship> {
  return serverGet<Scholarship>(`/study-abroad/scholarships/${scholarshipId}`, cookieHeader);
}

// ── Client writes ────────────────────────────────────────────────────────────

export interface QueuedWrite {
  status: 'queued';
}
export interface DoneWrite<T> {
  status: 'done';
  value: T;
}
export type WriteResult<T> = DoneWrite<T> | QueuedWrite;

function isOfflineError(err: unknown): boolean {
  // ApiError means the server answered (4xx/5xx) — not offline.
  if (err instanceof ApiError) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return err instanceof TypeError;
}

/**
 * Subscribe to deadline reminders for a scholarship. POST is idempotent at
 * the DB layer (one watch row per (user, scholarship)), so it is safe to
 * queue offline and replay on reconnect.
 */
export async function watchScholarship(
  scholarshipId: number,
): Promise<WriteResult<ScholarshipWatch>> {
  try {
    const value = await apiFetch<ScholarshipWatch>(
      `/study-abroad/scholarships/${scholarshipId}/watch`,
      { method: 'POST' },
    );
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/study-abroad/scholarships/${scholarshipId}/watch`,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}
