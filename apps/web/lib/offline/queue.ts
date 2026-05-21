/* Sync queue. Producer-consumer FIFO over the `pending-writes` IDB store.
 * Lifecycle in docs/OFFLINE_STRATEGY.md §4:
 *   2xx → remove; merge response into local cache
 *   network err → keep; exponential backoff (cap 12h)
 *   409 → surface server state, keep queued, status: failed
 *   401/403 → pause queue; resume after re-auth
 *   5xx → retry per network policy
 * Constraint: all writes go through the queue, online or not.
 */
import { openDb, type PendingMethod, type PendingWrite } from './db';
import { uuidv7 } from './uuid';

export interface EnqueueInput {
  method: PendingMethod;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  scope?: { organization_code: string | null; user_id: number | null };
}

export interface SyncResult {
  attempted: number;
  succeeded: number;
  failed: number;
  paused: boolean;
}

/** Exponential backoff (ms) capped at 12h, jittered ±20%. */
export function backoffDelay(attempts: number): number {
  const base = Math.min(12 * 60 * 60 * 1000, 30 * 1000 * 2 ** (attempts - 1));
  const jitter = base * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + jitter));
}

export async function enqueue(input: EnqueueInput): Promise<PendingWrite> {
  const db = await openDb();
  const record: PendingWrite = {
    id: uuidv7(),
    method: input.method,
    url: input.url,
    body: input.body === undefined ? null : JSON.stringify(input.body),
    headers: { 'Content-Type': 'application/json', ...(input.headers ?? {}) },
    scope: input.scope ?? { organization_code: null, user_id: null },
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
    status: 'queued',
  };
  await db.put('pending-writes', record);
  return record;
}

export async function pendingCount(): Promise<number> {
  const db = await openDb();
  return db.count('pending-writes');
}

export async function listPending(): Promise<PendingWrite[]> {
  const db = await openDb();
  const tx = db.transaction('pending-writes', 'readonly');
  const idx = tx.store.index('by-createdAt');
  const out: PendingWrite[] = [];
  for await (const cursor of idx.iterate()) out.push(cursor.value);
  return out;
}

export async function markStatus(
  id: string,
  patch: Partial<Pick<PendingWrite, 'status' | 'attempts' | 'lastError'>>,
): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('pending-writes', 'readwrite');
  const existing = await tx.store.get(id);
  if (!existing) return;
  await tx.store.put({ ...existing, ...patch });
  await tx.done;
}

export async function remove(id: string): Promise<void> {
  const db = await openDb();
  await db.delete('pending-writes', id);
}

type Fetcher = typeof fetch;

/** Drain the queue once. Caller is responsible for scheduling retries. */
export async function flushOnce(fetchImpl: Fetcher = fetch): Promise<SyncResult> {
  const pending = await listPending();
  const result: SyncResult = { attempted: 0, succeeded: 0, failed: 0, paused: false };

  for (const item of pending) {
    if (item.status === 'paused') {
      result.paused = true;
      continue;
    }
    result.attempted += 1;
    await markStatus(item.id, { status: 'in_flight', attempts: item.attempts + 1 });

    let res: Response;
    try {
      res = await fetchImpl(item.url, {
        method: item.method,
        headers: { ...item.headers, 'Idempotency-Key': item.id },
        body: item.body,
        credentials: 'include',
      });
    } catch (err) {
      result.failed += 1;
      await markStatus(item.id, {
        status: 'queued',
        lastError: err instanceof Error ? err.message : 'network_error',
      });
      continue;
    }

    if (res.ok || res.status === 202) {
      result.succeeded += 1;
      await remove(item.id);
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      result.paused = true;
      await markStatus(item.id, { status: 'paused', lastError: `http_${res.status}` });
      continue;
    }

    if (res.status === 409) {
      result.failed += 1;
      await markStatus(item.id, { status: 'failed', lastError: 'http_409_conflict' });
      continue;
    }

    // 5xx / other → leave queued for retry
    result.failed += 1;
    await markStatus(item.id, { status: 'queued', lastError: `http_${res.status}` });
  }

  return result;
}

/** Resume the queue after re-auth by un-pausing any paused entries. */
export async function resumeAfterReauth(): Promise<number> {
  const db = await openDb();
  const tx = db.transaction('pending-writes', 'readwrite');
  const idx = tx.store.index('by-status');
  let resumed = 0;
  for await (const cursor of idx.iterate('paused')) {
    await cursor.update({ ...cursor.value, status: 'queued', lastError: null });
    resumed += 1;
  }
  await tx.done;
  return resumed;
}
