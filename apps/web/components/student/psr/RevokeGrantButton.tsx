'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { StButton } from '@/components/st';
import { revokePsrGrant } from '@/lib/api/psr';

/**
 * Client island: revoke a single PSR access grant.
 *
 * Owner-driven mutation — the record-owner can withdraw a school's read
 * access at any time. Confirms via a lightweight inline modal before firing
 * (no accidental clicks lose access trails). On success calls
 * `router.refresh()` so the server-rendered PSR page re-fetches the grants
 * + audit lists and the just-revoked row flips to "revoked".
 */
export interface RevokeGrantButtonProps {
  grantId: number;
  granteeSchoolCode: string;
}

export function RevokeGrantButton({ grantId, granteeSchoolCode }: RevokeGrantButtonProps) {
  const router = useRouter();
  const t = useTranslations('student.psr');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      await revokePsrGrant(grantId);
      setConfirming(false);
      startTransition(() => router.refresh());
    } catch {
      setError(t('grants.revokeError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <StButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        {t('grants.revokeCta')}
      </StButton>
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('grants.confirmRevoke')}
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ background: 'rgba(42,24,16,0.55)' }}
        >
          <div
            className="w-full max-w-sm rounded-st-lg border p-5"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185,132,56,0.45)',
              boxShadow: 'var(--st-shadow-md)',
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('grants.confirmRevoke')}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
              {t('grants.confirmRevokeDetail', { school: granteeSchoolCode })}
            </p>
            {error && (
              <p className="mt-2 text-xs" style={{ color: 'var(--st-cinnabar)' }}>
                {error}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <StButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1"
              >
                {t('grants.cancel')}
              </StButton>
              <StButton
                type="button"
                variant="primary"
                size="md"
                onClick={onConfirm}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? t('grants.revoking') : t('grants.revokeConfirmCta')}
              </StButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
