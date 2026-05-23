'use client';

import { useTranslations } from 'next-intl';

import { StCard } from '@/components/st';

interface Props {
  daysAway: number;
  title: string;
  date: string;
  fee: string;
  venue: string;
  paid: boolean;
}

/**
 * Mirrors `studyTeach (2)/family.jsx → ParentPortal` upcoming-olympiad card.
 * Ember-gradient card with brass corner brackets + 3-column metadata grid.
 */
export function UpcomingOlympiadCard({ daysAway, title, date, fee, venue, paid }: Props) {
  const t = useTranslations('parent');
  return (
    <StCard variant="ember" padding="md" className="relative overflow-hidden">
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#F4C99A' }}>
        {t('olymp.eyebrow', { n: daysAway })}
      </p>
      <p
        className="mt-1 font-display text-[15px] font-bold leading-tight"
        style={{ color: '#FBF3E2' }}
      >
        {title}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]" style={{ color: '#F4E8D1' }}>
        <MetaCell label={t('olymp.dateLabel')} value={date} />
        <MetaCell
          label={t('olymp.feeLabel')}
          value={`${fee} · ${paid ? t('olymp.paid') : t('olymp.pending')}`}
        />
        <MetaCell label={t('olymp.venueLabel')} value={venue} />
      </div>
    </StCard>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9.5px] tracking-[0.1em]" style={{ color: '#F4C99A' }}>
        {label}
      </p>
      <p className="mt-0.5 font-semibold leading-tight" style={{ color: '#FBF3E2' }}>
        {value}
      </p>
    </div>
  );
}

function CornerBracket({ position }: { position: 'tl' | 'tr' }) {
  const isLeft = position === 'tl';
  return (
    <svg
      aria-hidden="true"
      className="absolute h-5 w-5"
      style={{
        top: 8,
        left: isLeft ? 8 : undefined,
        right: isLeft ? undefined : 8,
        transform: isLeft ? undefined : 'scaleX(-1)',
      }}
      viewBox="0 0 20 20"
      fill="none"
      stroke="#F4C99A"
      strokeWidth="1.5"
    >
      <path d="M2 8 L2 2 L8 2" />
    </svg>
  );
}
