'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { StIcon } from '@/components/st';

/**
 * One-shot brass-on-cream check stamp. Renders a circular brass-line badge
 * with the canonical `StIcon` checkmark and runs the Phase A `.st-stamp-in`
 * keyframe once on mount. Pair with `useToast({ variant: 'success' })` so
 * users who scrolled away still see the confirmation in the corner stack.
 *
 * Why client-only: the stamp must replay its mount animation each time it
 * appears (e.g. after a conditional render flips). A server component
 * wouldn't get the mount lifecycle. We also key the animated wrapper to a
 * mount tick so a future re-show inside the same tree re-triggers cleanly.
 *
 * Honours `prefers-reduced-motion` via the same guard that disables
 * `.st-stamp-in` globally — the stamp simply appears instead of scaling in.
 */

export interface SuccessStampProps {
  /** Diameter in px. Defaults to 32. */
  size?: number;
  /** Optional inline label rendered to the right of the stamp. */
  text?: string;
  className?: string;
}

export function SuccessStamp({ size = 32, text, className }: SuccessStampProps) {
  // Tick guarantees the keyframe runs again if the parent toggles us off→on
  // inside the same render tree (e.g. PulseForm re-mounts the thanks panel).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick((n) => n + 1);
  }, []);

  return (
    <span className={clsx('inline-flex items-center gap-2', className)} data-testid="success-stamp">
      <span
        key={tick}
        aria-hidden="true"
        className="st-stamp-in inline-flex items-center justify-center rounded-full border"
        style={{
          width: size,
          height: size,
          background: 'var(--st-paper)',
          borderColor: 'var(--st-brass)',
          boxShadow: 'var(--st-shadow-sm)',
        }}
      >
        <StIcon name="check" size={Math.round(size * 0.5)} color="var(--st-brass-dark)" />
      </span>
      {text ? (
        <span className="text-[12px] font-semibold" style={{ color: 'var(--st-brass-dark)' }}>
          {text}
        </span>
      ) : null}
    </span>
  );
}
