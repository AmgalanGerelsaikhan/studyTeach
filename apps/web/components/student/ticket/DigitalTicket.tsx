'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TicketResponse } from '@studyteach/contracts';

import { StCard, StChip } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import { getTicket } from '@/lib/api/payments';

interface Props {
  registrationId: number;
}

/**
 * Mirrors `studyTeach (2)/student2.jsx:256 → DigitalTicket`.
 *
 * Two paths to render:
 *   1. Online: fetch /api/registrations/:id/ticket; SW caches it cache-first
 *      per the SW v3 swap, so the next load also works offline.
 *   2. Offline (cold load): SW returns the cached payload; the page renders
 *      identically. If neither is available, show the load-error empty state.
 *
 * The JWS is rendered in a foldable details section so a venue scanner can
 * verify the signature offline against the embedded JWK (R-5/R-6/R-7).
 */
export function DigitalTicket({ registrationId }: Props) {
  const t = useTranslations('student.ticket');
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notSignedYet, setNotSignedYet] = useState(false);

  useEffect(() => {
    setError(null);
    setNotSignedYet(false);
    getTicket(registrationId)
      .then(setTicket)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setNotSignedYet(true);
        } else {
          setError(e instanceof Error ? e.message : 'unknown');
        }
      });
  }, [registrationId]);

  if (notSignedYet) {
    return (
      <main className="mx-auto max-w-md px-4 py-8" data-testid="ticket-pending">
        <StCard padding="lg">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('title')}
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('notSignedYet')}
          </p>
        </StCard>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="mx-auto max-w-md px-4 py-8" data-testid="ticket-error">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {error ?? t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  return (
    <main
      className="mx-auto min-h-screen max-w-md px-3 py-4 sm:px-4 sm:py-6"
      style={{ background: 'var(--st-felt)' }}
      data-testid="digital-ticket"
    >
      <header className="mb-4 flex items-center justify-between">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('title')}
        </p>
        <StChip tone="moss">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: '#5C6B3B' }}
          />
          {t('offlineReady')}
        </StChip>
      </header>

      <article
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: 'rgba(185, 132, 56, 0.5)',
          background: 'var(--st-paper)',
          boxShadow: 'var(--st-shadow-lg)',
        }}
      >
        {/* Ember venue strip */}
        <div
          className="relative px-5 py-4"
          style={{
            background: 'linear-gradient(180deg, var(--st-ember) 0%, var(--st-ember-deep) 100%)',
            color: '#FBF3E2',
          }}
        >
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: '#F4C99A' }}
          >
            #{ticket.registration_id}
          </p>
          <h1
            className="mt-1 font-display text-lg font-bold leading-tight"
            style={{ color: '#FBF3E2' }}
          >
            MozaTeach · {t('title')}
          </h1>
        </div>

        {/* perforation */}
        <Perforation />

        {/* body */}
        <div className="px-5 py-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('subtitleEyebrow')}
          </p>
          <p className="mt-1 font-mono text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {ticket.payload.student_name_hash.slice(0, 16)}…
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Row label={t('rowDate')} value={formatDate(ticket.payload.exam_time_iso)} />
            <Row
              label={t('rowReg')}
              value={`#${ticket.registration_id}`}
              sub={t('verifyKid') + ': ' + ticket.public_key_jwk.kid}
            />
            <Row label={t('rowVenue')} value={ticket.payload.venue ?? '—'} />
            <Row label={t('rowSeat')} value={ticket.payload.seat ?? '—'} />
          </div>

          {/* QR */}
          <div
            className="mt-5 flex items-center gap-4 rounded-2xl border p-4"
            style={{
              background: 'linear-gradient(180deg, #FBF3E2 0%, #EFE0BF 100%)',
              borderColor: 'var(--st-brass)',
            }}
          >
            <img
              src={`data:image/png;base64,${ticket.qr_png_b64}`}
              alt="ticket QR"
              className="h-32 w-32"
              data-testid="ticket-qr"
            />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--st-ink-2)' }}>
              {t('qrCaption')}
            </p>
          </div>

          <details className="mt-4">
            <summary
              className="cursor-pointer text-[11px] font-semibold"
              style={{ color: 'var(--st-brass-dark)' }}
            >
              {t('verifyDetails')}
            </summary>
            <div className="mt-2 grid gap-1 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
              <p>
                <span className="font-mono">{t('verifyKid')}:</span> {ticket.public_key_jwk.kid}
              </p>
              <p>
                <span className="font-mono">{t('verifyAlg')}:</span> {ticket.public_key_jwk.alg}
              </p>
              <p className="break-all font-mono">
                <span className="not-italic">{t('verifyJws')}:</span> {ticket.jws.slice(0, 64)}…
              </p>
            </div>
          </details>
        </div>
      </article>
    </main>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[9.5px] tracking-[0.12em]" style={{ color: 'var(--st-brass-dark)' }}>
        {label}
      </p>
      <p className="mt-0.5 font-display text-sm font-bold" style={{ color: 'var(--st-soot)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Perforation() {
  return (
    <div className="relative h-5" style={{ background: 'var(--st-paper)' }}>
      <div
        aria-hidden
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed"
        style={{ borderColor: 'rgba(185, 132, 56, 0.6)' }}
      />
      <div
        aria-hidden
        className="absolute -left-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
        style={{
          background: 'var(--st-felt)',
          boxShadow: 'inset -2px 0 4px rgba(42,24,16,0.15)',
        }}
      />
      <div
        aria-hidden
        className="absolute -right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
        style={{
          background: 'var(--st-felt)',
          boxShadow: 'inset 2px 0 4px rgba(42,24,16,0.15)',
        }}
      />
    </div>
  );
}

function CornerBracket({ position }: { position: 'tl' | 'tr' }) {
  const isLeft = position === 'tl';
  return (
    <svg
      aria-hidden
      className="absolute h-5 w-5"
      style={{
        top: 8,
        left: isLeft ? 8 : undefined,
        right: isLeft ? undefined : 8,
        transform: isLeft ? undefined : 'scaleX(-1)',
      }}
      viewBox="0 0 20 20"
      fill="none"
      stroke="#F4C99A"
      strokeWidth="1.5"
    >
      <path d="M2 8 L2 2 L8 2" />
    </svg>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}
