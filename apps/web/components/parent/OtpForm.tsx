'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StInput } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { verifyParentLink } from '@/lib/api/parent';

/**
 * Step 2 of parent linking. Takes the OTP `challenge` returned by step 1 and
 * the 6-digit code the parent received by SMS, calls verify, then routes to
 * the hub on success.
 *
 * Error mapping uses the server's structured message where possible:
 *   - 410 / "expired" → expired code
 *   - 401/400 → bad code
 *   - anything else → generic network
 *
 * Like step 1, this is not queued — a verify needs a real-time server reply.
 */
export function OtpForm({ challenge }: { challenge: string }) {
  const router = useRouter();
  const t = useTranslations('parent');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(t('link.errors.badCode'));
      return;
    }
    setSubmitting(true);
    try {
      await verifyParentLink({ challenge, code });
      router.push('/parent');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body;
        const msg =
          body && typeof body === 'object' && typeof body.message === 'string'
            ? body.message.toLowerCase()
            : '';
        if (err.status === 410 || msg.includes('expire')) {
          setError(t('link.errors.expired'));
        } else if (err.status === 400 || err.status === 401 || err.status === 404) {
          setError(t('link.errors.badCode'));
        } else {
          setError(t('link.errors.network'));
        }
      } else {
        setError(t('link.errors.network'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="parent-otp-form">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="parent-otp-code"
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {t('link.otpLabel')}
        </label>
        <StInput
          id="parent-otp-code"
          name="code"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          pattern="\d{6}"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="······"
          aria-invalid={Boolean(error)}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}
      <StButton type="submit" variant="primary" size="md" disabled={submitting}>
        {submitting ? t('link.verifying') : t('link.verifyCta')}
      </StButton>
    </form>
  );
}
