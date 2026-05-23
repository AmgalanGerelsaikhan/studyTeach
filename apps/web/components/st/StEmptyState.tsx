import type { ReactNode } from 'react';

import { StSoyomboFlame } from './motifs';
import { StCard } from './StCard';

/**
 * Branded empty state. Replaces the ~12 places that currently render a
 * bare paragraph in a card ("Бүртгэгдсэн олимпиад алга" / "Курс олдсонгүй"
 * / etc.) — those look like quiet errors. This one looks like an
 * invitation: small glyph, warm title, a sentence of context, optional
 * primary CTA.
 *
 * Default glyph is the Soyombo flame at 32px in brass. Callers can pass
 * a different motif (StUlzii for record surfaces, a StSubjectGlyph for
 * subject-specific empties, etc.).
 */
export interface StEmptyStateProps {
  title: string;
  body?: ReactNode;
  cta?: ReactNode;
  glyph?: ReactNode;
  /** Wraps the content in a StCard with the standard padding. Defaults true. */
  card?: boolean;
}

export function StEmptyState({ title, body, cta, glyph, card = true }: StEmptyStateProps) {
  const inner = (
    <div
      className="flex flex-col items-center gap-3 py-4 text-center sm:py-6"
      data-testid="st-empty-state"
    >
      <span aria-hidden className="flex h-10 w-10 items-center justify-center">
        {glyph ?? <StSoyomboFlame size={32} color="var(--st-brass-bright)" />}
      </span>
      <h3 className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
        {title}
      </h3>
      {body && (
        <p className="max-w-xs text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {body}
        </p>
      )}
      {cta && <div className="mt-1">{cta}</div>}
    </div>
  );
  if (!card) return inner;
  return <StCard padding="md">{inner}</StCard>;
}
