import clsx from 'clsx';

import { StSoyomboFlame } from './motifs';

/**
 * Soyombo-flame loading spinner. Replaces literal "Уншиж байна…" strings on
 * indeterminate-shape loads (use `StSkeleton` for known-shape loads).
 *
 * Three sizes — sm (16px), md (24px), lg (40px) — chosen to slot into chips,
 * inline-text rows, and full-card empty states respectively.
 *
 * Motion: 1.2s linear rotation via `.st-spinner-rotate` (defined in
 * globals.css). Honours `prefers-reduced-motion` automatically by holding
 * the flame static — the brand mark itself is still meaningful as a "we're
 * waiting" affordance without rotation.
 *
 * The spinner is decorative; the visible label (if any) carries the
 * accessible loading state. We expose `label` as a convenience so callers
 * can render a screen-reader-only string alongside.
 */

const SIZES = {
  sm: 16,
  md: 24,
  lg: 40,
} as const;

export type StSpinnerSize = keyof typeof SIZES;

export interface StSpinnerProps {
  size?: StSpinnerSize;
  /** Optional visually-hidden label for assistive tech. */
  label?: string;
  className?: string;
}

export function StSpinner({ size = 'md', label, className }: StSpinnerProps) {
  const px = SIZES[size];
  return (
    <span
      role="status"
      aria-live="polite"
      className={clsx('inline-flex items-center justify-center', className)}
      data-testid="st-spinner"
    >
      <span
        aria-hidden="true"
        className="st-spinner-rotate inline-flex"
        style={{ width: px, height: px }}
      >
        <StSoyomboFlame size={px} color="var(--st-brass)" />
      </span>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
