'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { InvoiceDescriptor } from '@studyteach/contracts';

import { StButton, StCard, StChip, StIcon, StLinkButton } from '@/components/st';
import { getInvoice } from '@/lib/api/payments';

interface Props {
  invoiceId: number;
  /** First registration ID, used to deep-link the "View ticket" CTA once PAID. */
  primaryRegistrationId?: number;
}

const POLL_INTERVAL_MS = 4000;

/**
 * Payment flow card. Shows invoice total + QPay CTA → polls invoice status
 * every 4s until PAID. On PAID: E-Barimt PDF link + ticket CTA appear.
 *
 * QPay in dev returns null qpay_redirect_url (mock vendor). The card shows
 * a small notice that this is a mock environment. In prod the CTA opens
 * the QPay deep link in a new tab.
 */
export function PaymentFlow({ invoiceId, primaryRegistrationId }: Props) {
  const t = useTranslations('student.payments');
  const [invoice, setInvoice] = useState<InvoiceDescriptor | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const inv = await getInvoice(invoiceId);
        if (cancelled) return;
        setInvoice(inv);
        if (inv.payment_status === 'PAID') return; // stop polling
        setTimeout(tick, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) setTimeout(tick, POLL_INTERVAL_MS * 2);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  if (!invoice) {
    return (
      <StCard padding="md">
        <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('polling')}
        </p>
      </StCard>
    );
  }

  const paid = invoice.payment_status === 'PAID';

  return (
    <StCard padding="md" data-testid="payment-flow">
      <header className="flex items-center justify-between">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('title')}
        </p>
        <StChip tone={paid ? 'moss' : 'ember'}>{paid ? t('paid') : t('pending')}</StChip>
      </header>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
          {t('totalLabel')}
        </span>
        <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
          {invoice.total_mnt.toLocaleString()} ₮
        </span>
      </div>

      {!paid && (
        <>
          {invoice.qpay_redirect_url ? (
            <a href={invoice.qpay_redirect_url} target="_blank" rel="noopener noreferrer">
              <StButton type="button" variant="primary" size="md" className="mt-3 w-full">
                <StIcon name="cash" size={14} />
                {t('qpayCta')}
              </StButton>
            </a>
          ) : (
            <p
              className="mt-3 text-[11px]"
              style={{ color: 'var(--st-ink-3)' }}
              data-testid="payment-mock-notice"
            >
              {t('mockNotice')}
            </p>
          )}
          <p className="mt-2 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
            {t('polling')}
          </p>
        </>
      )}

      {paid && (
        <div className="mt-3 flex flex-wrap gap-2">
          {invoice.ebarimt_pdf_url && (
            <a href={invoice.ebarimt_pdf_url} target="_blank" rel="noopener noreferrer">
              <StButton type="button" variant="secondary" size="sm">
                <StIcon name="download" size={12} />
                {t('pdfCta')}
              </StButton>
            </a>
          )}
          {primaryRegistrationId && (
            <StLinkButton
              href={`/student/ticket/${primaryRegistrationId}`}
              variant="brass"
              size="sm"
            >
              <StIcon name="ticket" size={12} />
              {t('openTicket')}
            </StLinkButton>
          )}
        </div>
      )}
    </StCard>
  );
}
