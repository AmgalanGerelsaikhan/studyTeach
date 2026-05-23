import type {
  ChildSummary,
  CreateParentLinkResponse,
  LinkedChild,
  ParentAuditEntry,
  PortableStudentRecord,
} from '@studyteach/contracts';

import { enqueue } from '../offline/queue';

import { apiBase, apiFetch, ApiError } from './base';

// Parent Portal (PRD §4.8) typed client. Mirrors lib/api/teacher-academy.ts.
//
// Reads run in server components and forward the HttpOnly session cookie
// explicitly (CLAUDE.md constraint #8 — the cookie is never readable from
// client JS, so it must be threaded through here).
//
// Writes are split:
//   - revoke (link / school) → safe to enqueue offline; we still want them to
//     execute on reconnect so the audit trail stays accurate.
//   - link create / verify → require a synchronous server reply (OTP
//     challenge, OTP code). Queuing them would strand the user mid-flow, so
//     they surface a clear "no connection" error instead.

// ── Server-component reads (explicit cookie forwarding) ──────────────────────

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    // Parent reads are personal + audited on every fetch. Never cache.
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function listChildrenServer(cookieHeader: string): Promise<{ items: LinkedChild[] }> {
  return serverGet<{ items: LinkedChild[] }>('/parent/children', cookieHeader);
}

export function getChildSummaryServer(
  studentId: number,
  cookieHeader: string,
): Promise<ChildSummary> {
  return serverGet<ChildSummary>(`/parent/children/${studentId}/summary`, cookieHeader);
}

export function getAuditServer(cookieHeader: string): Promise<{ items: ParentAuditEntry[] }> {
  return serverGet<{ items: ParentAuditEntry[] }>('/parent/audit', cookieHeader);
}

/** Parent-side full PSR read for a verified child. `reason` is required. */
export function getChildPsrServer(
  studentId: number,
  reason: string,
  cookieHeader: string,
): Promise<PortableStudentRecord> {
  const qs = new URLSearchParams({ reason });
  return serverGet<PortableStudentRecord>(
    `/parent/children/${studentId}/psr?${qs.toString()}`,
    cookieHeader,
  );
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
 * Step 1 of linking. Needs the server's `otp_challenge` to proceed, so we
 * never queue this — instead the form surfaces a network-down message.
 */
export function createParentLink(input: {
  national_id_hash: string;
  school_code: string;
}): Promise<CreateParentLinkResponse> {
  return apiFetch<CreateParentLinkResponse>('/parent/links', {
    method: 'POST',
    body: input,
  });
}

/**
 * Step 2. Needs the server's `LinkedChild` row to navigate the parent to the
 * hub — also never queued.
 */
export function verifyParentLink(input: { challenge: string; code: string }): Promise<LinkedChild> {
  return apiFetch<LinkedChild>('/parent/links/verify', {
    method: 'POST',
    body: input,
  });
}

/**
 * Revoke a single parent→child link. Idempotent at the DB layer (re-revoking
 * an already-revoked link is a no-op), so it is safe to queue offline.
 */
export async function revokeParentLink(linkId: number): Promise<WriteResult<{ revoked: boolean }>> {
  try {
    const value = await apiFetch<{ revoked: boolean }>(`/parent/links/${linkId}/revoke`, {
      method: 'POST',
    });
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/parent/links/${linkId}/revoke`,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}

/**
 * Revoke every link this parent holds at a given school. Same idempotency
 * argument — safe to queue.
 */
export async function revokeSchoolAccess(input: {
  school_code: string;
  reason?: string;
}): Promise<WriteResult<{ revoked_count: number }>> {
  try {
    const value = await apiFetch<{ revoked_count: number }>('/parent/revoke-school', {
      method: 'POST',
      body: input,
    });
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/parent/revoke-school`,
        body: input,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}
