'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CreateFocusSessionRequest,
  FocusActivityKind,
  FocusActivityRef,
  FocusSession,
  FocusSessionSummary,
} from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider, StIcon, StInput } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import {
  closeFocusSessionClient,
  createFocusSessionClient,
  getFocusSummaryClient,
} from '@/lib/api/focus';

// Teacher Focus composer (E-039). Single-island client component that owns:
//   1. the create form
//   2. the post-create hero card with live participant counter (5s poll)
//   3. the close-out + summary view
//
// The page shell (apps/web/app/teacher/focus/page.tsx) is a server component
// per CLAUDE.md — it just mounts this island.

type Phase =
  | { kind: 'compose' }
  | { kind: 'live'; session: FocusSession; summary: FocusSessionSummary | null }
  | { kind: 'closed'; session: FocusSession; summary: FocusSessionSummary | null };

const ACTIVITY_KINDS: FocusActivityKind[] = [
  'AI_TUTOR',
  'EGSH_PRACTICE',
  'ACADEMY_LESSON',
  'CURRICULUM_READING',
];

/** Default scheduled_end for the picker — +45 min, rounded to the minute. */
function defaultScheduledEnd(): string {
  const d = new Date(Date.now() + 45 * 60 * 1000);
  d.setSeconds(0, 0);
  // `datetime-local` wants YYYY-MM-DDTHH:mm in *local* time.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FocusCreatePanel() {
  const t = useTranslations('teacher.focus');
  const tActivity = useTranslations('teacher.focus.activity');
  const [phase, setPhase] = useState<Phase>({ kind: 'compose' });

  // Form state — owned here so the composer + hero share a parent reset.
  const [activityKind, setActivityKind] = useState<FocusActivityKind>('AI_TUTOR');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [strand, setStrand] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [chunkId, setChunkId] = useState('');
  const [scheduledEndLocal, setScheduledEndLocal] = useState<string>(defaultScheduledEnd());

  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function buildActivityRef(): FocusActivityRef | { error: string } {
    switch (activityKind) {
      case 'AI_TUTOR': {
        const v = topic.trim();
        if (!v) return { error: t('topicRequired') };
        return { kind: 'AI_TUTOR', topic: v };
      }
      case 'EGSH_PRACTICE': {
        const s = subject.trim();
        const r = strand.trim();
        if (!s) return { error: t('subjectRequired') };
        if (!r) return { error: t('strandRequired') };
        return { kind: 'EGSH_PRACTICE', subject: s, strand: r };
      }
      case 'ACADEMY_LESSON': {
        const n = Number(lessonId);
        if (!Number.isInteger(n) || n <= 0) return { error: t('lessonIdRequired') };
        return { kind: 'ACADEMY_LESSON', lesson_id: n };
      }
      case 'CURRICULUM_READING': {
        const n = Number(chunkId);
        if (!Number.isInteger(n) || n <= 0) return { error: t('chunkIdRequired') };
        return { kind: 'CURRICULUM_READING', chunk_id: n };
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const ref = buildActivityRef();
    if ('error' in ref) {
      setError(ref.error);
      return;
    }
    // datetime-local → ISO 8601. `new Date(local)` interprets in local tz,
    // which matches what the user picked; .toISOString() yields the UTC form
    // the contract requires.
    const endIso = new Date(scheduledEndLocal).toISOString();
    if (new Date(endIso).getTime() <= Date.now()) {
      setError(t('scheduledEndPast'));
      return;
    }

    const body: CreateFocusSessionRequest = {
      activity_kind: activityKind,
      activity_ref: ref,
      scheduled_end: endIso,
    };
    setSubmitting(true);
    try {
      const session = await createFocusSessionClient(body);
      setPhase({ kind: 'live', session, summary: null });
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          err.body && typeof err.body === 'object' && typeof err.body.message === 'string'
            ? err.body.message
            : t('createError');
        setError(msg);
      } else {
        setError(t('createError'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Live phase: 5s summary poll ────────────────────────────────────────────
  const liveSessionId = phase.kind === 'live' ? phase.session.session_id : null;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (liveSessionId === null) return;
    let cancelled = false;
    async function tick() {
      try {
        const summary = await getFocusSummaryClient(liveSessionId!);
        if (cancelled) return;
        setPhase((prev) =>
          prev.kind === 'live' && prev.session.session_id === liveSessionId
            ? { ...prev, summary }
            : prev,
        );
      } catch {
        // Ignore — next tick retries.
      }
    }
    tick();
    pollRef.current = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [liveSessionId]);

  const handleClose = useCallback(async () => {
    if (phase.kind !== 'live' || closing) return;
    setClosing(true);
    setError(null);
    try {
      await closeFocusSessionClient(phase.session.session_id);
      // Stop the poll, fetch one final summary, freeze into closed phase.
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      let finalSummary: FocusSessionSummary | null = phase.summary;
      try {
        finalSummary = await getFocusSummaryClient(phase.session.session_id);
      } catch {
        // Fall back to whatever we last polled.
      }
      setPhase({ kind: 'closed', session: phase.session, summary: finalSummary });
    } catch (err) {
      if (err instanceof ApiError) {
        const msg =
          err.body && typeof err.body === 'object' && typeof err.body.message === 'string'
            ? err.body.message
            : t('closeError');
        setError(msg);
      } else {
        setError(t('closeError'));
      }
    } finally {
      setClosing(false);
    }
  }, [phase, closing, t]);

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be denied — silent fail is fine, code is on screen.
    }
  }

  function startNew() {
    setPhase({ kind: 'compose' });
    setError(null);
    setCopied(false);
    setScheduledEndLocal(defaultScheduledEnd());
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase.kind === 'compose') {
    return (
      <StCard padding="lg">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('eyebrow')}
        </p>
        <h1
          className="mt-1 font-display text-xl font-bold sm:text-2xl"
          style={{ color: 'var(--st-soot)' }}
        >
          {t('title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-4"
          data-testid="focus-create-form"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="focus-activity-kind"
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: 'var(--st-ink-3)' }}
            >
              {t('activityKindLabel')}
            </label>
            <select
              id="focus-activity-kind"
              value={activityKind}
              onChange={(e) => setActivityKind(e.target.value as FocusActivityKind)}
              className="w-full rounded-st-md border px-3 py-2.5 text-sm"
              style={{
                background: 'var(--st-paper)',
                color: 'var(--st-ink)',
                borderColor: 'rgba(185, 132, 56, 0.4)',
              }}
            >
              {ACTIVITY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tActivity(k)}
                </option>
              ))}
            </select>
          </div>

          {activityKind === 'AI_TUTOR' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="focus-topic"
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--st-ink-3)' }}
              >
                {t('aiTutor.topicLabel')}
              </label>
              <StInput
                id="focus-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={120}
                placeholder="Физик: хүчний момент"
              />
            </div>
          )}

          {activityKind === 'EGSH_PRACTICE' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="focus-subject"
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--st-ink-3)' }}
                >
                  {t('egsh.subjectLabel')}
                </label>
                <StInput
                  id="focus-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={60}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="focus-strand"
                  className="text-[11px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: 'var(--st-ink-3)' }}
                >
                  {t('egsh.strandLabel')}
                </label>
                <StInput
                  id="focus-strand"
                  value={strand}
                  onChange={(e) => setStrand(e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
          )}

          {activityKind === 'ACADEMY_LESSON' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="focus-lesson"
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--st-ink-3)' }}
              >
                {t('academy.lessonLabel')}
              </label>
              <StInput
                id="focus-lesson"
                inputMode="numeric"
                pattern="\d+"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          {activityKind === 'CURRICULUM_READING' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="focus-chunk"
                className="text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ color: 'var(--st-ink-3)' }}
              >
                {t('curriculum.chunkLabel')}
              </label>
              <StInput
                id="focus-chunk"
                inputMode="numeric"
                pattern="\d+"
                value={chunkId}
                onChange={(e) => setChunkId(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              htmlFor="focus-scheduled-end"
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: 'var(--st-ink-3)' }}
            >
              {t('scheduledEndLabel')}
            </label>
            <input
              id="focus-scheduled-end"
              type="datetime-local"
              value={scheduledEndLocal}
              onChange={(e) => setScheduledEndLocal(e.target.value)}
              className="w-full rounded-st-md border px-3 py-2.5 text-sm"
              style={{
                background: 'var(--st-paper)',
                color: 'var(--st-ink)',
                borderColor: 'rgba(185, 132, 56, 0.4)',
              }}
            />
          </div>

          {error && (
            <p role="alert" className="text-xs" style={{ color: 'var(--st-cinnabar)' }}>
              {error}
            </p>
          )}

          <StButton type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? t('creating') : t('createCta')}
          </StButton>
        </form>
      </StCard>
    );
  }

  // Live + closed phases share the hero layout.
  const isClosed = phase.kind === 'closed';
  const session = phase.session;
  const summary = phase.summary;
  // The hint from the spec — derive "live" as joined - left when summary present.
  const liveCount = (() => {
    if (!summary) return session.live_participant_count;
    const left =
      summary.leave_reasons.session_ended +
      summary.leave_reasons.teacher_closed +
      summary.leave_reasons.student_left +
      summary.leave_reasons.timeout;
    return Math.max(0, summary.total_joined - left);
  })();

  return (
    <div className="flex flex-col gap-4">
      <StCard
        padding="lg"
        className="text-center"
        style={{
          background: 'var(--st-paper)',
          borderColor: 'var(--st-brass-dark)',
          borderWidth: 2,
          boxShadow: 'var(--st-shadow-md)',
        }}
      >
        <p
          className="text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('codeHero')}
        </p>
        <div
          className="mx-auto mt-3 font-display font-bold tracking-[0.25em]"
          style={{
            fontSize: 'clamp(40pt, 12vw, 72pt)',
            color: 'var(--st-soot)',
            lineHeight: 1,
          }}
          data-testid="focus-code"
        >
          {session.code}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <StChip tone="brass">{tActivity(session.activity_kind)}</StChip>
          {isClosed ? (
            <StChip tone="soot">{t('closed')}</StChip>
          ) : (
            <StChip tone="ember">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: 'var(--st-ember)' }}
                />
                {t('liveCount', { n: liveCount })}
              </span>
            </StChip>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <StButton
            type="button"
            variant="brass"
            size="md"
            onClick={() => handleCopy(session.code)}
          >
            <StIcon name={copied ? 'check' : 'pin'} size={14} />
            {copied ? t('codeCopied') : t('codeCopy')}
          </StButton>

          {!isClosed && (
            <StButton
              type="button"
              variant="primary"
              size="md"
              onClick={handleClose}
              disabled={closing}
              data-testid="focus-close"
            >
              {closing ? t('closing') : t('closeCta')}
            </StButton>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs" style={{ color: 'var(--st-cinnabar)' }}>
            {error}
          </p>
        )}
      </StCard>

      {summary && (
        <StCard padding="md">
          <p
            className="text-[11px] font-bold uppercase tracking-[0.16em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('eyebrow')}
          </p>
          <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2" style={{ color: 'var(--st-ink)' }}>
            <li>
              <span style={{ color: 'var(--st-ink-3)' }}>•</span>{' '}
              {t('summaryJoined', { n: summary.total_joined })}
            </li>
            <li>
              <span style={{ color: 'var(--st-ink-3)' }}>•</span>{' '}
              {t('summaryLeft', {
                n:
                  summary.leave_reasons.student_left +
                  summary.leave_reasons.timeout +
                  summary.leave_reasons.teacher_closed +
                  summary.leave_reasons.session_ended,
              })}
            </li>
          </ul>
        </StCard>
      )}

      {isClosed && (
        <>
          <StDivider />
          <div className="flex justify-end">
            <StButton type="button" variant="secondary" size="md" onClick={startNew}>
              {t('create')}
            </StButton>
          </div>
        </>
      )}
    </div>
  );
}
