'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { StButton } from '@/components/st';
import { revokeParentLink, revokeSchoolAccess } from '@/lib/api/parent';

/**
 * Client island for revoking either a single link or every link at a school.
 * Confirms via a lightweight inline modal before firing. On success calls
 * `router.refresh()` so the server-rendered settings page re-fetches the
 * children list (the just-revoked link disappears from the matrix).
 *
 * Discriminated `kind` so a single button component handles both backend
 * routes — keeps the settings page composition simple.
 */
type Props =
  | {
      kind: 'link';
      linkId: number;
      childName: string;
      schoolName: string;
      variant?: 'primary' | 'secondary';
      size?: 'sm' | 'md';
    }
  | {
      kind: 'school';
      schoolCode: string;
      schoolName: string;
      variant?: 'primary' | 'secondary';
      size?: 'sm' | 'md';
    };

export function RevokeButton(props: Props) {
  const router = useRouter();
  const t = useTranslations('parent');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const result =
        props.kind === 'link'
          ? await revokeParentLink(props.linkId)
          : await revokeSchoolAccess({ school_code: props.schoolCode });
      if (result.status === 'queued') {
        // Offline path — close the dialog and let the user know via refresh.
        setConfirming(false);
        startTransition(() => router.refresh());
        return;
      }
      setConfirming(false);
      startTransition(() => router.refresh());
    } catch {
      setError(t('settings.revokeError'));
    } finally {
      setSubmitting(false);
    }
  }

  const label = props.kind === 'link' ? t('settings.revokeLink') : t('settings.revokeSchool');
  const detail =
    props.kind === 'link'
      ? t('settings.confirmRevokeLink', {
          child: props.childName,
          school: props.schoolName,
        })
      : t('settings.confirmRevokeSchool', { school: props.schoolName });

  return (
    <>
      <StButton
        type="button"
        variant={props.variant ?? 'secondary'}
        size={props.size ?? 'sm'}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        {label}
      </StButton>
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('settings.confirmRevoke')}
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
              {t('settings.confirmRevoke')}
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
              {detail}
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
                {t('settings.cancel')}
              </StButton>
              <StButton
                type="button"
                variant="primary"
                size="md"
                onClick={onConfirm}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? t('settings.revoking') : t('settings.revokeConfirmCta')}
              </StButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
