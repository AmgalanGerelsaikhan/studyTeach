'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TutorSubject } from '@studyteach/contracts';

import { StButton, StCard, StChip, StDivider, StIcon, StSubjectGlyph } from '@/components/st';
import { ApiError } from '@/lib/api/base';
import {
  fetchMyMastery,
  findPractice,
  sendTurn,
  startSession,
  type MasteryRow,
  type PracticeProblem,
  type SessionDescriptor,
  type TurnResult,
} from '@/lib/api/ai-tutor';
import {
  listLocalSessions,
  setFirstUserText,
  upsertLocalSession,
  type LocalTutorSession,
} from '@/lib/offline/tutorSessions';

import { ConceptsPane } from './ConceptsPane';
import { InputBar } from './InputBar';
import { MessageList, type ChatMessage } from './MessageList';
import { PracticePair } from './PracticePair';
import { SessionsPane } from './SessionsPane';

type Stage = { kind: 'config' } | { kind: 'chatting'; session: SessionDescriptor };

const SUBJECTS: TutorSubject[] = ['physics', 'math', 'mongolian'];
const GRADES = [11, 12] as const;

/**
 * Top-level client component for the /ai-tutor page.
 *
 * Pre-session: a small "configure + start" panel asks for subject + grade and
 * then POSTs /ai-tutor/sessions. The same shell holds the chat once a session
 * exists — keeping it inside one component avoids a flash of layout when the
 * route transitions from empty to populated.
 *
 * On every assistant turn we call /practice-problems for the cited strands
 * (T13). The practice pair renders right below the latest assistant bubble.
 */
