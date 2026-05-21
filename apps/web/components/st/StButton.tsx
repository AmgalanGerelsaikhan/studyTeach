import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'brass' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface StButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const SIZE: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-st-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-st-md',
  lg: 'h-12 px-5 text-base gap-2 rounded-st-md',
};

export function StButton({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: StButtonProps) {
  const base =
    'inline-flex items-center justify-center font-semibold whitespace-nowrap border transition-[transform,box-shadow,background] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<Variant, string> = {
    primary: '',
    secondary: '',
    brass: '',
    ghost: 'border-transparent text-ink hover:bg-brass/10',
  };

  const inline: Record<Variant, React.CSSProperties> = {
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

  return (
    <button
      className={clsx(base, SIZE[size], variantStyles[variant], className)}
      style={inline[variant]}
      {...rest}
    >
      {children}
    </button>
  );
}
