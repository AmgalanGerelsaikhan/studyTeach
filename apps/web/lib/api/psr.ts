import type {
  CreatePsrGrantRequest,
  PortableStudentRecord,
  PsrAccessGrant,
  PsrAuditEntry,
} from '@studyteach/contracts';

import { enqueue } from '../offline/queue';

import { apiBase, apiFetch, ApiError } from './base';

// Portable Student Record (PRD §4.9) typed client. Mirrors lib/api/parent.ts.
//
// Reads run in server components and forward the HttpOnly session cookie
// explicitly (CLAUDE.md constraint #8 — the cookie is never readable from
// client JS, so it must be threaded through here).
//
// Writes are owner-driven mutations on the access-grant table. They are
// idempotent at the DB layer (re-revoking is a no-op; re-granting the same
// school is bounced by a unique partial index), so it is safe to queue them
// offline. The record-owner still gets immediate UI feedback via the
// router.refresh() that the calling client component triggers.

// ── Server-component reads (explicit cookie forwarding) ──────────────────────

async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    // PSR reads are personal + audited on every fetch. Never cache.
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function getOwnPsrServer(cookieHeader: string): Promise<PortableStudentRecord> {
  return serverGet<PortableStudentRecord>('/psr/me', cookieHeader);
}

export function getOwnPsrAuditServer(cookieHeader: string): Promise<{ items: PsrAuditEntry[] }> {
  return serverGet<{ items: PsrAuditEntry[] }>('/psr/me/audit', cookieHeader);
}

export function getOwnPsrGrantsServer(cookieHeader: string): Promise<{ items: PsrAccessGrant[] }> {
  return serverGet<{ items: PsrAccessGrant[] }>('/psr/me/grants', cookieHeader);
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
 * Grant a school read-access to the caller's PSR. Idempotent at the DB layer
 * (re-granting an existing active row returns the same row), so it is safe
 * to queue offline.
 */
export async function createPsrGrant(
  body: CreatePsrGrantRequest,
): Promise<WriteResult<PsrAccessGrant>> {
  try {
    const value = await apiFetch<PsrAccessGrant>('/psr/me/grants', {
      method: 'POST',
      body,
    });
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'POST',
        url: `${apiBase()}/psr/me/grants`,
        body,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}

/**
 * Revoke a previously-issued grant. Idempotent at the DB layer (re-revoking
 * an already-revoked row is a no-op), so it is safe to queue offline.
 */
export async function revokePsrGrant(grantId: number): Promise<WriteResult<{ revoked: boolean }>> {
  try {
    const value = await apiFetch<{ revoked: boolean }>(`/psr/me/grants/${grantId}`, {
      method: 'DELETE',
    });
    return { status: 'done', value };
  } catch (err) {
    if (isOfflineError(err)) {
      await enqueue({
        method: 'DELETE',
        url: `${apiBase()}/psr/me/grants/${grantId}`,
        scope: { organization_code: null, user_id: null },
      });
      return { status: 'queued' };
    }
    throw err;
  }
}
