'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CohortResponse,
  MockSubmitResponse,
  PaperDescriptor,
  PaperWithQuestions,
  PredictorResponse,
} from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider, StIcon, StProgress } from '@/components/st';
import { PredictorBand } from '@/components/student/home/PredictorBand';
import {
  getCohort,
  getPaper,
  getPredictor,
  listPapers,
  startMock,
  submitMock,
} from '@/lib/api/egsh';

type Stage =
  | { kind: 'pick' }
  | { kind: 'taking'; paper: PaperWithQuestions; sessionId: string }
  | { kind: 'scored'; result: MockSubmitResponse; paper: PaperWithQuestions };

export function EgshSurface() {
  const t = useTranslations('student.egsh');

  const [stage, setStage] = useState<Stage>({ kind: 'pick' });
  const [papers, setPapers] = useState<PaperDescriptor[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listPapers()
      .then(setPapers)
      .catch(() => setPapers([]));
  }, []);

  const onStart = useCallback(async (paper: PaperDescriptor) => {
    setBusy(true);
    try {
      const [full, session] = await Promise.all([
        getPaper(paper.paper_id),
        startMock(paper.paper_id),
      ]);
      setStage({ kind: 'taking', paper: full, sessionId: session.session_id });
    } finally {
      setBusy(false);
    }
  }, []);

  if (stage.kind === 'pick') {
    return (
      <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6" data-testid="egsh-pick">
        <StCard padding="lg">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: 'var(--st-ember)' }}
          >
            S04
          </p>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
            {t('title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {t('papersTitle')}
          </p>
          <StDivider />
          {papers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
              {t('noPapers')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2" data-testid="papers-list">
              {papers.map((p) => (
                <li
                  key={p.paper_id}
                  className="flex items-center justify-between gap-3 rounded-st-sm border px-3 py-2"
                  style={{ borderColor: 'rgba(185, 132, 56, 0.35)' }}
                >
                  <div>
                    <p
                      className="font-display text-sm font-semibold"
                      style={{ color: 'var(--st-soot)' }}
                    >
                      {p.subject} · {p.year}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
                      {p.question_count} {t('question')}
                    </p>
                  </div>
                  <StButton
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={busy}
                    onClick={() => onStart(p)}
                    data-testid={`egsh-start-${p.paper_id}`}
                  >
                    <StIcon name="play" size={12} />
                    {busy ? t('starting') : t('startMock')}
                  </StButton>
                </li>
              ))}
            </ul>
          )}
        </StCard>
      </main>
    );
  }

  if (stage.kind === 'taking') {
    return (
      <TakingMock
        paper={stage.paper}
        sessionId={stage.sessionId}
        onSubmitted={(result) => setStage({ kind: 'scored', result, paper: stage.paper })}
      />
    );
  }

  return (
    <ScoreSurface
      result={stage.result}
      paper={stage.paper}
      onAgain={() => setStage({ kind: 'pick' })}
    />
  );
}

const SECONDS_PER_QUESTION = 90; // 1.5 min/question — illustrative; real EGSh ≈ 3 min

