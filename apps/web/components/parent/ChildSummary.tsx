import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { LinkedChild } from '@studyteach/contracts';

import { StCard, StChip, StIcon } from '@/components/st';
import { getChildSummaryServer } from '@/lib/api/parent';

import { MockTrajectoryList } from './MockTrajectoryList';
import { PaymentsList } from './PaymentsList';
import { UpcomingOlympiads } from './UpcomingOlympiads';

/**
 * Server component. Given the selected child, fetches `/parent/children/:id/summary`
 * forwarding the parent's HttpOnly cookie and renders upcoming-olympiad,
 * mock-trajectory, and payments sections, plus a boarding chip if relevant.
 *
 * Every fetch here writes an `audit_log` row server-side (see ParentService.
 * getChildSummary). That is intentional — every read of a child's data is
 * recorded so parents can audit who has looked at what (PRD §4.8).
 */
export async function ChildSummary({ child }: { child: LinkedChild }) {
  const t = await getTranslations('parent');
  const cookieHeader = cookies().toString();

  try {
    const summary = await getChildSummaryServer(child.student_id, cookieHeader);
    const tPsr = await getTranslations('parent.childPsr');
    return (
      <div className="flex flex-col gap-4" data-testid="parent-child-summary">
        <header className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            {summary.student_name}
          </h2>
          <div className="flex items-center gap-2">
            {summary.is_boarding && <StChip tone="sky">{t('summary.boardingChip')}</StChip>}
            <Link
              href={`/parent/children/${child.student_id}/psr`}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold"
              style={{ color: 'var(--st-soot)', borderColor: 'rgba(185, 132, 56, 0.5)' }}
            >
              <StIcon name="file" size={11} />
              {tPsr('openCta')}
            </Link>
          </div>
        </header>

        <UpcomingOlympiads items={summary.upcoming_olympiads} />
        <MockTrajectoryList items={summary.recent_mocks} />
        <PaymentsList items={summary.payments} />
      </div>
    );
  } catch {
    return (
      <StCard padding="md">
        <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
          {t('summary.loadError')}
        </p>
      </StCard>
    );
  }
}
