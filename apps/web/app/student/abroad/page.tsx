import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { Destination } from '@studyteach/contracts';

import { StCard, StIcon, StLinkButton } from '@/components/st';
import { DestinationCard } from '@/components/student/abroad/DestinationCard';
import { listDestinationsServer } from '@/lib/api/study-abroad';

/**
 * Study Abroad hub (PRD §4.10a — Destination Blueprints). Server component:
 * fetches the eight seeded destinations on the Node server with the
 * HttpOnly session cookie forwarded explicitly (CLAUDE.md constraint #8).
 * No client-side list state — every card is rendered on the server so the
 * page stays cheap on a 3G link (hard constraint #3).
 */
export const dynamic = 'force-dynamic';

export default async function StudentAbroadHome() {
  const t = await getTranslations('student.abroad');
  const cookieHeader = cookies().toString();

  let destinations: Destination[] = [];
  let loadError = false;
  try {
    const res = await listDestinationsServer(cookieHeader);
    destinations = res.items;
  } catch {
    loadError = true;
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6" data-testid="student-abroad-home">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>
      </StCard>

      <section className="mt-4">
        {loadError ? (
          <StCard padding="md">
            <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
              {t('loadError')}
            </p>
          </StCard>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" data-testid="student-abroad-destination-grid">
            {destinations.map((destination) => (
              <li key={destination.destination_code} className="min-w-0">
                <DestinationCard destination={destination} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 flex justify-end">
        <StLinkButton href="/student/abroad/scholarships" variant="brass" size="md">
          {t('scholarshipsCta')}
          <StIcon name="arrow_r" size={14} />
        </StLinkButton>
      </div>
    </main>
  );
}