function TakingMock({
  paper,
  sessionId,
  onSubmitted,
}: {
  paper: PaperWithQuestions;
  sessionId: string;
  onSubmitted: (r: MockSubmitResponse) => void;
}) {
  const t = useTranslations('student.egsh');
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState(0);
  const [tabFocused, setTabFocused] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const totalSeconds = paper.questions.length * SECONDS_PER_QUESTION;
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    const onChange = () => setTabFocused(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    if (submitting) return;
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [submitting]);

  const q = paper.questions[cursor]!;

  async function submit() {
    setSubmitting(true);
    try {
      const result = await submitMock(
        sessionId,
        paper.questions.map((qq) => ({ question_id: qq.id, chosen_index: picks[qq.id] ?? -1 })),
      );
      onSubmitted(result);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--st-cream)' }}>
      <header
        className="px-4 py-3 text-[#FBF3E2]"
        style={{
          background: 'linear-gradient(180deg, var(--st-soot) 0%, #1a0e08 100%)',
          borderBottom: '1px solid var(--st-brass-dark)',
        }}
        data-testid="egsh-exam-header"
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StChip tone="ember">
              <StIcon name="shield" size={11} />
              {t('proctored')}
            </StChip>
            <span
              className="font-mono text-sm font-bold"
              style={{ color: remaining < 60 ? '#F4C99A' : '#F4E8D1' }}
              data-testid="egsh-timer"
            >
              {formatClock(remaining)}
            </span>
            {!tabFocused && (
              <StChip tone="ember" data-testid="tab-focus-lost">
                <StIcon name="x" size={11} />
                {t('tabFocusLost')}
              </StChip>
            )}
          </div>
          <span className="font-mono text-xs">{`${cursor + 1} / ${paper.questions.length}`}</span>
        </div>
        <div className="mx-auto mt-2 max-w-2xl">
          <QuestionSegmentBar
            total={paper.questions.length}
            answered={(idx) => picks[paper.questions[idx]!.id] !== undefined}
            current={cursor}
            onJump={setCursor}
          />
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
        <StCard padding="lg" data-testid="egsh-question-card">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {q.strand}
          </p>
          <h2 className="mt-2 font-display text-lg font-bold" style={{ color: 'var(--st-soot)' }}>
            {q.prompt}
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {q.options.map((opt, idx) => {
              const active = picks[q.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPicks((p) => ({ ...p, [q.id]: idx }))}
                  className="min-h-11 rounded-st-sm border px-3 py-2 text-left text-sm transition-colors"
                  style={
                    active
                      ? {
                          background: 'var(--st-soot)',
                          color: '#FBF3E2',
                          borderColor: 'var(--st-soot)',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--st-ink)',
                          borderColor: 'rgba(185, 132, 56, 0.4)',
                        }
                  }
                  data-testid={`opt-${q.id}-${idx}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </StCard>

        <div className="mt-4 flex items-center justify-between gap-2">
          <StButton
            type="button"
            variant="secondary"
            size="sm"
            disabled={cursor === 0}
            onClick={() => setCursor((c) => Math.max(0, c - 1))}
          >
            <StIcon name="arrow_l" size={12} />
            {t('prev')}
          </StButton>
          {cursor < paper.questions.length - 1 ? (
            <StButton
              type="button"
              variant="brass"
              size="sm"
              onClick={() => setCursor((c) => Math.min(paper.questions.length - 1, c + 1))}
            >
              {t('next')}
              <StIcon name="arrow_r" size={12} />
            </StButton>
          ) : (
            <StButton
              type="button"
              variant="primary"
              size="sm"
              disabled={submitting}
              onClick={submit}
              data-testid="egsh-submit"
            >
              <StIcon name="check" size={12} />
              {submitting ? t('submitting') : t('submit')}
            </StButton>
          )}
        </div>
      </section>
    </main>
  );
}

function QuestionSegmentBar({
  total,
  answered,
  current,
  onJump,
}: {
  total: number;
  answered: (i: number) => boolean;
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <div className="flex gap-1" role="tablist" aria-label="questions">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === current;
        const isAnswered = answered(i);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onJump(i)}
            aria-pressed={isCurrent}
            data-testid={`seg-${i}`}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              background: isCurrent
                ? '#F4C99A'
                : isAnswered
                  ? 'var(--st-brass)'
                  : 'rgba(244, 232, 209, 0.18)',
            }}
          />
        );
      })}
    </div>
  );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ScoreSurface({
  result,
  paper,
  onAgain,
}: {
  result: MockSubmitResponse;
  paper: PaperWithQuestions;
  onAgain: () => void;
}) {
  const t = useTranslations('student.egsh');
  const [predictor, setPredictor] = useState<PredictorResponse | null>(null);
  const [cohort, setCohort] = useState<CohortResponse | null>(null);

  useEffect(() => {
    getPredictor(paper.subject)
      .then(setPredictor)
      .catch(() => undefined);
    getCohort({ subject: paper.subject, grade: 11 })
      .then(setCohort)
      .catch(() => undefined);
  }, [paper.subject]);

  const pct = Math.round((result.score / result.max_score) * 100);

  return (
    <main className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6" data-testid="egsh-score">
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('scoreLabel')}
        </p>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--st-soot)' }}>
            {result.score}/{result.max_score}
          </h1>
          <span className="font-mono text-sm" style={{ color: 'var(--st-ink-2)' }}>
            {pct}%
          </span>
        </div>
        <div className="mt-3">
          <StProgress value={pct} />
        </div>
      </StCard>

      {/* Strand mastery grid (post-submission) */}
      <StCard padding="md" className="mt-4">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('missedTitle')}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {result.per_strand.map((s) => {
            const total = s.correct + s.wrong;
            const sPct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
            const tone = sPct >= 60 ? '#5C6B3B' : sPct >= 30 ? '#C28A1A' : '#C2410C';
            return (
              <div
                key={s.strand}
                className="rounded-st-sm border p-2.5"
                style={{ borderColor: 'rgba(185,132,56,0.35)', background: 'var(--st-paper)' }}
                data-testid={`strand-${s.strand}`}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: 'var(--st-ink-3)' }}
                >
                  {s.strand}
                </p>
                <p className="mt-1 font-display text-lg font-bold" style={{ color: tone }}>
                  {s.correct}/{total}
                </p>
                <div className="mt-1">
                  <StProgress value={sPct} height={5} />
                </div>
              </div>
            );
          })}
        </div>
      </StCard>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Predictor card now uses the SVG band visualization */}
        <StCard variant="soot" padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: '#D4A24C' }}
          >
            {t('predictorTitle')}
          </p>
          <div className="mt-3">
            {predictor && predictor.band ? (
              <PredictorBand predictor={predictor} />
            ) : (
              <p className="text-xs" style={{ color: '#D8BC85' }}>
                {t('predictorEmpty')}
              </p>
            )}
          </div>
          {predictor && predictor.band && (
            <p className="mt-1 text-[11px]" style={{ color: '#D8BC85' }}>
              {predictor.sample_count} sample(s)
            </p>
          )}
        </StCard>

        <StCard padding="md">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('cohortTitle')}
          </p>
          {cohort && !cohort.insufficient_data ? (
            <p className="mt-2 text-sm" style={{ color: 'var(--st-ink)' }}>
              {Math.round(cohort.percentile)}% ({cohort.cohort_size})
            </p>
          ) : (
            <p className="mt-2 text-xs" style={{ color: 'var(--st-ink-3)' }}>
              {t('cohortInsufficient', {
                need: cohort && cohort.insufficient_data ? cohort.min_required : 30,
              })}
            </p>
          )}
        </StCard>
      </div>

      {result.missed.length > 0 && (
        <StCard padding="md" className="mt-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('missedTitle')}
          </p>
          <ul className="mt-2 flex flex-col gap-2" data-testid="missed-list">
            {result.missed.map((m) => (
              <li
                key={m.question_id}
                className="flex items-start justify-between gap-2 rounded-st-sm border px-3 py-2"
                style={{ borderColor: 'rgba(185, 132, 56, 0.35)' }}
              >
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--st-brass-dark)' }}>
                    {m.strand}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--st-ink)' }}>
                    {m.prompt}
                  </p>
                </div>
                <Link
                  href="/student/ai-tutor"
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    color: 'var(--st-ink-2)',
                    borderColor: 'rgba(185, 132, 56, 0.4)',
                  }}
                >
                  {t('remediateCta')}
                </Link>
              </li>
            ))}
          </ul>
        </StCard>
      )}

      <div className="mt-4">
        <StButton type="button" variant="secondary" size="sm" onClick={onAgain}>
          {t('startMock')}
        </StButton>
      </div>
    </main>
  );
}
