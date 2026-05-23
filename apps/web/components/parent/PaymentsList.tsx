import { getTranslations } from 'next-intl/server';
import type { PaymentRecord } from '@studyteach/contracts';

import { StCard, StChip } from '@/components/st';

/**
 * Server-rendered payments table for the active child. Mobile-first: rows
 * stack on narrow viewports and use a 3-column grid from sm and up.
 */
export async function PaymentsList({ items }: { items: PaymentRecord[] }) {
  const t = await getTranslations('parent');

  if (items.length === 0) {
    return (
      <section aria-labelledby="parent-payments-heading">
        <Heading id="parent-payments-heading">{t('summary.paymentsTitle')}</Heading>
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
            {t('summary.noPayments')}
          </p>
        </StCard>
      </section>
    );
  }

  return (
    <section aria-labelledby="parent-payments-heading">
      <Heading id="parent-payments-heading">{t('summary.paymentsTitle')}</Heading>
      <StCard padding="tight">
        <ul className="flex flex-col divide-y" style={{ borderColor: 'rgba(185,132,56,0.2)' }}>
          {items.map((p) => (
            <li key={p.invoice_id} className="py-3 first:pt-1 last:pb-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[13px] font-semibold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {p.description ?? t('summary.paymentNoDescription')}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                    {formatDate(p.created_at)} · #{p.invoice_id}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p
                    className="font-display text-[14px] font-bold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {formatTugrik(p.amount)}
                  </p>
                  <StatusChip status={p.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </StCard>
    </section>
  );
}

async function StatusChip({ status }: { status: string }) {
  const t = await getTranslations('parent');
  const upper = status.toUpperCase();
  const tone =
    upper === 'PAID'
      ? 'moss'
      : upper === 'PENDING'
        ? 'brass'
        : upper === 'FAILED'
          ? 'ember'
          : 'default';
  const labelKey: 'paid' | 'pending' | 'failed' | 'other' =
    upper === 'PAID'
      ? 'paid'
      : upper === 'PENDING'
        ? 'pending'
        : upper === 'FAILED'
          ? 'failed'
          : 'other';
  return (
    <StChip tone={tone}>
      {labelKey === 'other' ? status : t(`summary.paymentStatus.${labelKey}`)}
    </StChip>
  );
}

function Heading({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2
      id={id}
      className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color: 'var(--st-brass-dark)' }}
    >
      {children}
    </h2>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function formatTugrik(amount: number): string {
  // Mongolian convention: thousands separated by comma + ₮ suffix.
  const rounded = Math.round(amount);
  const withCommas = rounded.toLocaleString('en-US');
  return `${withCommas} ₮`;
}
