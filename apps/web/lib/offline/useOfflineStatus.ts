'use client';

import { useEffect, useState } from 'react';

import { flushOnce, pendingCount } from './queue';

export interface OfflineStatus {
  online: boolean;
  pending: number;
  syncing: boolean;
}

/** Reactive view over `navigator.onLine` + pending-writes count. */
export function useOfflineStatus(pollMs = 5_000): OfflineStatus {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const n = await pendingCount();
        if (!cancelled) setPending(n);
      } catch {
        // IDB not available (SSR, private browsing) — leave pending at 0.
      }
    }

    async function tryFlush() {
      if (!navigator.onLine) return;
      setSyncing(true);
      try {
        await flushOnce();
      } finally {
        if (!cancelled) {
          setSyncing(false);
          await refresh();
        }
      }
    }

    function onOnline() {
      setOnline(true);
      tryFlush();
    }
    function onOffline() {
      setOnline(false);
    }
    function onQueueChanged() {
      refresh();
    }

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('st-queue-changed', onQueueChanged);

    refresh();
    const interval = window.setInterval(refresh, pollMs);

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('st-queue-changed', onQueueChanged);
      window.clearInterval(interval);
    };
  }, [pollMs]);

  return { online, pending, syncing };
}
