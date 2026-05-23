'use client';

import { useEffect, useState } from 'react';

/**
 * Mirror of the CSS `prefers-reduced-motion: reduce` query for JS-driven
 * effects (canvas, parallax, transforms wired in inline style). CSS-only
 * animations should rely on the existing `@media (prefers-reduced-motion)`
 * block in `globals.css` instead — this hook is for the cases that block
 * can't reach.
 *
 * SSR-safe: returns `false` on the server (motion enabled) and updates
 * on mount. Listens for user-preference changes mid-session.
 */
export function useReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setPrefers(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return prefers;
}
