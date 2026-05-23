'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StCard } from '@/components/st';

import { LinkRequestForm } from './LinkRequestForm';
import { OtpForm } from './OtpForm';

/**
 * Two-step composer for the parent linking flow. Owns the `challenge` state
 * that bridges step 1 (request) and step 2 (verify). The page itself stays
 * a server component — only this island is client-side.
 */
export function LinkFlow() {
  const t = useTranslations('parent');
  const [challenge, setChallenge] = useState<string | null>(null);

  if (challenge === null) {
    return (
      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('link.stepOneEyebrow')}
        </p>
        <h2 className="mt-1 font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('link.title')}
        </h2>
        <p className="mt-1 mb-4 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('link.subtitle')}
        </p>
        <LinkRequestForm onChallenge={setChallenge} />
      </StCard>
    );
  }

  return (
    <StCard padding="md">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {t('link.stepTwoEyebrow')}
      </p>
      <h2 className="mt-1 font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
        {t('link.otpTitle')}
      </h2>
      <p className="mt-1 mb-4 text-sm" style={{ color: 'var(--st-ink-2)' }}>
        {t('link.otpSubtitle')}
      </p>
      <OtpForm challenge={challenge} />
    </StCard>
  );
}
