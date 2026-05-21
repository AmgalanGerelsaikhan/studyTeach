import { getTranslations } from 'next-intl/server';

import { ChildSelector } from '@/components/parent/ChildSelector';
import { SmsCalloutCard } from '@/components/parent/SmsCalloutCard';
import { TrajectoryCard } from '@/components/parent/TrajectoryCard';
import { UpcomingOlympiadCard } from '@/components/parent/UpcomingOlympiadCard';

/**
 * Parent portal home. Inside ParentChrome (390×844 phone bezel).
 *
 * Today renders illustrative data for the upcoming-olympiad and trajectory
 * cards — both will move to live endpoints in S05/P1:
 *   - upcoming-olympiad → /registrations × /olympiads (same join as student
 *     home) once a parent-scope endpoint exists in P1
 *   - trajectory → mock_test_results filtered for the focal child once
 *     parent access to PSR is wired in P1 (E-033)
 */
export default async function ParentHome() {
  const tHome = await getTranslations('parent.home');
  const tChild = await getTranslations('parent.child');
  return (
    <div className="flex flex-col gap-4" data-testid="parent-home">
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {tChild('myChildren')}
        </p>
        <h1 className="mt-1 font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
          {tHome('title')}
        </h1>
      </div>

      <ChildSelector
        label={tChild('selectLabel')}
        defaultId="ch-1"
        children={[
          { id: 'ch-1', name: 'Чимгээ', initial: 'Ч', grade: '10а' },
          { id: 'ch-2', name: 'Болор', initial: 'Б', grade: '7в' },
        ]}
      />

      <UpcomingOlympiadCard
        daysAway={23}
        title="XLI Улсын Математикийн Олимпиад"
        date="6.12 · 09:00"
        fee="15,000 ₮"
        venue="МУИС · 213"
        paid
      />

      <TrajectoryCard samples={[55, 58, 61, 65, 72, 78]} latestScore={680} monthDelta={22} />

      <SmsCalloutCard />
    </div>
  );
}
