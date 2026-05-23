import { getTranslations } from 'next-intl/server';
import type { Scholarship } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StLinkButton } from '@/components/st';

import { daysUntil, formatMongolianDate } from './format';

/**
 * One scholarship tile in the aggregator grid. Server component — pure
 * render off a `Scholarship` contract object. The deadline is rendered
 * in Mongolian long form ("YYYY оны MM сарын DD") and accompanied by a
 * countdown chip when the deadline is still ahead.
 */
export async function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const t = await getTranslations('student.abroad');

  const deadlineDate = new Date(scholarship.deadline);
  const daysLeft = daysUntil(deadlineDate);

  return (
    <StCard padding="md" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5">
        <StChip tone="brass">{scholarship.destination_code}</StChip>
        <StChip tone="sky">{t(`level.${scholarship.level}`)}</StChip>
        <StChip tone="moss">{t(`funding.${scholarship.funding_type}`)}</StChip>
      </div>

      <h3 className="mt-2 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
        {scholarship.name_mn}
      </h3>
      <p className="mt-1 text-xs" style={{ color: 'var(--st-ink-2)' }}>
        {scholarship.funder}
      </p>

      <dl
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        <div className="flex items-center gap-1">
          <StIcon name="calendar" size={12} color="#836340" />
          <dd>{formatMongolianDate(deadlineDate)}</dd>
        </div>
        {daysLeft >= 0 ? (
          <StChip tone={daysLeft <= 30 ? 'ember' : 'default'}>
            {t('scholarship.daysLeft', { n: daysLeft })}
          </StChip>
        ) : (
          <StChip tone="default">{t('scholarship.daysPassed')}</StChip>
        )}
      </dl>

      <div className="mt-auto pt-3">
        <StLinkButton
          href={`/student/abroad/scholarships/${scholarship.scholarship_id}`}
          variant="secondary"
          size="sm"
        >
          {t('viewDestination')}
          <StIcon name="chevron_r" size={12} />
        </StLinkButton>
      </div>
    </StCard>
  );
}
