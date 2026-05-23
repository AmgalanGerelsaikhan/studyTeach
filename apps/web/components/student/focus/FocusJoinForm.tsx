'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StInput } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { joinFocusSessionClient } from '@/lib/api/focus';

/**
 * Student-side code-entry form. Posts to /focus/sessions/join then triggers a
 * server-component refresh so the page re-renders into the lock screen.
 *
 * Not offline-aware (deliberate) — there is no point queueing a join when the
 * server is the only thing that can confirm the code.
 */
export function FocusJoinForm() {
  const t = useTranslations('student.focus');
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      setError(t('joinError'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await joinFocusSessionClient({ code });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(t('joinError'));
      } else {
        setError(t('joinError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="focus-join-form">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="focus-join-code"
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {t('codeLabel')}
        </label>
        <StInput
          id="focus-join-code"
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 6),
            )
          }
          placeholder="······"
          aria-invalid={Boolean(error)}
          className="text-center tracking-[0.4em] font-display text-lg"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}
      <StButton type="submit" variant="primary" size="md" disabled={submitting}>
        {t('joinCta')}
      </StButton>
    </form>
  );
}
