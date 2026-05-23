import { getTranslations } from 'next-intl/server';
import type { UpcomingOlympiad } from '@studyteach/contracts';

import { StCard, StChip } from '@/components/st';

/**
 * Server-rendered list of upcoming olympiads. Countdown ("23 хоног") is
 * computed on the server from `exam_date` so the page is fully static on
 * arrival — no client hydration just to print a number of days.
 *
 * Mirrors the ember "удахгүй" hero card from the family.jsx prototype.
 */
export async function UpcomingOlympiads({ items }: { items: UpcomingOlympiad[] }) {
  const t = await getTranslations('parent');

  if (items.length === 0) {
    return (
      <section aria-labelledby="parent-upcoming-heading">
        <Heading id="parent-upcoming-heading">{t('summary.upcomingTitle')}</Heading>
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
            {t('summary.noUpcoming')}
          </p>
        </StCard>
      </section>
    );
  }

  return (
    <section aria-labelledby="parent-upcoming-heading">
      <Heading id="parent-upcoming-heading">{t('summary.upcomingTitle')}</Heading>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const days = daysUntil(item.exam_date);
          const examDate = formatDate(item.exam_date);
          return (
            <li key={item.olympiad_id}>
              <StCard variant="ember" padding="md" className="relative overflow-hidden">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: '#F4C99A' }}
                >
                  {days >= 0
                    ? t('summary.daysAway', { n: days })
                    : t('summary.daysPast', { n: Math.abs(days) })}
                </p>
                <p
                  className="mt-1 font-display text-[15px] font-bold leading-tight"
                  style={{ color: '#FBF3E2' }}
                >
                  {item.title}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px]">
                  <Meta label={t('summary.examDateLabel')} value={examDate} />
                  <StatusChip status={item.registration_status} />
                </div>
              </StCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9.5px] tracking-[0.1em]" style={{ color: '#F4C99A' }}>
        {label}
      </p>
      <p className="mt-0.5 font-semibold leading-tight" style={{ color: '#FBF3E2' }}>
        {value}
      </p>
    </div>
  );
}

async function StatusChip({ status }: { status: UpcomingOlympiad['registration_status'] }) {
  const t = await getTranslations('parent');
  const map = {
    REGISTERED: { tone: 'brass' as const, label: t('summary.statusRegistered') },
    PAID: { tone: 'moss' as const, label: t('summary.statusPaid') },
    PENDING_PAYMENT: { tone: 'ember' as const, label: t('summary.statusPending') },
    CANCELLED: { tone: 'default' as const, label: t('summary.statusCancelled') },
  };
  const { tone, label } = map[status];
  return <StChip tone={tone}>{label}</StChip>;
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

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} · ${hh}:${mi}`;
}
