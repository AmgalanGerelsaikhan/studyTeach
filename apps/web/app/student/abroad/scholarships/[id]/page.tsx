import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Scholarship } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StLinkButton } from '@/components/st';
import { daysUntil, formatMongolianDate } from '@/components/student/abroad/format';
import { WatchButton } from '@/components/student/abroad/WatchButton';
import { getScholarshipServer } from '@/lib/api/study-abroad';

/**
 * Scholarship detail (PRD §4.10b). Server component: eligibility, deadline
 * countdown, and document checklist render on the server. The "watch" CTA
 * is a small client island so the POST can fall back to the offline queue
 * (hard constraint #5 — never silently drop a write). The official-site
 * link drops to a new tab with `rel="noopener"` for safety.
 */
export const dynamic = 'force-dynamic';

export default async function StudentScholarshipDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const t = await getTranslations('student.abroad');
  const cookieHeader = cookies().toString();

  let scholarship: Scholarship | null = null;
  let loadError = false;
  try {
    scholarship = await getScholarshipServer(id, cookieHeader);
  } catch {
    loadError = true;
  }

  if (loadError || !scholarship) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  const deadlineDate = new Date(scholarship.deadline);
  const daysLeft = daysUntil(deadlineDate);
  const deadlineLabel = formatMongolianDate(deadlineDate);

  return (
    <main
      className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6"
      data-testid="student-abroad-scholarship-detail"
    >
      <StCard padding="lg" className="st-page-enter">
        <div className="flex flex-wrap items-center gap-1.5">
          <StChip tone="brass">{scholarship.destination_code}</StChip>
          <StChip tone="sky">{t(`level.${scholarship.level}`)}</StChip>
          <StChip tone="moss">{t(`funding.${scholarship.funding_type}`)}</StChip>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {scholarship.name_mn}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {scholarship.funder}
        </p>
      </StCard>

      <section className="mt-4">
        <StCard padding="md">
          <h2 className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('scholarship.eligibilityTitle')}
          </h2>
          <p
            className="mt-2 whitespace-pre-line text-sm leading-relaxed"
            style={{ color: 'var(--st-ink)' }}
          >
            {scholarship.eligibility_mn}
          </p>
        </StCard>
      </section>

      <section className="mt-4">
        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('scholarship.deadlineLabel')}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
              {deadlineLabel}
            </p>
            {daysLeft >= 0 ? (
              <StChip tone={daysLeft <= 30 ? 'ember' : 'default'}>
                {t('scholarship.daysLeft', { n: daysLeft })}
              </StChip>
            ) : (
              <StChip tone="default">{t('scholarship.daysPassed')}</StChip>
            )}
          </div>
        </StCard>
      </section>

      {scholarship.document_checklist.length > 0 && (
        <section className="mt-4">
          <StCard padding="md">
            <h2 className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
              {t('scholarship.checklistTitle')}
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {scholarship.document_checklist.map((doc, idx) => (
                <li
                  key={`${idx}-${doc}`}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--st-ink)' }}
                >
                  <span className="mt-[3px] shrink-0">
                    <StIcon name="check" size={12} color="#836340" />
                  </span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </StCard>
        </section>
      )}

      <section className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <WatchButton scholarshipId={scholarship.scholarship_id} />
        </div>
        <a
          href={scholarship.application_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold sm:self-center"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('scholarship.officialSite')}
        </a>
      </section>

      <div className="mt-5">
        <StLinkButton href="/student/abroad/scholarships" variant="secondary" size="md">
          <StIcon name="arrow_l" size={14} />
          {t('backToDestinations')}
        </StLinkButton>
      </div>
    </main>
  );
}
