import type { PublicStats } from '@studyteach/contracts';

import { apiBase } from './base';

/**
 * Server-side fetch of the public stats payload. Uses Next's fetch cache
 * (revalidate every 5 min) to match the API's Cache-Control and avoid
 * round-tripping per landing page visitor. Tolerant of API failure — the
 * landing page renders a sensible empty state rather than 500'ing.
 */
export async function getPublicStatsServer(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${apiBase()}/public/stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicStats;
  } catch {
    return null;
  }
}
