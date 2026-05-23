'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { StButton, StIcon } from '@/components/st';
import { SuccessStamp } from '@/components/system/SuccessStamp';
import { useToast } from '@/components/system/ToastProvider';
import { watchScholarship } from '@/lib/api/study-abroad';

type Status = 'idle' | 'submitting' | 'done' | 'queued' | 'error';

/**
 * Subscribe to deadline reminders for a scholarship. Client component —
 * touches the offline-aware `watchScholarship` mutation in
 * `lib/api/study-abroad.ts`, mirroring the `enrollInCourse` pattern from
 * teacher-academy.
 *
 * Result UI is explicit:
 *   - `done`   → "we'll notify you" notice
 *   - `queued` → the request is sitting in IndexedDB, will replay on
 *     reconnect (CLAUDE.md hard constraint #5 — never silently drop a write)
 *   - `error`  → server returned 4xx/5xx; surface a retry hint
 */
export function WatchButton({ scholarshipId }: { scholarshipId: number }) {
  const t = useTranslations('student.abroad');
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<Status>('idle');
  const [, startTransition] = useTransition();

  async function onClick() {
    if (status === 'submitting') return;
    setStatus('submitting');
    try {
      const result = await watchScholarship(scholarshipId);
      if (result.status === 'queued') {
        setStatus('queued');
        toast.push({ variant: 'info', text: t('scholarship.watchQueued') });
      } else {
        setStatus('done');
        toast.push({ variant: 'success', text: t('scholarship.watchedNotice') });
        // Refresh in case any server-rendered surface starts to show the
        // watch state in a follow-up iteration.
        startTransition(() => router.refresh());
      }
    } catch {
      setStatus('error');
    }
  }

  const disabled = status === 'submitting' || status === 'done' || status === 'queued';

  return (
    <div className="flex flex-col gap-2">
      <StButton type="button" variant="primary" size="md" onClick={onClick} disabled={disabled}>
        <StIcon name="bell" size={14} />
        {status === 'submitting' ? t('scholarship.watchPending') : t('scholarship.watchCta')}
      </StButton>
      {status === 'done' && (
        <div className="flex items-center gap-2">
          <SuccessStamp size={24} />
          <p className="text-[12px]" style={{ color: 'var(--st-moss)' }}>
            {t('scholarship.watchedNotice')}
          </p>
        </div>
      )}
      {status === 'queued' && (
        <p className="text-[12px]" style={{ color: 'var(--st-brass-dark)' }}>
          {t('scholarship.watchQueued')}
        </p>
      )}
      {status === 'error' && (
        <p className="text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
          {t('scholarship.watchError')}
        </p>
      )}
    </div>
  );
}
