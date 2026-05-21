import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetDbForTests, openDb } from '@/lib/offline/db';
import {
  backoffDelay,
  enqueue,
  flushOnce,
  listPending,
  pendingCount,
  resumeAfterReauth,
} from '@/lib/offline/queue';

async function wipe() {
  const db = await openDb();
  await db.clear('pending-writes');
}

beforeEach(async () => {
  __resetDbForTests();
  await wipe();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('queue.enqueue', () => {
  it('stores a write with a UUIDv7 id and queued status', async () => {
    const rec = await enqueue({ method: 'POST', url: '/api/registrations', body: { foo: 1 } });
    expect(rec.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(rec.status).toBe('queued');
    expect(rec.attempts).toBe(0);
    expect(rec.body).toBe('{"foo":1}');
    expect(rec.headers['Content-Type']).toBe('application/json');
    expect(await pendingCount()).toBe(1);
  });

  it('preserves insertion order via createdAt index', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_700_000_000_000);
    await enqueue({ method: 'POST', url: '/api/a' });
    now.mockReturnValue(1_700_000_000_001);
    await enqueue({ method: 'POST', url: '/api/b' });
    now.mockReturnValue(1_700_000_000_002);
    await enqueue({ method: 'POST', url: '/api/c' });
    const ordered = await listPending();
    expect(ordered.map((p) => p.url)).toEqual(['/api/a', '/api/b', '/api/c']);
  });
});

describe('queue.flushOnce', () => {
  it('removes records on 2xx and sets Idempotency-Key from the record id', async () => {
    const rec = await enqueue({ method: 'POST', url: '/api/payments', body: { invoice: 1 } });
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const result = await flushOnce(fetchImpl as unknown as typeof fetch);

    expect(result).toMatchObject({ attempted: 1, succeeded: 1, failed: 0, paused: false });
    expect(await pendingCount()).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe(rec.id);
    expect(init.body).toBe('{"invoice":1}');
  });

  it('leaves the record queued on a network error and increments attempts', async () => {
    await enqueue({ method: 'POST', url: '/api/x' });
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('NetworkError'));
    const result = await flushOnce(fetchImpl as unknown as typeof fetch);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);
    const [item] = await listPending();
    expect(item!.status).toBe('queued');
    expect(item!.attempts).toBe(1);
    expect(item!.lastError).toBe('NetworkError');
  });

  it('pauses on 401 and resumes after re-auth', async () => {
    await enqueue({ method: 'POST', url: '/api/x' });
    const unauth = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    const first = await flushOnce(unauth as unknown as typeof fetch);
    expect(first.paused).toBe(true);
    const [item] = await listPending();
    expect(item!.status).toBe('paused');

    const resumed = await resumeAfterReauth();
    expect(resumed).toBe(1);
    const [after] = await listPending();
    expect(after!.status).toBe('queued');
  });

  it('flags 409 as failed but keeps the record for user resolution', async () => {
    await enqueue({ method: 'POST', url: '/api/x' });
    const conflict = vi.fn().mockResolvedValue(new Response('', { status: 409 }));
    const result = await flushOnce(conflict as unknown as typeof fetch);
    expect(result.failed).toBe(1);
    const [item] = await listPending();
    expect(item!.status).toBe('failed');
    expect(item!.lastError).toBe('http_409_conflict');
  });
});

describe('queue.backoffDelay', () => {
  it('caps at 12 hours', () => {
    expect(backoffDelay(40)).toBeLessThanOrEqual(12 * 60 * 60 * 1000 * 1.2);
  });
  it('grows exponentially for the first attempts', () => {
    expect(backoffDelay(1)).toBeLessThan(backoffDelay(5));
  });
});
