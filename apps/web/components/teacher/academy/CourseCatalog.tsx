import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { AcademyFacets, CourseListResponse } from '@studyteach/contracts';

import { StCard } from '@/components/st';

import { AcademyFilters } from './AcademyFilters';
import { CourseCard } from './CourseCard';

/**
 * Academy catalog — server component. Takes the already-fetched
 * `CourseListResponse` and renders the filter island + a server-rendered
 * grid of `CourseCard`s. Pagination is cursor-based via the URL so "load
 * more" keeps the cards on the server (3G budget — no client list state).
 *
 * `facets` is the distinct-value set from the catalog so the filter dropdowns
 * always reflect what's actually in the corpus.
 */
export async function CourseCatalog({
  data,
  facets,
  searchParams,
  error,
}: {
  data: CourseListResponse | null;
  facets: AcademyFacets | null;
  searchParams: Record<string, string | string[] | undefined>;
  error?: boolean;
}) {
  const t = await getTranslations('teacher.academy');

  function withCursor(cursor: number): string {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') next.set(key, value);
      else if (Array.isArray(value)) for (const v of value) next.append(key, v);
    }
    next.set('cursor', String(cursor));
    return `/teacher/personal/academy?${next.toString()}`;
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6" data-testid="academy-catalog">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          P1 · CPD
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </StCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside>
          <AcademyFilters facets={facets} />
        </aside>

        <section className="min-w-0">
          {error ? (
            <StCard padding="md">
              <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
                {t('loadError')}
              </p>
            </StCard>
          ) : !data || data.items.length === 0 ? (
            <StCard padding="md">
              <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
                {t('empty')}
              </p>
            </StCard>
          ) : (
            <>
              <p className="mb-3 text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                {t('resultCount', { n: data.items.length })}
              </p>
              <ul
                className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                data-testid="academy-course-grid"
              >
                {data.items.map((course) => (
                  <li key={course.course_id} className="min-w-0">
                    {/* CourseCard is async — RSC composes it directly. */}
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
              {data.next_cursor !== null && (
                <div className="mt-4">
                  <Link
                    href={withCursor(data.next_cursor)}
                    className="inline-flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-st-sm border px-2.5 text-xs font-semibold transition-[transform,box-shadow,background] duration-100 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{
                      background: 'var(--st-paper)',
                      color: 'var(--st-ink)',
                      borderColor: 'rgba(185, 132, 56, 0.5)',
                      boxShadow: 'var(--st-shadow-sm)',
                    }}
                  >
                    {t('loadMore')}
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
