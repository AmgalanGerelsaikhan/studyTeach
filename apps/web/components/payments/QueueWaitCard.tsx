'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { QueuePositionResponse } from '@studyteach/contracts';

import { StCard, StChip } from '@/components/st';
import { getQueuePosition } from '@/lib/api/surge';

interface Props {
  token: string;
  /** Called once the queue resolves with the real invoice id. */
  onFulfilled?: (invoiceId: number) => void;
}

const POLL_INTERVAL_MS = 5000;

/**
 * Surge-mode queue display. Polls /queue-position/:token every 5s; when the
 * response flips to fulfilled, calls onFulfilled with the invoice_id so the
 * parent flow can switch back to PaymentFlow.
 */
export function QueueWaitCard({ token, onFulfilled }: Props) {
  const t = useTranslations('student.payments');
  const [state, setState] = useState<QueuePositionResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await getQueuePosition(token);
        if (cancelled) return;
        setState(r);
        if (r.fulfilled) {
          onFulfilled?.(r.invoice_id);
          return; // stop polling
        }
        setTimeout(tick, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setTimeout(tick, POLL_INTERVAL_MS * 2);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [token, onFulfilled]);

  if (!state) {
    return (
      <StCard padding="md">
        <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('polling')}
        </p>
      </StCard>
    );
  }

  if (state.fulfilled) {
    return (
      <StCard padding="md" data-testid="queue-wait-fulfilled">
        <StChip tone="moss">{t('surgeFulfilled')}</StChip>
      </StCard>
    );
  }

  return (
    <StCard padding="md" data-testid="queue-wait">
      <header className="flex items-center justify-between">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('surgeTitle')}
        </p>
        <StChip tone="ember">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: 'var(--st-ember)' }}
          />
          {t('pending')}
        </StChip>
      </header>
      <p
        className="mt-2 font-display text-2xl font-bold"
        style={{ color: 'var(--st-soot)' }}
        data-testid="queue-position"
      >
        {t('surgePosition', { pos: state.position })}
      </p>
      <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
        {t('surgeEta', { n: state.eta_seconds })}
      </p>
      <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--st-ink-3)' }}>
        {t('surgeReassure')}
      </p>
    </StCard>
  );
}
