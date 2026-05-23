'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StInput } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { createPsrGrant } from '@/lib/api/psr';

/**
 * Client island: issue a new PSR access grant to a school.
 *
 * Two-input form (school code + optional reason). On success calls
 * `router.refresh()` so the server-rendered grants table re-fetches and
 * the freshly-issued grant appears at the top.
 *
 * Validation is intentionally minimal client-side — the server is the
 * source of truth (zod CreatePsrGrantRequest). We surface its 4xx body
 * via the typed ApiError so the user sees the actual reason.
 */
export function GrantAccessForm() {
  const router = useRouter();
  const t = useTranslations('student.psr');
  const [schoolCode, setSchoolCode] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const trimmed = schoolCode.trim();
    if (trimmed.length === 0) {
      setError(t('grantForm.errorEmpty'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPsrGrant({
        grantee_school_code: trimmed,
        reason: reason.trim() || undefined,
      });
      if (result.status === 'queued') {
        setSuccess(true);
        setSchoolCode('');
        setReason('');
        startTransition(() => router.refresh());
        return;
      }
      setSuccess(true);
      setSchoolCode('');
      setReason('');
      startTransition(() => router.refresh());
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(t('grantForm.errorInvalid'));
      } else {
        setError(t('grantForm.error'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="psr-grant-form">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="psr-grant-school"
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('grantForm.schoolLabel')}
        </label>
        <StInput
          id="psr-grant-school"
          name="school_code"
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          placeholder={t('grantForm.schoolPlaceholder')}
          autoComplete="off"
          maxLength={64}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="psr-grant-reason"
          className="text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('grantForm.reasonLabel')}
        </label>
        <StInput
          id="psr-grant-reason"
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('grantForm.reasonPlaceholder')}
          autoComplete="off"
          maxLength={500}
        />
      </div>
      {error && (
        <p className="text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-[12px]" style={{ color: 'var(--st-brass-dark)' }}>
          {t('grantForm.success')}
        </p>
      )}
      <div>
        <StButton type="submit" variant="primary" size="md" disabled={submitting}>
          {submitting ? t('grantForm.submitting') : t('grantForm.submit')}
        </StButton>
      </div>
    </form>
  );
}
