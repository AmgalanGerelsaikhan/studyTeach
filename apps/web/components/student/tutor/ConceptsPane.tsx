'use client';

import { useTranslations } from 'next-intl';

import { StCard, StProgress } from '@/components/st';
import type { MasteryRow } from '@/lib/api/ai-tutor';

interface Props {
  mastery: MasteryRow[];
}

/**
 * Right-rail concept panel. Renders one progress bar per concept_mastery row
 * the student has accumulated, ordered by p_mastered desc so the strongest
 * strands sit at the top. Empty state when no rows.
 */
export function ConceptsPane({ mastery }: Props) {
  const t = useTranslations('student.tutor');
  return (
    <aside className="hidden lg:block">
      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('conceptsTitle')}
        </p>
        {mastery.length === 0 ? (
          <p className="mt-3 text-xs" style={{ color: 'var(--st-ink-3)' }}>
            {t('conceptsEmpty')}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3" data-testid="concepts-list">
            {mastery.map((row) => (
              <li key={row.curriculum_strand}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--st-soot)' }}>
                    {row.curriculum_strand}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--st-ink-3)' }}>
                    {Math.round(row.p_mastered * 100)}%
                  </span>
                </div>
                <div className="mt-1">
                  <StProgress value={row.p_mastered * 100} height={6} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </StCard>
    </aside>
  );
}
