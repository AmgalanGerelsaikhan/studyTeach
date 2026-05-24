import Link from 'next/link';

import { StSoyomboFlame } from '@/components/st';

export interface MozaLogoProps {
  /** Where the logo links to. Omit for non-clickable headers (centered hero). */
  href?: string;
  /** sm: mobile bar / login modal · md: sidebar / chrome · lg: landing hero */
  size?: 'sm' | 'md' | 'lg';
  /** Show the brass-mono tagline under the wordmark. Defaults to false in `sm`. */
  showTagline?: boolean;
  /** aria-label override. Defaults to "MozaTeach". */
  ariaLabel?: string;
  className?: string;
}

/**
 * MozaTeach brand mark — the landing page treatment, ported into a single
 * reusable component so chrome (sidebar, mobile bar, login, signup,
 * parent header) looks identical to the public site.
 *
 * The visual recipe matches `landingpage/Тест/landing/index.html`:
 *   - soot square with brass-dark border, brass-bright Soyombo flame inside
 *   - "Moza" in soot + "Teach" in ember inside one wordmark
 *   - optional brass-dark mono tagline under the wordmark
 */
export function MozaLogo({
  href,
  size = 'md',
  showTagline,
  ariaLabel = 'MozaTeach',
  className,
}: MozaLogoProps) {
  const dims = SIZE[size];
  const tagline = showTagline ?? size !== 'sm';
  const body = (
    <span className={['flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <span
        aria-hidden
        className="grid flex-shrink-0 place-items-center rounded-[4px] border"
        style={{
          background: 'var(--st-soot)',
          borderColor: 'var(--st-brass-dark)',
          width: dims.square,
          height: dims.square,
        }}
      >
        <StSoyomboFlame size={dims.flame} color="#D4A24C" />
      </span>
      <span className="flex flex-col">
        <span
          className="block font-display font-bold leading-none"
          style={{ color: 'var(--st-soot)', fontSize: dims.wordmark }}
        >
          Moza<span style={{ color: 'var(--st-ember)' }}>Teach</span>
        </span>
        {tagline && (
          <span
            className="mt-0.5 block font-mono uppercase"
            style={{
              color: 'var(--st-brass-dark)',
              fontSize: dims.tagline,
              letterSpacing: '0.14em',
            }}
          >
            Боловсролын нэгдсэн систем
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-flex">
        {body}
      </Link>
    );
  }
  return body;
}

const SIZE = {
  sm: { square: 28, flame: 16, wordmark: 15, tagline: 9 },
  md: { square: 36, flame: 20, wordmark: 18, tagline: 10 },
  lg: { square: 36, flame: 20, wordmark: 20, tagline: 10.5 },
} as const;
