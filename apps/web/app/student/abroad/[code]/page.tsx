import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StudyAbroadDestinationCode, type DestinationDetail } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StLinkButton } from '@/components/st';
import { BlueprintSections } from '@/components/student/abroad/BlueprintSections';
import { getDestinationServer } from '@/lib/api/study-abroad';

/**
 * Destination blueprint page (PRD §4.10a). Server component: validates the
 * `code` against the closed enum before hitting the API so a typo'd URL
 * 404s cleanly instead of round-tripping. The five blueprint sections
 * render as a vertical stack (no JS tabs — keeps server-only + cheap on 3G).
 */
export const dynamic = 'force-dynamic';

export default async function StudentDestinationDetail({ params }: { params: { code: string } }) {
  const parsed = StudyAbroadDestinationCode.safeParse(params.code.toUpperCase());
  if (!parsed.success) notFound();

  const t = await getTranslations('student.abroad');
  const cookieHeader = cookies().toString();

  let detail: DestinationDetail | null = null;
  let loadError = false;
  try {
    detail = await getDestinationServer(parsed.data, cookieHeader);
  } catch {
    loadError = true;
  }

  if (loadError || !detail) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="md">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6"
      data-testid="student-abroad-detail"
    >
      <StCard padding="lg">
        <div className="flex items-center gap-2">
          <StChip tone="brass">{detail.destination.destination_code}</StChip>
          <span
            className="text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: 'var(--st-ink-3)' }}
          >
            {t('country')}
          </span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {detail.destination.name_mn}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {detail.destination.primary_pathway_mn}
        </p>
      </StCard>

      <section className="mt-4">
        <BlueprintSections blueprints={detail.blueprints} />
      </section>

      <div className="mt-5">
        <StLinkButton href="/student/abroad" variant="secondary" size="md">
          <StIcon name="arrow_l" size={14} />
          {t('backToDestinations')}
        </StLinkButton>
      </div>
    </main>
  );
}
