import { getTranslations } from 'next-intl/server';
import type { Destination } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StLinkButton } from '@/components/st';

/**
 * One destination tile on the Study Abroad hub grid. Server component —
 * pure render off a `Destination` contract object, no interactivity. The
 * country code is rendered as a brass chip (proper-noun two-letter code,
 * not localized), the destination name is the Cyrillic heading, and the
 * `primary_pathway_mn` body is the one-line pitch.
 */
export async function DestinationCard({ destination }: { destination: Destination }) {
  const t = await getTranslations('student.abroad');

  return (
    <StCard padding="md" className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <StChip tone="brass">{destination.destination_code}</StChip>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          {t('country')}
        </span>
      </div>

      <h2 className="mt-2 font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
        {destination.name_mn}
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
        {destination.primary_pathway_mn}
      </p>

      <div className="mt-auto pt-3">
        <StLinkButton
          href={`/student/abroad/${destination.destination_code}`}
          variant="secondary"
          size="sm"
        >
          {t('viewDestination')}
          <StIcon name="chevron_r" size={12} />
        </StLinkButton>
      </div>
    </StCard>
  );
}
