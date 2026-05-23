'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StCard } from '@/components/st';
import { logout } from '@/lib/api/auth';

/**
 * Lock-screen escape hatch — the only way off the focus surface.
 *
 * Pattern mirrors AuthStatus: confirm-modal → POST /auth/logout → hard
 * redirect to /login. We deliberately do NOT offer a "leave session but stay
 * signed in" path; a student can't usefully navigate the app while a session
 * is active (the API will keep redirecting them back here).
 */
export function FocusExitButton() {
  const t = useTranslations('student.focus');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    if (busy) return;
    setBusy(true);
    try {
      await logout().catch(() => undefined);
    } finally {
      // Hard navigation — drops any cached server props from the session-bound
      // route segment so the next page can't reuse a stale Me.
      window.location.href = '/login';
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border px-3 py-1 text-[12px] font-semibold"
        style={{
          color: 'var(--st-ink-2)',
          borderColor: 'rgba(185, 132, 56, 0.4)',
          background: 'transparent',
        }}
        data-testid="focus-exit"
      >
        {t('exitCta')}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('exitCta')}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <StCard padding="lg" className="w-full max-w-sm">
            <p className="text-sm" style={{ color: 'var(--st-ink)' }}>
              {t('exitConfirm')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <StButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                {t('exitConfirmNo')}
              </StButton>
              <StButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={busy}
              >
                {t('exitConfirmYes')}
              </StButton>
            </div>
          </StCard>
        </div>
      )}
    </>
  );
}
