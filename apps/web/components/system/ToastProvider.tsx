'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { StIcon } from '@/components/st';

/**
 * Corner-anchored toast notification system. Wired once at the root layout
 * via `<ToastProvider>`; any client component below it gets `useToast()`.
 *
 * Behavior:
 *  - 4s auto-dismiss for `success` and `info`; sticks until clicked for
 *    `error` so users don't miss them.
 *  - Max 3 toasts stacked. Older ones drop when a 4th lands.
 *  - Entrance/exit animations live in `globals.css` (.st-toast-in /
 *    .st-toast-out) and are auto-disabled by prefers-reduced-motion.
 *
 * Anchor: bottom-right on desktop, bottom-center on mobile. Doesn't
 * collide with the parent-chrome 420px phone frame because it lives
 * outside the chrome wrapper at the root portal.
 */

type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  variant: ToastVariant;
  text: string;
  /** When set, the toast won't auto-dismiss (errors default to this). */
  sticky?: boolean;
}

interface ToastContextValue {
  push: (input: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (input: Omit<Toast, 'id'>) => {
      idCounter.current += 1;
      const id = idCounter.current;
      const toast: Toast = { id, ...input, sticky: input.sticky ?? input.variant === 'error' };
      setToasts((cur) => {
        const next = [...cur, toast];
        // Drop oldest when over cap.
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      if (!toast.sticky) {
        const handle = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  // Clear pending timers on unmount.
  useEffect(() => {
    const refSnapshot = timers.current;
    return () => {
      refSnapshot.forEach((h) => window.clearTimeout(h));
      refSnapshot.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast() called outside <ToastProvider>');
  }
  return ctx;
}

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      data-testid="toast-stack"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const palette = paletteFor(toast.variant);
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss"
      className="st-toast-in pointer-events-auto flex w-full max-w-xs items-start gap-3 rounded-md border px-4 py-3 text-left text-sm shadow-md"
      style={{
        background: palette.bg,
        color: palette.fg,
        borderColor: palette.border,
      }}
      data-testid={`toast-${toast.variant}`}
    >
      <span aria-hidden className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center">
        <StIcon name={palette.icon} size={14} color={palette.fg} />
      </span>
      <span className="flex-1">{toast.text}</span>
    </button>
  );
}

function paletteFor(variant: ToastVariant): {
  bg: string;
  fg: string;
  border: string;
  icon: 'check' | 'x' | 'bell';
} {
  switch (variant) {
    case 'success':
      return {
        bg: 'var(--st-paper)',
        fg: 'var(--st-success)',
        border: 'rgba(92, 107, 59, 0.5)',
        icon: 'check',
      };
    case 'error':
      return {
        bg: 'var(--st-paper)',
        fg: 'var(--st-cinnabar)',
        border: 'rgba(154, 47, 8, 0.5)',
        icon: 'x',
      };
    case 'info':
    default:
      return {
        bg: 'var(--st-paper)',
        fg: 'var(--st-soot)',
        border: 'rgba(185, 132, 56, 0.5)',
        icon: 'bell',
      };
  }
}
