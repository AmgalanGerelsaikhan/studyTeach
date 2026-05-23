import { getTranslations } from 'next-intl/server';
import type { DestinationBlueprint, StudyAbroadBlueprintSection } from '@studyteach/contracts';

import { StCard, StDivider } from '@/components/st';

const SECTION_ORDER: StudyAbroadBlueprintSection[] = [
  'CORE_CONCEPT',
  'CORE_REQUIREMENTS',
  'FINANCIAL_PATHWAY',
  'APPLICATION_TIMELINE',
  'COMMON_PITFALLS',
];

/**
 * Vertical stack of the 5 blueprint sections for one destination. Server
 * component — no JS tabs (3G budget). Sections render in the canonical
 * order regardless of insertion order in the seed; each is separated by a
 * brass-gradient divider matching the rest of the Ger Interior surface.
 */
export async function BlueprintSections({ blueprints }: { blueprints: DestinationBlueprint[] }) {
  const t = await getTranslations('student.abroad');

  const bySection = new Map<StudyAbroadBlueprintSection, DestinationBlueprint>();
  for (const b of blueprints) bySection.set(b.section, b);
  const ordered = SECTION_ORDER.map((s) => bySection.get(s)).filter(
    (b): b is DestinationBlueprint => Boolean(b),
  );

  return (
    <StCard padding="lg">
      <ol className="flex flex-col gap-5">
        {ordered.map((blueprint, idx) => (
          <li key={blueprint.blueprint_id}>
            {idx > 0 && (
              <div className="-mt-2 mb-4">
                <StDivider />
              </div>
            )}
            <h2 className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
              {t(`section.${blueprint.section}`)}
            </h2>
            <p
              className="mt-2 whitespace-pre-line text-sm leading-relaxed"
              style={{ color: 'var(--st-ink)' }}
            >
              {blueprint.body_mn}
            </p>
          </li>
        ))}
      </ol>
    </StCard>
  );
}
