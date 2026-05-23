import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Me } from '@studyteach/contracts';

import { LandingPage } from '@/components/landing/LandingPage';
import { apiBase } from '@/lib/api/base';
import { postLoginPath } from '@/lib/api/auth';

// Server component: if the caller already has a valid session, skip the
// marketing landing and land them in their persona home. Anonymous visitors
// see LandingPage as before. Anything other than 200 from /me falls through
// to the marketing page — no redirect loop on token rot.
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Resolve OUTSIDE try/catch — Next's redirect() throws a special
  // NEXT_REDIRECT signal that must not be swallowed.
  const target = await resolveAuthedTarget();
  if (target) redirect(target);
  return <LandingPage />;
}

async function resolveAuthedTarget(): Promise<string | null> {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${apiBase()}/me`, {
      cache: 'no-store',
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const me = (await res.json()) as Me;
    return postLoginPath(me.primary_role);
  } catch {
    // Network error on /me → fall through to landing rather than redirect-loop.
    return null;
  }
}
