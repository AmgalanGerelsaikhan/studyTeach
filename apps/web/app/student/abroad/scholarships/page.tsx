import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import {
  ScholarshipFundingType,
  ScholarshipLevel,
  StudyAbroadDestinationCode,
  type Scholarship,
} from '@studyteach/contracts';

import { StCard, StIcon, StLinkButton } from '@/components/st';
import { ScholarshipCard } from '@/components/student/abroad/ScholarshipCard';
import { ScholarshipFilters } from '@/components/student/abroad/ScholarshipFilters';
import { listScholarshipsServer, type ScholarshipFilter } from '@/lib/api/study-abroad';

/**
 * Scholarship aggregator (PRD §4.10b). Server component: filters are read
 * from URL search params, validated against the closed enums in
 * `packages/contracts/src/study-abroad.ts`, and the list is rendered on
 * the server. The only client-side JS is the `ScholarshipFilters` island,
 * which updates the URL and lets the server re-render the grid.
 */
export const dynamic = 'force-dynamic';

const ALLOWED_DEADLINE_WINDOWS = new Set([30, 90, 180]);

function readFilter(
  searchParams: Record<string, string | string[] | undefined>,
): ScholarshipFilter {
  const filter: ScholarshipFilter = {};

  const destination = readString(searchParams.destination_code);
  if (destination) {
    const parsed = StudyAbroadDestinationCode.safeParse(destination);
    if (parsed.success) filter.destination_code = parsed.data;
  }

  const level = readString(searchParams.level);
  if (level) {
    const parsed = ScholarshipLevel.safeParse(level);
    if (parsed.success) filter.level = parsed.data;
  }

  const funding = readString(searchParams.funding_type);
  if (funding) {
    const parsed = ScholarshipFundingType.safeParse(funding);
    if (parsed.success) filter.funding_type = parsed.data;
  }

  const deadline = readString(searchParams.deadline_within_days);
  if (deadline) {
    const n = Number(deadline);
    if (Number.isInteger(n) && ALLOWED_DEADLINE_WINDOWS.has(n)) {
      filter.deadline_within_days = n;
    }
  }

  return filter;
}

function readString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default async function StudentScholarshipsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations('student.abroad');
  const cookieHeader = cookies().toString();
  const filter = readFilter(searchParams);

  let items: Scholarship[] = [];
  let loadError = false;
  try {
    const res = await listScholarshipsServer(cookieHeader, filter);
    items = res.items;
  } catch {
    loadError = true;
  }

  return (
    <main
      className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6"
      data-testid="student-abroad-scholarships"
    >
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('scholarshipsHeading')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('scholarshipsSubtitle')}
        </p>
      </StCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside>
          <ScholarshipFilters />
        </aside>

        <section className="min-w-0">
          {loadError ? (
            <StCard padding="md">
              <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
                {t('loadError')}
              </p>
            </StCard>
          ) : items.length === 0 ? (
            <StCard padding="md">
              <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
                {t('scholarship.empty')}
              </p>
            </StCard>
          ) : (
            <>
              <p className="mb-3 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                {t('scholarship.resultCount', { n: items.length })}
              </p>
              <ul
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="student-abroad-scholarship-grid"
              >
                {items.map((scholarship) => (
                  <li key={scholarship.scholarship_id} className="min-w-0">
                    <ScholarshipCard scholarship={scholarship} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <div className="mt-5">
        <StLinkButton href="/student/abroad" variant="secondary" size="md">
          <StIcon name="arrow_l" size={14} />
          {t('backToDestinations')}
        </StLinkButton>
      </div>
    </main>
  );
}
