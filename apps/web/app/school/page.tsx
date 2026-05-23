import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Me } from '@studyteach/contracts';

import { StButton, StCard, StChip, StIcon, StSoyomboFlame } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { apiBase } from '@/lib/api/base';

export const dynamic = 'force-dynamic';

/**
 * School-admin home. Replaces the previous PersonaStub dead-end (audit
 * finding B2) with a real persona surface that gives SCHOOL_ADMIN a
 * navigable next step — namely the teachers index at /school/teachers —
 * and an always-visible logout chip.
 *
 * The "coming soon" tiles are honest about what's not yet built (cohort
 * rollups, school-wide analytics, ЭЕШ trends). Real screens land later
 * per docs/ROLLOUT_PLAN.md.
 */
export default async function SchoolHome() {
  const cookieHeader = cookies().toString();
  const res = await fetch(`${apiBase()}/me`, {
    cache: 'no-store',
    headers: { cookie: cookieHeader },
  });
  if (res.status === 401) redirect('/login');
  const me = (await res.json()) as Me;
  const t = await getTranslations('school.home');

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="MozaTeach" className="flex items-center gap-2">
          <StSoyomboFlame size={26} />
          <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            MozaTeach
          </span>
        </Link>
        <span className="ml-auto flex items-center gap-2">
          <StChip tone="soot">
            <StIcon name="flag" size={12} />
            {t('roleLabel')}
          </StChip>
          <AuthStatus />
        </span>
      </header>

      <StCard variant="soot" padding="lg" className="mt-6">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: '#D4A24C' }}
        >
          {t('eyebrow')}
        </p>
        <h1
          className="mt-2 font-display text-2xl font-bold sm:text-3xl"
          style={{ color: '#FBF3E2' }}
        >
          {t('title')}
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#D8BC85' }}>
          {t('subtitle', { org: me.organization_code ?? '—' })}
        </p>
      </StCard>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('teachers.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('teachers.title')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('teachers.body')}
          </p>
          <div className="mt-3">
            <Link href="/school/teachers">
              <StButton type="button" variant="primary" size="sm">
                <StIcon name="users" size={12} />
                {t('teachers.cta')}
              </StButton>
            </Link>
          </div>
        </StCard>

        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('upcoming.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('upcoming.title')}
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {[
              t('upcoming.item1'),
              t('upcoming.item2'),
              t('upcoming.item3'),
              t('upcoming.item4'),
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">
                  <StIcon name="clock" size={13} color="var(--st-brass)" />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </StCard>
      </section>
    </main>
  );
}
