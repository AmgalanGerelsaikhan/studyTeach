'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StInput } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { createParentLink } from '@/lib/api/parent';

/**
 * Step 1 of parent linking. Submits the national-ID hash + school code, then
 * hands the returned `otp_challenge` to the OTP step via the `onChallenge`
 * callback (the parent page composes both forms).
 *
 * Error mapping: a 404/400 from the server is surfaced as "child not found"
 * — the backend deliberately does not distinguish "no such hash" from "wrong
 * school" to limit enumeration of student records.
 *
 * Offline behaviour: this write is *not* queued (we need the challenge to
 * continue), so we surface a clear network error and let the parent retry.
 */
export function LinkRequestForm({ onChallenge }: { onChallenge: (challenge: string) => void }) {
  const t = useTranslations('parent');
  const [nationalIdHash, setNationalIdHash] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (nationalIdHash.trim().length < 8 || schoolCode.trim().length < 1) {
      setError(t('link.errors.incomplete'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await createParentLink({
        national_id_hash: nationalIdHash.trim(),
        school_code: schoolCode.trim(),
      });
      onChallenge(res.otp_challenge);
    } catch (err) {
      if (err instanceof ApiError) {
        // 400/404 → not found, anything else → generic. We do not echo the
        // server's message to avoid leaking which field was wrong.
        setError(
          err.status >= 400 && err.status < 500
            ? t('link.errors.notFound')
            : t('link.errors.network'),
        );
      } else {
        setError(t('link.errors.network'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="parent-link-form">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="parent-link-national-id"
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {t('link.nationalIdLabel')}
        </label>
        <StInput
          id="parent-link-national-id"
          name="national_id_hash"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
          value={nationalIdHash}
          onChange={(e) => setNationalIdHash(e.target.value)}
          placeholder={t('link.nationalIdPlaceholder')}
          aria-invalid={Boolean(error)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="parent-link-school-code"
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {t('link.schoolCodeLabel')}
        </label>
        <StInput
          id="parent-link-school-code"
          name="school_code"
          autoComplete="off"
          inputMode="text"
          spellCheck={false}
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          placeholder={t('link.schoolCodePlaceholder')}
          aria-invalid={Boolean(error)}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}
      <StButton type="submit" variant="primary" size="md" disabled={submitting}>
        {submitting ? t('link.submitting') : t('link.submit')}
      </StButton>
    </form>
  );
}
