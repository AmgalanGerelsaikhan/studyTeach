import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { CourseListResponse } from '@studyteach/contracts';

import { StButton, StCard } from '@/components/st';

import { AcademyFilters } from './AcademyFilters';
import { CourseCard } from './CourseCard';

/**
 * Academy catalog — server component. Takes the already-fetched
 * `CourseListResponse` and renders the filter island + a server-rendered
 * grid of `CourseCard`s. Pagination is cursor-based via the URL so "load
 * more" keeps the cards on the server (3G budget — no client list state).
 */
export async function CourseCatalog({
  data,
  searchParams,
  error,
}: {
  data: CourseListResponse | null;
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
          <AcademyFilters />
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
                  <Link href={withCursor(data.next_cursor)}>
                    <StButton type="button" variant="secondary" size="sm">
                      {t('loadMore')}
                    </StButton>
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
