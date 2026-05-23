'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { StButton, StCard, StChip, StIcon } from '@/components/st';
import type { PracticeProblem } from '@/lib/api/ai-tutor';

interface Props {
  problems: PracticeProblem[];
}

export function PracticePair({ problems }: Props) {
  const t = useTranslations('student.tutor');
  if (problems.length === 0) return null;
  return (
    <section className="px-4 py-3" data-testid="tutor-practice">
      <div className="mb-2 flex items-center gap-2">
        <StChip tone="moss">
          <StIcon name="target" size={11} />
          {t('practiceLabel')}
        </StChip>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {problems.map((p) => (
          <PracticeCard key={p.problem_id} problem={p} />
        ))}
      </div>
    </section>
  );
}

function PracticeCard({ problem }: { problem: PracticeProblem }) {
  const t = useTranslations('student.tutor');
  const [revealed, setRevealed] = useState(false);
  return (
    <StCard padding="md">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        {problem.strand} · {problem.difficulty}/5
      </p>
      <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
        {problem.prompt}
      </p>
      {revealed ? (
        <p
          className="mt-3 rounded-st-sm p-2 text-sm"
          style={{ background: 'var(--st-paper-2)', color: 'var(--st-ink-2)' }}
        >
          {problem.answer_key}
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <StButton
          type="button"
          variant="brass"
          size="sm"
          onClick={() => setRevealed((v) => !v)}
          data-testid={`practice-reveal-${problem.problem_id}`}
        >
          <StIcon name={revealed ? 'eye' : 'eye'} size={12} />
          {revealed ? t('practiceHideAnswer') : t('practiceShowAnswer')}
        </StButton>
        <StButton type="button" variant="ghost" size="sm">
          {t('practiceContinue')}
        </StButton>
      </div>
    </StCard>
  );
}
