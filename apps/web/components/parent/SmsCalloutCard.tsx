'use client';

import { useTranslations } from 'next-intl';

import { StCard, StChip, StIcon } from '@/components/st';

/**
 * Mirrors `studyTeach (2)/family.jsx → ParentPortal` SMS callout. Sky gradient
 * background, sky chip, body copy explaining the offline-SMS fallback.
 */
export function SmsCalloutCard() {
  const t = useTranslations('parent');
  return (
    <StCard
      padding="md"
      style={{
        background: 'linear-gradient(180deg, var(--st-paper) 0%, rgba(62,95,115,0.10) 100%)',
        borderColor: 'var(--st-sky)',
      }}
    >
      <header className="flex items-center gap-2">
        <StIcon name="sms" size={15} color="var(--st-sky)" />
        <p className="text-[10.5px] font-bold tracking-[0.12em]" style={{ color: 'var(--st-sky)' }}>
          {t('sms.label')}
        </p>
        <StChip tone="sky" className="ml-auto">
          {t('sms.active')}
        </StChip>
      </header>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--st-ink)' }}>
        {t('sms.body')}
      </p>
    </StCard>
  );
}
