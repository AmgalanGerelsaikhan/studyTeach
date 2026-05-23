'use client';

import { useEffect } from 'react';

import { installLatestPack } from '@/lib/offline/content-pack';

/**
 * Background content-pack installer. Mounted once at the root layout (only
 * for authenticated personas). Fires `installLatestPack()` after a small
 * delay so it doesn't compete with the first paint. Silent on success —
 * status is surfaced via the diagnostic page at /settings/offline.
 *
 * No nav, no UI. Pure side-effect component.
 */
export function ContentPackInstaller() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      installLatestPack()
        .then((result) => {
          // Status is also reflected in IndexedDB; console.warn here is just
          // a dev signal — production builds can re-read via getCachedPackRecord().
          if (result.status === 'installed') {
            console.warn(
              `[content-pack] installed v${result.version} (${result.fetched} new, ${result.reused} reused)`,
            );
          } else if (result.status === 'verify-failed') {
            console.warn(`[content-pack] signature/sha verify failed: ${result.error}`);
          }
        })
        .catch((err: unknown) => {
          console.warn('[content-pack] install threw', err);
        });
    }, 2000);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
