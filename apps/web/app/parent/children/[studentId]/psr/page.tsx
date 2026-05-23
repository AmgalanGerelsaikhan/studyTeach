import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { PortableStudentRecord } from '@studyteach/contracts';

import { StCard, StChip, StDivider, StIcon, StUlzii } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { getChildPsrServer } from '@/lib/api/parent';

/**
 * Parent-side view of a verified child's full Portable Student Record
 * (PRD §4.9). The child sees the same record at /student/psr; the parent's
 * read is audited under target_type='psr' so it surfaces in the child's
 * /psr/me/audit timeline.
 *
 * The `?reason=` query param is REQUIRED by the API. We default it here to
 * a generic "эцэг эх хяналт" so the page renders on first visit, but
 * audit hygiene is much better if the parent enters a specific reason —
 * future iteration: a small modal that captures reason before the read.
 */
export const dynamic = 'force-dynamic';

export default async function ParentChildPsrPage({
  params,
  searchParams,
}: {
  params: { studentId: string };
  searchParams: { reason?: string };
}) {
  const studentId = Number(params.studentId);
  if (!Number.isInteger(studentId) || studentId <= 0) return notFound();

  const cookieHeader = cookies().toString();
  const t = await getTranslations('parent.childPsr');
  const reason = (searchParams.reason ?? 'Эцэг эхийн хяналт').trim() || 'Эцэг эхийн хяналт';

  let data: PortableStudentRecord | null = null;
  let forbidden = false;
  let error = false;
  try {
    data = await getChildPsrServer(studentId, reason, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) redirect('/login');
      if (err.status === 403) forbidden = true;
      else if (err.status === 404) return notFound();
      else error = true;
    } else {
      error = true;
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center gap-3">
        <Link
          href="/parent"
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--st-ink-2)' }}
        >
          <StIcon name="arrow_l" size={12} />
          {t('back')}
        </Link>
      </header>

      <StCard padding="lg" className="st-page-enter mt-4">
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
        <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('readReason', { reason })}
        </p>
      </StCard>

      {forbidden ? (
        <StCard padding="md" className="mt-4">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('forbidden')}
          </p>
        </StCard>
      ) : error ? (
        <StCard padding="md" className="mt-4">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      ) : data ? (
        <>
          <StCard padding="md" className="mt-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('identity.title')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StUlzii size={28} color="var(--st-brass-bright)" />
              <p className="font-display text-lg font-semibold" style={{ color: 'var(--st-soot)' }}>
                {data.identity.display_name}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.identity.current_school_code && (
                <StChip tone="soot">
                  <StIcon name="flag" size={11} />
                  {data.identity.current_school_name ?? data.identity.current_school_code}
                </StChip>
              )}
              {data.identity.grade !== null && (
                <StChip tone="brass">{t('identity.gradeChip', { n: data.identity.grade })}</StChip>
              )}
              {data.identity.is_boarding && (
                <StChip tone="ember">{t('identity.boardingChip')}</StChip>
              )}
            </div>
          </StCard>

          <StCard padding="md" className="mt-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('grades.title')}
            </p>
            {data.grades.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-3)' }}>
                {t('grades.empty')}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {data.grades.map((g) => (
                  <li key={g.test_id} className="flex items-center justify-between gap-2 text-sm">
                    <span style={{ color: 'var(--st-ink-2)' }}>
                      {g.subject} · {g.test_type}
                    </span>
                    <span style={{ color: 'var(--st-soot)' }}>
                      {g.score}/{g.max_score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </StCard>

          <StCard padding="md" className="mt-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('olympiads.title')}
            </p>
            {data.olympiads.length === 0 ? (
              <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-3)' }}>
                {t('olympiads.empty')}
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {data.olympiads.map((o) => (
                  <li key={o.registration_id} className="text-sm">
                    <p style={{ color: 'var(--st-soot)' }}>{o.title}</p>
                    <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
                      {o.organizer} · {o.exam_date.slice(0, 10)} · {o.payment_status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </StCard>

          <StDivider />

          <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {t('auditNote')}
          </p>
        </>
      ) : null}
    </main>
  );
}
