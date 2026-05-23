'use client';

import { useEffect, useState } from 'react';
import type { ActiveFocusSession } from '@studyteach/contracts';

import { getActiveFocusSessionClient } from '@/lib/api/focus';

/**
 * Client hook — one-shot fetch of the caller's active focus session.
 *
 * Used by persona-nav components to hide nav items while a session is active
 * (the student should not be able to navigate away from the lock screen).
 *
 * Deliberately does NOT poll: the lock screen is a server component that
 * already runs the canonical check; polling here would defeat the 3G budget.
 * If a stale "no session" state leaks through, the next route change will
 * re-render the lock screen and the student is back on the lock screen.
 *
 * NOTE: not yet wired into StudentMobileNav / StudentTopBar — that's a
 * follow-up that needs UX review (do we hide all nav or just dim it?).
 */
export function useFocusActive(): {
  active: ActiveFocusSession | null;
  loading: boolean;
} {
  const [active, setActive] = useState<ActiveFocusSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getActiveFocusSessionClient()
      .then((session) => {
        if (!cancelled) setActive(session);
      })
      .catch(() => {
        // A 401 or network error is treated as "no active session" — the
        // server-rendered lock screen is the source of truth either way.
        if (!cancelled) setActive(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { active, loading };
}
