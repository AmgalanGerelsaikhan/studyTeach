import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Tone = 'default' | 'ember' | 'brass' | 'moss' | 'sky' | 'soot';

export interface StChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const TONE: Record<Tone, React.CSSProperties> = {
  default: {
    background: 'var(--st-paper-2)',
    color: 'var(--st-ink)',
    borderColor: 'rgba(185, 132, 56, 0.35)',
  },
  ember: {
    background: 'rgba(194, 65, 12, 0.12)',
    color: 'var(--st-cinnabar)',
    borderColor: 'rgba(194, 65, 12, 0.3)',
  },
  brass: {
    // Was `color: var(--st-brass-dark)` (#8c5f22) on the brass tint —
    // axe flagged it at 4.24:1 vs WCAG AA 4.5:1. Bumping to soot (#2a1810)
    // takes the pair to ~13:1 and keeps the brass aura via the bg + border.
    background: 'rgba(185, 132, 56, 0.18)',
    color: 'var(--st-soot)',
    borderColor: 'rgba(140, 95, 34, 0.4)',
  },
  moss: {
    background: 'rgba(92, 107, 59, 0.18)',
    color: '#4a5630',
    borderColor: 'rgba(92, 107, 59, 0.3)',
  },
  sky: {
    background: 'rgba(62, 95, 115, 0.15)',
    color: '#34526a',
    borderColor: 'rgba(62, 95, 115, 0.3)',
  },
  soot: {
    background: 'var(--st-soot)',
    color: '#F4E8D1',
    borderColor: 'var(--st-soot)',
  },
};

export function StChip({ tone = 'default', className, children, style, ...rest }: StChipProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        className,
      )}
      style={{ ...TONE[tone], ...style }}
      {...rest}
    >
      {children}
    </span>
  );
}
