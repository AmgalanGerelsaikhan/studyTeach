/**
 * Smaller atoms: Avatar, Progress, Divider, Tab, Input, PhoneBezel.
 * Larger components live in dedicated files.
 */
import type { CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

// ─── StAvatar ───────────────────────────────────────────────────────────────
type AvatarTone = 'ember' | 'brass' | 'sky' | 'moss';
export function StAvatar({
  initial,
  tone = 'ember',
  size = 36,
}: {
  initial: string;
  tone?: AvatarTone;
  size?: number;
}) {
  const palette: Record<AvatarTone, CSSProperties> = {
    ember: {
      background: 'linear-gradient(135deg, var(--st-ember) 0%, var(--st-cinnabar) 100%)',
      color: '#FBF3E2',
    },
    brass: {
      background: 'linear-gradient(135deg, var(--st-brass-bright) 0%, var(--st-brass-dark) 100%)',
      color: 'var(--st-soot)',
    },
    sky: {
      background: 'linear-gradient(135deg, var(--st-sky-bright) 0%, var(--st-sky) 100%)',
      color: '#FBF3E2',
    },
    moss: {
      background: 'linear-gradient(135deg, var(--st-moss-bright) 0%, var(--st-moss) 100%)',
      color: '#FBF3E2',
    },
  };
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border font-display font-bold"
      style={{
        ...palette[tone],
        width: size,
        height: size,
        fontSize: size * 0.4,
        borderWidth: 1.5,
        borderColor: 'var(--st-brass)',
        boxShadow: 'var(--st-shadow-sm)',
      }}
    >
      {initial}
    </span>
  );
}

// ─── StProgress ─────────────────────────────────────────────────────────────
export function StProgress({ value, height = 8 }: { value: number; height?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative w-full overflow-hidden rounded-full"
      style={{ height, background: 'var(--st-felt)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${clamped}%`,
          background: 'linear-gradient(90deg, var(--st-brass) 0%, var(--st-ember) 100%)',
        }}
      />
    </div>
  );
}

// ─── StDivider ──────────────────────────────────────────────────────────────
export function StDivider({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: 1,
          background:
            'linear-gradient(180deg, transparent 0%, rgba(185,132,56,0.5) 20%, rgba(185,132,56,0.5) 80%, transparent 100%)',
        }}
      />
    );
  }
  return (
    <hr
      aria-hidden="true"
      className="border-0"
      style={{
        height: 1,
        background:
          'linear-gradient(90deg, transparent 0%, rgba(185,132,56,0.5) 20%, rgba(185,132,56,0.5) 80%, transparent 100%)',
      }}
    />
  );
}

// ─── StTab ──────────────────────────────────────────────────────────────────
export interface StTabProps extends HTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'soot' | 'brass';
  children: ReactNode;
}

export function StTab({
  active = false,
  variant = 'soot',
  className,
  children,
  ...rest
}: StTabProps) {
  const inactive: CSSProperties = {
    background: 'transparent',
    color: 'var(--st-ink-2)',
    borderColor: 'transparent',
  };
  const activeStyle: CSSProperties =
    variant === 'soot'
      ? { background: 'var(--st-soot)', color: '#FBF3E2', borderColor: 'var(--st-soot)' }
      : {
          background: 'linear-gradient(180deg, var(--st-brass) 0%, var(--st-brass-dark) 100%)',
          color: 'var(--st-soot)',
          borderColor: 'var(--st-brass-dark)',
        };
  return (
    <button
      type="button"
      className={clsx(
        'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
        className,
      )}
      style={active ? activeStyle : inactive}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── StInput ────────────────────────────────────────────────────────────────
export interface StInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function StInput({ invalid = false, className, style, ...rest }: StInputProps) {
  return (
    <input
      className={clsx(
        'w-full rounded-st-md px-3 py-2.5 text-sm transition-shadow focus:outline-none',
        className,
      )}
      style={{
        background: 'var(--st-paper)',
        color: 'var(--st-ink)',
        border: `1px solid ${invalid ? 'var(--st-danger)' : 'rgba(185, 132, 56, 0.4)'}`,
        boxShadow: 'none',
        ...style,
      }}
      {...rest}
    />
  );
}

// ─── StPhoneBezel / StPhoneScreen ───────────────────────────────────────────
export function StPhoneBezel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[36px] p-2.5"
      style={{
        background: 'var(--st-soot)',
        boxShadow: '0 12px 40px rgba(42,24,16,0.25), inset 0 0 0 2px var(--st-brass-dark)',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="h-full w-full overflow-hidden rounded-[28px]"
        style={{ background: 'var(--st-cream)' }}
      >
        {children}
      </div>
    </div>
  );
}
