'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Assessment, Certification } from '@studyteach/contracts';

import { StButton, StCard, StChip, StIcon, StSoyomboFlame } from '@/components/st';
import { getAssessment } from '@/lib/api/teacher-academy';

import { StQuiz } from './StQuiz';

/**
 * FINAL-assessment surface for the course player (E-026).
 *
 * Lifecycle:
 *   1. Closed → renders the "Take final assessment" CTA. Disabled until every
 *      lesson is complete (PRD §4.5 — badge requires lessons + ≥75%).
 *   2. Opened → fetches the Assessment and renders it via StQuiz, the same
 *      component used for lesson quizzes.
 *   3. After submit, StQuiz reports per-question results inside itself; we
 *      additionally listen on the response's `certification` via onPassed +
 *      polling the latest score is not necessary because StQuiz wires the
 *      whole AssessmentSubmitResponse through its own state. We surface the
 *      badge once `certification` arrives on the parent via onCertified.
 *
 * Idempotency: re-opening after a passed badge shows the "already certified"
 * notice instead of the quiz form.
 */
export function FinalAssessmentCard({
  finalAssessmentId,
  lessonsCompleted,
  lessonsTotal,
  initialCertification,
}: {
  finalAssessmentId: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  initialCertification: Certification | null;
}) {
  const t = useTranslations('teacher.academy.final');
  const [opened, setOpened] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [certification, setCertification] = useState<Certification | null>(initialCertification);

  const allLessonsDone = lessonsTotal > 0 && lessonsCompleted >= lessonsTotal;
  const alreadyCertified = certification !== null;

  useEffect(() => {
    if (!opened || assessment !== null) return;
    let cancelled = false;
    setLoadError(false);
    getAssessment(finalAssessmentId)
      .then((a) => {
        if (!cancelled) setAssessment(a);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [opened, assessment, finalAssessmentId]);

  return (
    <StCard padding="md" data-testid="final-assessment-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('eyebrow')}
          </p>
          <h3
            className="mt-0.5 font-display text-base font-bold"
            style={{ color: 'var(--st-soot)' }}
          >
            {t('title')}
          </h3>
        </div>
        <div className="shrink-0 opacity-70">
          <StSoyomboFlame size={28} />
        </div>
      </div>

      {alreadyCertified ? (
        <BadgeIssuedNotice cert={certification!} />
      ) : !opened ? (
        <>
          {!allLessonsDone && (
            <p className="mt-2 text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('locked', { done: lessonsCompleted, total: lessonsTotal })}
            </p>
          )}
          <div className="mt-3">
            <StButton
              type="button"
              variant="primary"
              size="md"
              disabled={!allLessonsDone}
              onClick={() => setOpened(true)}
              data-testid="open-final-assessment"
            >
              {t('cta')}
            </StButton>
          </div>
        </>
      ) : loadError ? (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
          {t('openAssessment')}
        </p>
      ) : assessment === null ? (
        <p className="mt-2 text-xs" style={{ color: 'var(--st-ink-3)' }}>
          {t('openAssessment')}
        </p>
      ) : (
        <div className="mt-3">
          <StQuiz assessment={assessment} onCertified={(cert) => setCertification(cert)} />
        </div>
      )}
    </StCard>
  );
}

function BadgeIssuedNotice({ cert }: { cert: Certification }) {
  const t = useTranslations('teacher.academy.final');
  return (
    <div
      className="mt-3 rounded-st-md border p-3"
      style={{
        borderColor: 'rgba(92, 107, 59, 0.4)',
        background: 'rgba(92, 107, 59, 0.12)',
      }}
      data-testid="badge-issued"
    >
      <div className="flex items-center gap-2">
        <StChip tone="moss">
          <StIcon name="check" size={11} />
          {t('badgeIssued')}
        </StChip>
        <StChip tone="brass">{cert.score}%</StChip>
      </div>
      <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
        {t('badgeIssuedBody')}
      </p>
      <div className="mt-2">
        <Link
          href="/teacher/personal/academy/transcript"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('viewTranscript')}
          <StIcon name="chevron_r" size={12} />
        </Link>
      </div>
    </div>
  );
}
