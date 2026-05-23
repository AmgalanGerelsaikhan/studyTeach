import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import clsx from 'clsx';

/**
 * Variant semantics — pick by intent, not color preference.
 * Full table lives in `docs/DESIGN_SYSTEM.md#button-variant-semantics`.
 *
 * - `primary` — the dominant action in a surface (one per context):
 *               Submit, Enroll, Send, Pay.
 * - `brass`   — branded entry to a named MozaTeach product surface:
 *               Open AI Tutor, Open EGSh, Open Olympiad detail.
 *               Reserved for identity-bearing CTAs; not a generic CTA.
 * - `secondary` — neutral default: Back, Cancel, View, Retake.
 * - `ghost`   — tertiary / icon-only / inline kebabs.
 *
 * For navigation use `StLinkButton` (renders `<a>` via next/link);
 * never wrap `<StButton>` inside `<Link>` — invalid HTML.
 */
export type StButtonVariant = 'primary' | 'secondary' | 'brass' | 'ghost';
export type StButtonSize = 'sm' | 'md' | 'lg';

export interface StButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: StButtonVariant;
  size?: StButtonSize;
  /** Full-width: emits `w-full` + switches `inline-flex` → `flex`. */
  block?: boolean;
  children: ReactNode;
}

// Shared with StLinkButton so the visual contract stays in one place. Putting
// a <button> inside <a> is invalid HTML and triggers React hydration errors,
// so callers that need a navigating button must use StLinkButton — both render
// identically by sharing these tokens.
export const ST_BUTTON_BASE =
  'items-center justify-center font-semibold whitespace-nowrap border transition-[transform,box-shadow,background] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

/** Display mode — applied alongside `ST_BUTTON_BASE`. */
export const ST_BUTTON_DISPLAY = {
  inline: 'inline-flex',
  block: 'flex w-full',
} as const;

export const ST_BUTTON_SIZE: Record<StButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-st-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-st-md',
  lg: 'h-12 px-5 text-base gap-2 rounded-st-md',
};

export const ST_BUTTON_VARIANT_CLASS: Record<StButtonVariant, string> = {
  primary: '',
  secondary: '',
  brass: '',
  ghost: 'border-transparent text-ink hover:bg-brass/10',
};

export const ST_BUTTON_VARIANT_STYLE: Record<StButtonVariant, CSSProperties> = {
  primary: {
    background:
      'linear-gradient(180deg, var(--st-ember-bright) 0%, var(--st-ember) 50%, var(--st-ember-deep) 100%)',
    color: '#FBF3E2',
    borderColor: 'var(--st-cinnabar)',
    boxShadow: 'var(--st-shadow-sm), inset 0 1px 0 rgba(255,255,255,0.25)',
  },
  secondary: {
    background: 'var(--st-paper)',
    color: 'var(--st-ink)',
    borderColor: 'rgba(185, 132, 56, 0.5)',
    boxShadow: 'var(--st-shadow-sm)',
  },
  brass: {
    background:
      'linear-gradient(180deg, var(--st-brass-bright) 0%, var(--st-brass) 80%, var(--st-brass-dark) 100%)',
    color: 'var(--st-soot)',
    borderColor: 'var(--st-brass-dark)',
    boxShadow: 'var(--st-shadow-sm), inset 0 1px 0 rgba(255,255,255,0.35)',
  },
  ghost: { background: 'transparent' },
};

export function StButton({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  children,
  ...rest
}: StButtonProps) {
  return (
    <button
      className={clsx(
        ST_BUTTON_BASE,
        block ? ST_BUTTON_DISPLAY.block : ST_BUTTON_DISPLAY.inline,
        ST_BUTTON_SIZE[size],
        ST_BUTTON_VARIANT_CLASS[variant],
        className,
      )}
      style={ST_BUTTON_VARIANT_STYLE[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface StLinkButtonProps
  extends
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
    Pick<LinkProps, 'href' | 'prefetch' | 'replace' | 'scroll'> {
  variant?: StButtonVariant;
  size?: StButtonSize;
  /** Full-width: emits `w-full` + switches `inline-flex` → `flex`. */
  block?: boolean;
  children: ReactNode;
}

/**
 * Navigation-as-button. Renders an <a> via next/link with the same visual
 * tokens as StButton, so we never put a <button> inside an <a> (invalid HTML
 * + React hydration error). Use this for any control whose primary action
 * is "navigate to URL".
 */
export function StLinkButton({
  variant = 'secondary',
  size = 'md',
  block = false,
  className,
  children,
  href,
  prefetch,
  replace,
  scroll,
  ...rest
}: StLinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      className={clsx(
        ST_BUTTON_BASE,
        block ? ST_BUTTON_DISPLAY.block : ST_BUTTON_DISPLAY.inline,
        ST_BUTTON_SIZE[size],
        ST_BUTTON_VARIANT_CLASS[variant],
        className,
      )}
      style={ST_BUTTON_VARIANT_STYLE[variant]}
      {...rest}
    >
      {children}
    </Link>
  );
}
