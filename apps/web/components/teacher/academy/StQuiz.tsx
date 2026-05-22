'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Assessment, AssessmentSubmitResponse, QuestionResult } from '@studyteach/contracts';

import { StButton, StCard, StChip, StIcon } from '@/components/st';
import { submitAssessment } from '@/lib/api/teacher-academy';

/**
 * Reusable quiz engine. Generic over any `Assessment`:
 *  - MULTIPLE_CHOICE → radio group
 *  - SHORT_ANSWER    → textarea
 * Submits to POST /assessments/:id/submit and renders per-question
 * correctness from `AssessmentSubmitResponse.results`.
 *
 * E-026 (final-assessment grading + CPD badges) reuses this component as-is
 * for the course final — it must stay agnostic to `assessment.kind`. When
 * grading is deferred server-side (FINAL → E-026) `score`/`passed` come back
 * null and we show the deferred notice instead of a pass/fail badge.
 *
 * Offline-aware: a queued submit shows a "saved, will sync" notice rather
 * than crashing (OFFLINE_STRATEGY.md).
 */

type AnswerMap = Record<string, number | string>;

export function StQuiz({
  assessment,
  onPassed,
}: {
  assessment: Assessment;
  /** Fired once the assessment is submitted and graded as passed. */
  onPassed?: () => void;
}) {
  const t = useTranslations('teacher.academy.quiz');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentSubmitResponse | null>(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultById = useMemo(() => {
    const map = new Map<number, QuestionResult>();
    if (result) for (const r of result.results) map.set(r.question_id, r);
    return map;
  }, [result]);

  const allAnswered = useMemo(
    () =>
      assessment.questions.every((q) => {
        const a = answers[String(q.question_id)];
        if (q.kind === 'MULTIPLE_CHOICE') return typeof a === 'number';
        return typeof a === 'string' && a.trim().length > 0;
      }),
    [assessment.questions, answers],
  );

  const locked = result !== null || queued;

  async function handleSubmit() {
    if (!allAnswered || locked) {
      if (!allAnswered) setError(t('incompleteNotice'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await submitAssessment(assessment.assessment_id, answers);
      if (res.status === 'queued') {
        setQueued(true);
      } else {
        setResult(res.value);
        if (res.value.passed === true) onPassed?.();
      }
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetake() {
    setAnswers({});
    setResult(null);
    setQueued(false);
    setError(null);
  }

  return (
    <StCard padding="md" data-testid="st-quiz">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
          {assessment.title}
        </h3>
        <StChip tone="default">{t('passThreshold', { n: assessment.pass_threshold })}</StChip>
      </div>

      <ol className="mt-3 flex flex-col gap-4">
        {assessment.questions.map((q, idx) => {
          const qid = String(q.question_id);
          const qResult = resultById.get(q.question_id);
          return (
            <li
              key={q.question_id}
              className="rounded-st-md border p-3"
              style={{ borderColor: 'rgba(185, 132, 56, 0.3)', background: 'var(--st-felt)' }}
              data-testid={`quiz-question-${q.question_id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: 'var(--st-brass-dark)' }}
                >
                  {t('questionLabel', { n: idx + 1 })} · {t('pointsLabel', { n: q.points })}
                </span>
                {qResult &&
                  (qResult.correct === null ? (
                    <StChip tone="default">
                      <StIcon name="clock" size={11} />
                      {t('ungraded')}
                    </StChip>
                  ) : qResult.correct ? (
                    <StChip tone="moss">
                      <StIcon name="check" size={11} />
                      {t('correct')}
                    </StChip>
                  ) : (
                    <StChip tone="ember">
                      <StIcon name="x" size={11} />
                      {t('incorrect')}
                    </StChip>
                  ))}
              </div>

              <p className="mt-1.5 text-sm" style={{ color: 'var(--st-ink)' }}>
                {q.prompt}
              </p>

              {q.kind === 'MULTIPLE_CHOICE' ? (
                <fieldset className="mt-2 flex flex-col gap-1.5">
                  {q.choices.map((choice, choiceIdx) => (
                    <label
                      key={choiceIdx}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: 'var(--st-ink-2)' }}
                    >
                      <input
                        type="radio"
                        name={`q-${qid}`}
                        className="mt-0.5"
                        checked={answers[qid] === choiceIdx}
                        disabled={locked}
                        onChange={() => setAnswers((prev) => ({ ...prev, [qid]: choiceIdx }))}
                        data-testid={`quiz-choice-${q.question_id}-${choiceIdx}`}
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <textarea
                  className="mt-2 w-full rounded-st-sm border px-2 py-1.5 text-sm"
                  style={{
                    borderColor: 'rgba(185, 132, 56, 0.4)',
                    background: 'var(--st-paper)',
                    color: 'var(--st-ink)',
                    minHeight: 72,
                  }}
                  rows={3}
                  placeholder={t('shortAnswerPlaceholder')}
                  value={typeof answers[qid] === 'string' ? (answers[qid] as string) : ''}
                  disabled={locked}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [qid]: e.target.value }))}
                  data-testid={`quiz-short-${q.question_id}`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {result && (
        <div
          className="mt-3 rounded-st-md border p-3"
          style={{
            borderColor: 'rgba(185, 132, 56, 0.3)',
            background: 'var(--st-paper-2)',
          }}
          data-testid="quiz-result"
        >
          {result.score !== null ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
                {t('scoreLabel', { score: result.score })}
              </span>
              {result.passed === true ? (
                <StChip tone="moss">
                  <StIcon name="check" size={11} />
                  {t('passed')}
                </StChip>
              ) : result.passed === false ? (
                <StChip tone="ember">{t('failed')}</StChip>
              ) : null}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--st-ink-2)' }}>
              {t('deferredNotice')}
            </p>
          )}
        </div>
      )}

      {queued && (
        <p
          className="mt-3 rounded-st-md border p-2.5 text-[12px]"
          style={{
            borderColor: 'rgba(185, 132, 56, 0.4)',
            background: 'rgba(185, 132, 56, 0.1)',
            color: 'var(--st-brass-dark)',
          }}
          data-testid="quiz-queued"
        >
          {t('queued')}
        </p>
      )}

      {error && (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!locked ? (
          <StButton
            type="button"
            variant="primary"
            size="md"
            disabled={submitting || !allAnswered}
            onClick={handleSubmit}
            data-testid="quiz-submit"
          >
            {submitting ? t('submitting') : t('submit')}
          </StButton>
        ) : (
          result &&
          result.passed === false && (
            <StButton type="button" variant="secondary" size="md" onClick={handleRetake}>
              {t('retake')}
            </StButton>
          )
        )}
      </div>
    </StCard>
  );
}
