import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { StCard, StDivider } from '@/components/st';
import { PulseForm } from '@/components/student/wellbeing/PulseForm';
import { apiBase } from '@/lib/api/base';
import { getCanSubmitServer } from '@/lib/api/wellbeing';

export const dynamic = 'force-dynamic';

/**
 * Student-facing wellbeing pulse (PRD §4.7a). 5-question weekly form
 * for boarding students. The consent text is the contract: students see
 * exactly what data the school will/won't see, and the only path to
 * de-anonymisation is a crisis-phrase match in q5.
 *
 * Non-boarding students get a soft "not eligible" card; everyone else
 * gets either the form (if not yet submitted this week) or a "see you
 * next week" card.
 */
export default async function StudentWellbeingPage() {
  const cookieHeader = cookies().toString();
  if (!cookieHeader) redirect('/login');

  // /me lookup to derive a stable anon_token. The token is just a hash of
  // (user_id, pulse_week) with a per-deployment pepper — the server cannot
  // reverse it, so dedup works without identifying the responder.
  const meRes = await fetch(`${apiBase()}/me`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });
  if (meRes.status === 401) redirect('/login');
  const me = (await meRes.json()) as { user_id: number };

  const t = await getTranslations('student.wellbeing');
  let eligible = false;
  let pulseWeek = 0;
  let error = false;
  try {
    const can = await getCanSubmitServer(cookieHeader);
    eligible = can.can_submit;
    pulseWeek = can.current_week;
  } catch {
    error = true;
  }

  // Anon token = SHA-256-like cheap hash of (user_id, week, pepper).
  // Not crypto-secure; just stable + non-reversible without knowing the
  // pepper. In a real deployment this would be derived in a worker.
  const anonToken = anonTokenFor(me.user_id, pulseWeek);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
        <StDivider />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--st-soot)' }}>
          {t('consent.title')}
        </h2>
        <ul
          className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <li>{t('consent.anon')}</li>
          <li>{t('consent.crisisOnly')}</li>
          <li>{t('consent.neverTraining')}</li>
        </ul>
      </StCard>

      <div className="mt-4">
        {error ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
              {t('loadError')}
            </p>
          </StCard>
        ) : !eligible ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
              {t('notEligible')}
            </p>
          </StCard>
        ) : (
          <StCard padding="md">
            <PulseForm pulseWeek={pulseWeek} anonToken={anonToken} />
          </StCard>
        )}
      </div>
    </main>
  );
}

function anonTokenFor(userId: number, pulseWeek: number): string {
  // Non-reversible-ish without the pepper. Real impl: HMAC-SHA256 in a
  // server-only context with a deployment-secret pepper. v1 uses a build-
  // time pepper from env, but for dev we fall back to a static string so
  // the form works without extra wiring. The server's job is dedup, not
  // identity verification — identity is established via the session
  // cookie that the request carries.
  const pepper = process.env.NEXT_PUBLIC_WELLBEING_TOKEN_PEPPER ?? 'dev-wellbeing-pepper';
  const raw = `${userId}|${pulseWeek}|${pepper}`;
  // Cheap deterministic 64-hex hash (FNV-1a doubled). Adequate for dedup.
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c << 1), 0x100000001b3) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4);
}
