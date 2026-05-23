import { getTranslations } from 'next-intl/server';
import type { MockTrajectoryPoint } from '@studyteach/contracts';

import { StCard, StDivider } from '@/components/st';

/**
 * Recent mock-test results — simple server-rendered list (no chart yet).
 * Latest first. PRD §4.8 calls for a trajectory sparkline but the brief
 * defers that to a follow-up so the page can ship in P1.
 */
export async function MockTrajectoryList({ items }: { items: MockTrajectoryPoint[] }) {
  const t = await getTranslations('parent');

  if (items.length === 0) {
    return (
      <section aria-labelledby="parent-mocks-heading">
        <Heading id="parent-mocks-heading">{t('summary.mocksTitle')}</Heading>
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
            {t('summary.noMocks')}
          </p>
        </StCard>
      </section>
    );
  }

  const sorted = [...items].sort(
    (a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime(),
  );

  return (
    <section aria-labelledby="parent-mocks-heading">
      <Heading id="parent-mocks-heading">{t('summary.mocksTitle')}</Heading>
      <StCard padding="tight">
        <ul className="flex flex-col">
          {sorted.map((m, i) => (
            <li key={`${m.test_date}-${m.subject}-${i}`}>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p
                    className="truncate text-[13px] font-semibold"
                    style={{ color: 'var(--st-soot)' }}
                  >
                    {m.subject}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                    {formatDate(m.test_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="font-display text-[18px] font-bold"
                    style={{ color: 'var(--st-ember)' }}
                  >
                    {m.score}
                    <span className="text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                      {' '}
                      / 100
                    </span>
                  </p>
                </div>
              </div>
              {i < sorted.length - 1 && <StDivider />}
            </li>
          ))}
        </ul>
      </StCard>
    </section>
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
