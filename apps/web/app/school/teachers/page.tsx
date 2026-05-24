import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { SchoolTeachersResponse } from '@studyteach/contracts';

import { StCard, StChip, StIcon } from '@/components/st';
import { AuthStatus } from '@/components/system/AuthStatus';
import { ApiError } from '@/lib/api/base';
import { listSchoolTeachersServer } from '@/lib/api/school';

export const dynamic = 'force-dynamic';

export default async function SchoolTeachersPage() {
  const cookieHeader = cookies().toString();
  const t = await getTranslations('school.teachers');

  let data: SchoolTeachersResponse | null = null;
  let forbidden = false;
  let error = false;
  try {
    data = await listSchoolTeachersServer(cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) forbidden = true;
    else error = true;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center gap-3">
        <Link
          href="/school"
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <StIcon name="arrow_l" size={12} />
          {t('back')}
        </Link>
        <span className="ml-auto">
          <AuthStatus />
        </span>
      </header>

      <StCard padding="lg" className="mt-4">
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
        {data && (
          <div className="mt-3">
            <StChip tone="soot">
              <StIcon name="flag" size={11} />
              {data.organization_code}
            </StChip>
          </div>
        )}
      </StCard>

      <section className="mt-4">
        {forbidden ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
              {t('forbidden')}
            </p>
          </StCard>
        ) : error ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
              {t('loadError')}
            </p>
          </StCard>
        ) : !data || data.items.length === 0 ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
              {t('empty')}
            </p>
          </StCard>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.items.map((teacher) => (
              <li key={teacher.user_id}>
                <Link
                  href={`/school/teachers/${teacher.user_id}/cpd`}
                  className="block rounded-st-md border p-4 transition-shadow hover:shadow-md"
                  style={{
                    background: 'var(--st-paper)',
                    borderColor: 'rgba(185, 132, 56, 0.35)',
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--st-brass-dark)' }}
                  >
                    {t('userId', { id: teacher.user_id })}
                  </p>
                  <p
                    className="mt-1 font-display text-base font-semibold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {teacher.email ?? t('unnamed')}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt style={{ color: 'var(--st-ink-3)' }}>{t('certs')}</dt>
                      <dd style={{ color: 'var(--st-soot)' }}>{teacher.certifications_count}</dd>
                    </div>
                    <div>
                      <dt style={{ color: 'var(--st-ink-3)' }}>{t('credits')}</dt>
                      <dd style={{ color: 'var(--st-soot)' }}>
                        {teacher.total_cpd_credits.toFixed(1)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                    {teacher.last_certified_at
                      ? t('lastCertified', { date: teacher.last_certified_at.slice(0, 10) })
                      : t('noCertifications')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