export function AiTutorChat() {
  const t = useTranslations('student.tutor');
  const [stage, setStage] = useState<Stage>({ kind: 'config' });
  const [subject, setSubject] = useState<TutorSubject>('physics');
  const [grade, setGrade] = useState<number>(11);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [practice, setPractice] = useState<PracticeProblem[]>([]);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [sending, setSending] = useState(false);
  const [localSessions, setLocalSessions] = useState<LocalTutorSession[]>([]);
  const subjectsId = useId();

  // Hydrate the sessions pane on mount from IDB; fire-and-forget.
  useEffect(() => {
    listLocalSessions()
      .then(setLocalSessions)
      .catch(() => setLocalSessions([]));
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      const session = await startSession({ lang: 'mn-Cyrl', subject, grade });
      setStage({ kind: 'chatting', session });
      setMessages([]);
      setPractice([]);
      // Persist a stub local row so it appears in the sessions list immediately.
      await upsertLocalSession({
        session_id: session.session_id,
        subject: session.subject,
        grade: session.grade,
        lang: session.lang,
        first_user_text: null,
      });
      listLocalSessions()
        .then(setLocalSessions)
        .catch(() => undefined);
      // Fire-and-forget initial mastery fetch; empty rows are fine.
      fetchMyMastery()
        .then(setMastery)
        .catch(() => setMastery([]));
    } catch (e) {
      setError(formatError(e, t));
    } finally {
      setStarting(false);
    }
  }, [subject, grade, t]);

  const handleSelectSession = useCallback((s: LocalTutorSession) => {
    // The API session row still exists; we just rehydrate the UI shell with
    // its metadata. We do NOT refetch transcript history — that lands when
    // the SSE+history endpoints arrive (S04).
    setStage({
      kind: 'chatting',
      session: {
        session_id: s.session_id,
        subject: s.subject as TutorSubject,
        grade: s.grade,
        lang: s.lang as SessionDescriptor['lang'],
        replayed: true,
      },
    });
    setMessages([]);
    setPractice([]);
    setError(null);
    fetchMyMastery()
      .then(setMastery)
      .catch(() => setMastery([]));
  }, []);

  const handleNewSession = useCallback(() => {
    setStage({ kind: 'config' });
    setMessages([]);
    setPractice([]);
    setError(null);
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (stage.kind !== 'chatting') return;
      setError(null);
      const userMsgId = crypto.randomUUID();
      const pendingId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', text },
        { id: pendingId, role: 'pending' },
      ]);
      setSending(true);
      // Stamp the first-user-text on the local session row (only takes effect
      // on the first call per session — helper is idempotent).
      setFirstUserText(stage.session.session_id, text)
        .then(() => listLocalSessions())
        .then(setLocalSessions)
        .catch(() => undefined);
      try {
        const result: TurnResult = await sendTurn(stage.session.session_id, text);
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== pendingId)
            .concat(
              result.role === 'assistant'
                ? {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    text: result.text,
                    citations: result.citations,
                  }
                : {
                    id: crypto.randomUUID(),
                    role: 'refusal',
                    refusal_key: result.refusal_key,
                    text: result.text,
                  },
            ),
        );
        if (result.role === 'assistant' && result.citations.length > 0) {
          const strand = result.citations[0]?.strand;
          const fetched = await findPractice({
            lang: 'mn-Cyrl',
            subject: stage.session.subject,
            grade: stage.session.grade,
            ...(strand ? { strand } : {}),
            k: 2,
          }).catch(() => [] as PracticeProblem[]);
          setPractice(fetched);
          fetchMyMastery()
            .then(setMastery)
            .catch(() => undefined);
        } else {
          setPractice([]);
        }
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== pendingId));
        setError(formatError(e, t));
      } finally {
        setSending(false);
      }
    },
    [stage, t],
  );

  return (
    <div
      className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[260px_1fr_240px]"
      data-testid="tutor-shell"
    >
      {/* Mobile toolbar: opens sessions sheet (panes are hidden lg:block on
          desktop; this exposes them on phone via a bottom drawer). */}
      <MobileTutorToolbar
        sessions={localSessions}
        activeId={stage.kind === 'chatting' ? stage.session.session_id : null}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
      />

      <SessionsPane
        sessions={localSessions}
        activeId={stage.kind === 'chatting' ? stage.session.session_id : null}
        onSelect={handleSelectSession}
        onNew={handleNewSession}
      />

      <section
        className="flex min-h-[60vh] min-w-0 flex-col overflow-hidden rounded-st-lg border sm:min-h-[72vh]"
        style={{
          borderColor: 'rgba(185, 132, 56, 0.35)',
          background: 'var(--st-cream)',
          boxShadow: 'var(--st-shadow-sm)',
        }}
      >
        {stage.kind === 'config' ? (
          <ConfigPanel
            t={t}
            subjectsId={subjectsId}
            subject={subject}
            setSubject={setSubject}
            grade={grade}
            setGrade={setGrade}
            starting={starting}
            error={error}
            onStart={handleStart}
          />
        ) : (
          <>
            <header
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{
                borderColor: 'rgba(185, 132, 56, 0.3)',
                background: 'var(--st-paper)',
              }}
              data-testid="tutor-topic-header"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{
                  background: 'var(--st-felt)',
                  borderColor: 'rgba(185, 132, 56, 0.4)',
                }}
              >
                <StSubjectGlyph subject={stage.session.subject} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-display text-base font-bold"
                  style={{ color: 'var(--st-soot)' }}
                >
                  {subjectLabel(t, stage.session.subject)}
                </p>
                <p className="truncate font-mono text-[11px]" style={{ color: 'var(--st-ink-3)' }}>
                  {t('subjectBadge', {
                    subject: subjectLabel(t, stage.session.subject),
                    grade: stage.session.grade,
                  })}{' '}
                  · {stage.session.session_id.slice(0, 8)}
                </p>
              </div>
              <StChip tone="moss">
                <StIcon name="check" size={10} />
                {t('topicAlignedChip')}
              </StChip>
            </header>
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} />
              {practice.length > 0 && (
                <>
                  <StDivider />
                  <PracticePair problems={practice} />
                </>
              )}
            </div>
            {error && (
              <div
                role="alert"
                className="border-t px-4 py-2 text-xs"
                style={{
                  borderColor: 'rgba(185, 132, 56, 0.35)',
                  color: 'var(--st-cinnabar)',
                  background: 'rgba(194, 65, 12, 0.06)',
                }}
              >
                {error}
              </div>
            )}
            <InputBar disabled={sending} onSubmit={handleSend} />
          </>
        )}
      </section>

      <ConceptsPane mastery={mastery} />
    </div>
  );
}

