import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { StButton, StCard, StIcon } from '@/components/st';

/**
 * Teacher Olympiad management hub. v1 is a navigation shim — the existing
 * /teacher dashboard handles roster + registration; the public catalog lives
 * at /student/olympiad. This page exists so the teacher sidebar entry isn't
 * a 404 and so a dedicated teacher-side olympiad surface has a home for the
 * P1 "bulk registration + payment status" expansion (PRD §4.3 + §4.4).
 */
export default async function TeacherOlympiadsPage() {
  const t = await getTranslations('teacher.olympiads');
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
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
      </StCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('roster.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('roster.title')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('roster.body')}
          </p>
          <div className="mt-3">
            <Link href="/teacher">
              <StButton type="button" variant="secondary" size="sm">
                <StIcon name="users" size={12} />
                {t('roster.cta')}
              </StButton>
            </Link>
          </div>
        </StCard>

        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('catalog.eyebrow')}
          </p>
          <h2 className="mt-1 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('catalog.title')}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('catalog.body')}
          </p>
          <div className="mt-3">
            <Link href="/student/olympiad">
              <StButton type="button" variant="secondary" size="sm">
                <StIcon name="trophy" size={12} />
                {t('catalog.cta')}
              </StButton>
            </Link>
          </div>
        </StCard>
      </div>
    </main>
  );
}
