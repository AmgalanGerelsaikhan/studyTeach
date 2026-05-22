import type {
  Assessment,
  AssessmentSubmitResponse,
  CourseDetail,
  CourseListResponse,
  EnrollmentDescriptor,
  LessonCompleteResponse,
  PlaybackToken,
} from '@studyteach/contracts';

import { enqueue } from '../offline/queue';
import { uuidv7 } from '../offline/uuid';

import { apiBase, apiFetch, ApiError } from './base';

// Teacher Academy (E-025) typed client. Mirrors lib/api/olympiad.ts.
//
// Reads go through `apiFetch`. The catalog + detail routes are server
// components, so reads run on the Node server: the HttpOnly session cookie
// is forwarded explicitly via `cookieHeader` (see `serverGet*` below).
//
// Writes (enroll / complete / submit) carry a UUIDv7 idempotency key and
// fall back to the offline sync queue when the network is unavailable, so a
// teacher on a flaky 3G link never silently loses a write (OFFLINE_STRATEGY.md).

export interface CourseCatalogFilter {
  subject?: string[];
  grade?: number;
  methodology?: string;
  language_track?: string;
  cursor?: number;
  limit?: number;
}

function courseListPath(filter: CourseCatalogFilter): string {
  const qs = new URLSearchParams();
  if (filter.subject) for (const s of filter.subject) qs.append('subject', s);
  if (filter.grade !== undefined) qs.set('grade', String(filter.grade));
  if (filter.methodology) qs.set('methodology', filter.methodology);
  if (filter.language_track) qs.set('language_track', filter.language_track);
  if (filter.cursor !== undefined) qs.set('cursor', String(filter.cursor));
  if (filter.limit !== undefined) qs.set('limit', String(filter.limit));
  const q = qs.toString();
  return `/teacher-academy/courses${q ? `?${q}` : ''}`;
}

// ── Server-component reads (explicit cookie forwarding) ──────────────────────
// In a server component `credentials: 'include'` does nothing — there is no
// browser. The caller passes the request's Cookie header so the API still
// scopes the response to the authenticated teacher.

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    // The catalog is per-teacher (enrollment + progress). Never cache it.
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function listCoursesServer(
  cookieHeader: string,
  filter: CourseCatalogFilter = {},
): Promise<CourseListResponse> {
  return serverGet<CourseListResponse>(courseListPath(filter), cookieHeader);
}

export function getCourseServer(courseId: number, cookieHeader: string): Promise<CourseDetail> {
  return serverGet<CourseDetail>(`/teacher-academy/courses/${courseId}`, cookieHeader);
}

// ── Client-component reads ───────────────────────────────────────────────────

export function listCourses(filter: CourseCatalogFilter = {}): Promise<CourseListResponse> {
  return apiFetch<CourseListResponse>(courseListPath(filter));
}

export function getAssessment(assessmentId: number): Promise<Assessment> {
  return apiFetch<Assessment>(`/teacher-academy/assessments/${assessmentId}`);
}

export function getPlaybackToken(lessonId: number): Promise<PlaybackToken> {
  return apiFetch<PlaybackToken>(`/teacher-academy/lessons/${lessonId}/playback`);
}

// ── Writes — offline-aware ───────────────────────────────────────────────────
// Each returns a discriminated result so the UI can show "queued" vs "done".

export interface QueuedWrite {
  status: 'queued';
}
export interface DoneWrite<T> {
  status: 'done';
  value: T;
}
export type WriteResult<T> = DoneWrite<T> | QueuedWrite;

function isOfflineError(err: unknown): boolean {
  // A thrown TypeError from fetch == network failure. ApiError means the
  // server answered (4xx/5xx) — that is not an offline condition.
  if (err instanceof ApiError) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  return err instanceof TypeError;
}

export async function enrollInCourse(courseId: number): Promise<WriteResult<EnrollmentDescriptor>> {
  const idempotency_key = uuidv7();
  const body = { course_id: courseId, idempotency_key };
  try {
    const value = await apiFetch<EnrollmentDescriptor>('/teacher-academy/enrollments', {
      method: 'POST',
      body,
    });
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/teacher-academy/enrollments`,
        body,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}

export async function completeLesson(
  lessonId: number,
  watchSeconds: number,
): Promise<WriteResult<LessonCompleteResponse>> {
  const idempotency_key = uuidv7();
  const body = { watch_seconds: Math.max(0, Math.round(watchSeconds)), idempotency_key };
  try {
    const value = await apiFetch<LessonCompleteResponse>(
      `/teacher-academy/lessons/${lessonId}/complete`,
      { method: 'POST', body },
    );
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/teacher-academy/lessons/${lessonId}/complete`,
        body,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}

export async function submitAssessment(
  assessmentId: number,
  answers: Record<string, number | string>,
): Promise<WriteResult<AssessmentSubmitResponse>> {
  const idempotency_key = uuidv7();
  const body = { answers, idempotency_key };
  try {
    const value = await apiFetch<AssessmentSubmitResponse>(
      `/teacher-academy/assessments/${assessmentId}/submit`,
      { method: 'POST', body },
    );
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/teacher-academy/assessments/${assessmentId}/submit`,
        body,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}