function ConfigPanel({
  t,
  subjectsId,
  subject,
  setSubject,
  grade,
  setGrade,
  starting,
  error,
  onStart,
}: {
  t: ReturnType<typeof useTranslations>;
  subjectsId: string;
  subject: TutorSubject;
  setSubject: (s: TutorSubject) => void;
  grade: number;
  setGrade: (g: number) => void;
  starting: boolean;
  error: string | null;
  onStart: () => void;
}) {
  return (
    <div className="m-4 flex flex-1 items-center justify-center">
      <StCard padding="lg" className="w-full max-w-md">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ color: 'var(--st-ember)' }}
        >
          S03
        </p>
        <h2 className="mt-1 font-display text-xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {t('title')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {t('subtitle')}
        </p>

        <fieldset className="mt-4" id={subjectsId}>
          <legend
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('subjectLabel')}
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={s === subject}
                data-testid={`subject-${s}`}
                onClick={() => setSubject(s)}
                className="rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors"
                style={
                  s === subject
                    ? {
                        background: 'var(--st-soot)',
                        color: '#FBF3E2',
                        borderColor: 'var(--st-soot)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--st-ink-2)',
                        borderColor: 'rgba(185, 132, 56, 0.4)',
                      }
                }
              >
                {subjectLabel(t, s)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: 'var(--st-brass-dark)' }}
          >
            {t('gradeLabel')}
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={g === grade}
                data-testid={`grade-${g}`}
                onClick={() => setGrade(g)}
                className="rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors"
                style={
                  g === grade
                    ? {
                        background: 'var(--st-soot)',
                        color: '#FBF3E2',
                        borderColor: 'var(--st-soot)',
                      }
                    : {
                        background: 'transparent',
                        color: 'var(--st-ink-2)',
                        borderColor: 'rgba(185, 132, 56, 0.4)',
                      }
                }
              >
                {g}
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="mt-3 text-xs" style={{ color: 'var(--st-cinnabar)' }}>
            {error}
          </p>
        )}

        <div className="mt-5">
          <StButton
            type="button"
            variant="primary"
            size="md"
            onClick={onStart}
            disabled={starting}
            data-testid="tutor-start"
          >
            <StIcon name="play" size={14} />
            {starting ? t('starting') : t('startCta')}
          </StButton>
        </div>
      </StCard>
    </div>
  );
}

/**
 * Mobile-only toolbar shown above the chat column on <lg. Opens a bottom
 * sheet that mirrors the SessionsPane content (which is hidden lg:block on
 * mobile and would otherwise be inaccessible). New-session + session-picker
 * are the two affordances; concepts pane is read-only and a fold below is
 * less critical, so it stays desktop-only.
 */
function MobileTutorToolbar({
  sessions,
  activeId,
  onSelect,
  onNew,
}: {
  sessions: LocalTutorSession[];
  activeId: string | null;
  onSelect: (s: LocalTutorSession) => void;
  onNew: () => void;
}) {
  const t = useTranslations('student.tutor');
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2 lg:hidden">
      <StButton
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        data-testid="tutor-mobile-sessions"
        className="flex-1"
      >
        <StIcon name="chevron_u" size={12} />
        {t('sessionsTitle')} ({sessions.length})
      </StButton>
      <StButton
        type="button"
        size="sm"
        variant="primary"
        onClick={() => {
          setOpen(false);
          onNew();
        }}
      >
        <StIcon name="plus" size={12} />
        {t('newSession')}
      </StButton>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div
            className="relative w-full max-h-[70vh] overflow-y-auto rounded-t-2xl border-t p-3"
            style={{
              background: 'var(--st-paper)',
              borderColor: 'rgba(185,132,56,0.45)',
              boxShadow: 'var(--st-shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="close"
              onClick={() => setOpen(false)}
              className="ml-auto flex h-9 w-9 items-center justify-center"
              style={{ color: 'var(--st-ink-2)' }}
            >
              <StIcon name="x" size={16} />
            </button>
            <ul className="flex flex-col gap-1" data-testid="tutor-mobile-sessions-list">
              {sessions.length === 0 ? (
                <li className="px-3 py-2 text-xs" style={{ color: 'var(--st-ink-3)' }}>
                  {t('emptySessions')}
                </li>
              ) : (
                sessions.map((s) => {
                  const active = s.session_id === activeId;
                  return (
                    <li key={s.session_id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(s);
                          setOpen(false);
                        }}
                        className="block w-full rounded-st-sm border px-3 py-2 text-left text-sm"
                        style={
                          active
                            ? {
                                background: 'var(--st-paper)',
                                color: 'var(--st-ink)',
                                borderColor: 'var(--st-ember)',
                              }
                            : {
                                background: 'transparent',
                                color: 'var(--st-ink-2)',
                                borderColor: 'rgba(185,132,56,0.25)',
                              }
                        }
                      >
                        <span
                          className="block text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: 'var(--st-ink-3)' }}
                        >
                          {s.subject} · {s.grade}
                        </span>
                        <span className="mt-0.5 block truncate font-semibold">
                          {s.first_user_text ?? '—'}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function subjectLabel(t: ReturnType<typeof useTranslations>, subject: TutorSubject): string {
  switch (subject) {
    case 'physics':
      return t('subjectPhysics');
    case 'math':
      return t('subjectMath');
    case 'mongolian':
      return t('subjectMongolian');
    case 'chem':
      return t('subjectChem');
    case 'bio':
      return t('subjectBio');
    case 'history':
      return t('subjectHistory');
    case 'english':
      return t('subjectEnglish');
    case 'info':
      return t('subjectInfo');
  }
}

function formatError(e: unknown, t: ReturnType<typeof useTranslations>): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return t('errorAuth');
    if (e.status === 403) return t('errorBlocked');
    return e.message || t('errorGeneric');
  }
  return t('errorGeneric');
}
