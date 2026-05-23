'use client';

import { useEffect } from 'react';

/**
 * Service worker registrar. Production: registers /sw.js for offline +
 * cache-first chunk loading. Development: ACTIVELY UNREGISTERS any
 * previously-registered SW and clears its caches.
 *
 * Why the dev-mode unregister: Next.js dev chunks (webpack.js, main-app.js,
 * app/layout.js) ship without a content hash. Same URL → new content on
 * every rebuild. A cache-first SW caches the first hit and then serves
 * stale chunks for the same URL after the next dev rebuild → the browser
 * tries to load a module factory that no longer exists in the cached
 * chunk → "Cannot read properties of undefined (reading 'call')" inside
 * webpack runtime. Disabling the SW in dev is the only safe answer; the
 * production build with hashed chunks doesn't have this issue.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
      // Dev: nuke any SW registered by an earlier prod-or-dev run + clear all caches.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister().catch(() => undefined))))
        .then(() => {
          if ('caches' in window) {
            return caches
              .keys()
              .then((keys) =>
                Promise.all(keys.map((k) => caches.delete(k).catch(() => undefined))),
              );
          }
          return undefined;
        })
        .catch(() => undefined);
      return;
    }

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
      console.warn('[st-pwa] sw register failed', err);
    });
  }, []);
  return null;
}
