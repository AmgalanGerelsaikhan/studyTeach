import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'felt' | 'ember' | 'soot';
type Padding = 'tight' | 'md' | 'lg';

/**
 * Padding convention across personas (audit finding D3):
 *   - `lg`    — page hero card (one per persona surface), or any card that
 *               carries a persona-level title + eyebrow + subtitle.
 *   - `md`    — default content card. Use for olympiad/payment/grade lists,
 *               filter islands, individual catalog items, etc.
 *   - `tight` — compact in-card lists or chips where margin overhead would
 *               crowd the row. Rarely the right choice for a top-level card.
 *
 * Persona-bar / chrome cards live outside StCard — see ParentChrome, the
 * teacher sidebar, and PersonaStub for those wrappers.
 */
export interface StCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  tacked?: boolean;
  children: ReactNode;
}

const PAD: Record<Padding, string> = { tight: 'p-4', md: 'p-5', lg: 'p-7' };

export function StCard({
  variant = 'felt',
  padding = 'md',
  tacked = false,
  className,
  children,
  ...rest
}: StCardProps) {
  // min-w-0: a card is never the thing that should refuse to shrink. Grid +
  // flex children default to min-width:auto, which overflows narrow
  // viewports when a card sits inside a grid/flex track. Allowing every
  // card to shrink is always correct — content inside handles its own
  // truncation / wrapping.
  const base = 'relative min-w-0 rounded-st-lg border';
  const styles: Record<Variant, React.CSSProperties> = {
    felt: {
      background: 'var(--st-paper)',
      borderColor: 'rgba(185, 132, 56, 0.35)',
      boxShadow: 'var(--st-shadow-md)',
    },
    ember: {
      background: 'linear-gradient(180deg, var(--st-ember) 0%, var(--st-ember-deep) 100%)',
      color: '#FBF3E2',
      borderColor: 'var(--st-cinnabar)',
      boxShadow: 'var(--st-shadow-md)',
    },
    soot: {
      background: 'linear-gradient(180deg, var(--st-soot) 0%, #1A0F08 100%)',
      color: '#F4E8D1',
      borderColor: 'transparent',
      boxShadow: 'var(--st-shadow-md)',
    },
  };
  return (
    <div className={clsx(base, PAD[padding], className)} style={styles[variant]} {...rest}>
      {tacked && (
        <>
          <span
            aria-hidden="true"
            className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, var(--st-brass-bright) 0%, var(--st-brass-dark) 80%)',
              boxShadow: '0 0 0 1px rgba(42,24,16,0.2), 0 1px 2px rgba(42,24,16,0.4)',
            }}
          />
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, var(--st-brass-bright) 0%, var(--st-brass-dark) 80%)',
              boxShadow: '0 0 0 1px rgba(42,24,16,0.2), 0 1px 2px rgba(42,24,16,0.4)',
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}
