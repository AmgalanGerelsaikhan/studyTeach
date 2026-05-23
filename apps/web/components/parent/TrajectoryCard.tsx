'use client';

import { useTranslations } from 'next-intl';

import { StCard } from '@/components/st';

interface Props {
  /** Percent scores (0..100) ordered oldest → newest. */
  samples: number[];
  /** Latest EGSh-scaled score for the big number. */
  latestScore: number;
  /** Improvement vs N months ago, for the small footer. */
  monthDelta: number;
}

const SVG_W = 320;
const SVG_H = 60;

/**
 * Mirrors `studyTeach (2)/family.jsx → ParentPortal` ЭЕШ trajectory. Plots
 * a sparkline of percent scores with marker dots; renders the latest score
 * as the big number on the right header.
 *
 * Empty samples → empty-state copy (the parent has no scored mocks yet).
 */
export function TrajectoryCard({ samples, latestScore, monthDelta }: Props) {
  const t = useTranslations('parent');
  if (samples.length < 2) {
    return (
      <StCard padding="tight">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('trajectory.eyebrow')}
        </p>
        <p className="mt-2 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('trajectory.empty')}
        </p>
      </StCard>
    );
  }
  const stepX = SVG_W / (samples.length - 1);
  const points = samples.map((s, i) => {
    const x = i * stepX;
    // Invert y because SVG origin is top-left; scale to 4..56 to leave margin.
    const y = 56 - (s / 100) * 52 + 4;
    return [x, y] as const;
  });
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  return (
    <StCard padding="tight">
      <header className="flex items-start justify-between">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('trajectory.eyebrow')}
          </p>
          <p
            className="mt-1 font-display text-[13px] font-bold"
            style={{ color: 'var(--st-soot)' }}
          >
            {t('trajectory.title', { n: samples.length })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold" style={{ color: 'var(--st-moss)' }}>
            {latestScore}
          </p>
          <p className="text-[9.5px]" style={{ color: 'var(--st-ink-3)' }}>
            {t('trajectory.monthDelta', { n: monthDelta })}
          </p>
        </div>
      </header>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mt-2 block h-[60px] w-full">
        <line
          x1="0"
          x2={SVG_W}
          y1="32"
          y2="32"
          stroke="#3E5F73"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.5"
        />
        <path d={d} stroke="#C2410C" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#C2410C" stroke="#FBF3E2" strokeWidth="1.2" />
        ))}
      </svg>
    </StCard>
  );
}
