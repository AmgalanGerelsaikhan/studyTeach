import type { CSSProperties } from 'react';
import clsx from 'clsx';

/**
 * Cream-on-cream placeholder block with a brass shimmer (see `.st-skeleton`
 * in globals.css). Drop-in replacement for the literal string
 * "Уншиж байна…" that several persona surfaces render today.
 *
 * Variants are the four shapes we actually use:
 *  - `text`   — single line, 1em tall, configurable width.
 *  - `chip`   — short pill, e.g. for org/role chips inflight.
 *  - `card`   — full StCard placeholder block.
 *  - `avatar` — 32px circle.
 *
 * Always set `aria-hidden` so screen readers don't announce the loading
 * shimmer as content; consumers should pair with `aria-busy` on the
 * region that's loading.
 */

export type StSkeletonVariant = 'text' | 'chip' | 'card' | 'avatar';

export interface StSkeletonProps {
  variant?: StSkeletonVariant;
  /** Override width — defaults per-variant. Accepts any CSS length. */
  width?: string;
  /** Override height — defaults per-variant. */
  height?: string;
  /** Number of stacked rows (text variant only). */
  rows?: number;
  className?: string;
  style?: CSSProperties;
}

const DEFAULTS: Record<StSkeletonVariant, { width: string; height: string; radius: string }> = {
  text: { width: '100%', height: '1em', radius: 'var(--st-r-sm)' },
  chip: { width: '88px', height: '22px', radius: '999px' },
  card: { width: '100%', height: '128px', radius: 'var(--st-r-md)' },
  avatar: { width: '32px', height: '32px', radius: '999px' },
};

export function StSkeleton({
  variant = 'text',
  width,
  height,
  rows = 1,
  className,
  style,
}: StSkeletonProps) {
  const d = DEFAULTS[variant];
  if (variant === 'text' && rows > 1) {
    return (
      <span aria-hidden className={clsx('flex flex-col gap-2', className)} style={style}>
        {Array.from({ length: rows }).map((_, i) => (
          <span
            key={i}
            className="st-skeleton block"
            style={{
              // Last row is naturally shorter so the column doesn't read as a
              // perfect rectangle.
              width: i === rows - 1 ? (width ?? '60%') : (width ?? d.width),
              height: height ?? d.height,
              borderRadius: d.radius,
            }}
          >
            ·
          </span>
        ))}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={clsx('st-skeleton inline-block', className)}
      style={{
        width: width ?? d.width,
        height: height ?? d.height,
        borderRadius: d.radius,
        ...style,
      }}
    >
      ·
    </span>
  );
}
