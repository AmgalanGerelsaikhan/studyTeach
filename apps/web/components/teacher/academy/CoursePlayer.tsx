'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Assessment, CourseDetail, CourseProgress } from '@studyteach/contracts';

import { StButton, StCard, StChip, StIcon } from '@/components/st';
import { completeLesson, enrollInCourse, getAssessment } from '@/lib/api/teacher-academy';

import { LessonVideo } from './LessonVideo';
import { StQuiz } from './StQuiz';
import { SyllabusSidebar } from './SyllabusSidebar';

/**
 * Course player — the E-025 client orchestrator. Holds the only client state
 * the screen needs: selected lesson, enrollment, optimistic completion, and
 * the lazily-fetched lesson quiz. Server data (CourseDetail) arrives as a
 * prop from the RSC route, so the initial paint is server-rendered.
 *
 * Offline-aware: enroll + mark-complete writes degrade to the sync queue and
 * surface a "queued" notice instead of throwing (OFFLINE_STRATEGY.md).
 */
export function CoursePlayer({ course }: { course: CourseDetail }) {
  const t = useTranslations('teacher.academy.player');

  const [selectedLessonId, setSelectedLessonId] = useState<number>(
    () => course.lessons[0]?.lesson_id ?? 0,
  );
  const [enrolled, setEnrolled] = useState<boolean>(course.enrollment !== null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollNotice, setEnrollNotice] = useState<'queued' | 'error' | null>(null);

  const [progress, setProgress] = useState<CourseProgress>(course.progress);
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    () => new Set(course.lessons.filter((l) => l.completed).map((l) => l.lesson_id)),
  );
  const [marking, setMarking] = useState(false);
  const [completeNotice, setCompleteNotice] = useState<'queued' | 'error' | null>(null);

  // Lesson-quiz cache: assessment_id → fetched Assessment.
  const [quizCache, setQuizCache] = useState<Record<number, Assessment>>({});
  const [quizError, setQuizError] = useState(false);

  const selectedLesson = useMemo(
    () => course.lessons.find((l) => l.lesson_id === selectedLessonId) ?? null,
    [course.lessons, selectedLessonId],
  );
  const lessonContent = useMemo(
    () => course.lesson_content.find((c) => c.lesson_id === selectedLessonId) ?? null,
    [course.lesson_content, selectedLessonId],
  );

  const quizId = selectedLesson?.quiz_assessment_id ?? null;

  useEffect(() => {
    if (quizId === null) return;
    if (quizCache[quizId]) return;
    let cancelled = false;
    setQuizError(false);
    getAssessment(quizId)
      .then((assessment) => {
        if (!cancelled) setQuizCache((prev) => ({ ...prev, [quizId]: assessment }));
      })
      .catch(() => {
        if (!cancelled) setQuizError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [quizId, quizCache]);

  const handleEnroll = useCallback(async () => {
    setEnrolling(true);
    setEnrollNotice(null);
    try {
      const res = await enrollInCourse(course.course_id);
      if (res.status === 'queued') {
        setEnrollNotice('queued');
        // Optimistically unlock the player — the write is durably queued.
        setEnrolled(true);
      } else {
        setEnrolled(true);
      }
    } catch {
      setEnrollNotice('error');
    } finally {
      setEnrolling(false);
    }
  }, [course.course_id]);

  const handleMarkComplete = useCallback(async () => {
    if (!selectedLesson) return;
    setMarking(true);
    setCompleteNotice(null);
    const lessonId = selectedLesson.lesson_id;
    try {
      const res = await completeLesson(lessonId, 0);
      if (res.status === 'queued') {
        setCompleteNotice('queued');
        setCompletedIds((prev) => new Set(prev).add(lessonId));
        setProgress((prev) => ({
          completed: Math.min(prev.total, prev.completed + (completedIds.has(lessonId) ? 0 : 1)),
          total: prev.total,
        }));
      } else {
        setCompletedIds((prev) => new Set(prev).add(lessonId));
        setProgress(res.value.progress);
      }
    } catch {
      setCompleteNotice('error');
    } finally {
      setMarking(false);
    }
  }, [selectedLesson, completedIds]);

  const lessonDone =
    selectedLesson !== null &&
    (selectedLesson.completed || completedIds.has(selectedLesson.lesson_id));

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6" data-testid="course-player">
      <Link
        href="/teacher/personal/academy"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
        style={{ color: 'var(--st-brass-dark)' }}
      >
        <StIcon name="arrow_l" size={13} />
        {t('backToCatalog')}
      </Link>

      <StCard padding="lg" className="mt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StChip tone="brass">{course.subject}</StChip>
          {course.methodology && <StChip tone="default">{course.methodology}</StChip>}
          {enrolled && (
            <StChip tone="moss">
              <StIcon name="check" size={11} />
              {t('enrolledNotice')}
            </StChip>
          )}
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--st-soot)' }}>
          {course.title}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--st-ink-2)' }}>
          {course.summary}
        </p>

        {!enrolled && (
          <div className="mt-3">
            <StButton
              type="button"
              variant="primary"
              size="md"
              disabled={enrolling}
              onClick={handleEnroll}
              data-testid="course-enroll"
            >
              {enrolling ? t('enrolling') : t('enrollCta')}
            </StButton>
          </div>
        )}
        {enrollNotice === 'queued' && (
          <p
            className="mt-2 rounded-st-md border p-2.5 text-[12px]"
            style={{
              borderColor: 'rgba(185, 132, 56, 0.4)',
              background: 'rgba(185, 132, 56, 0.1)',
              color: 'var(--st-brass-dark)',
            }}
          >
            {t('enrollQueued')}
          </p>
        )}
        {enrollNotice === 'error' && (
          <p className="mt-2 text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
            {t('enrollError')}
          </p>
        )}
      </StCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="min-w-0">
          {selectedLesson === null ? (
            <StCard padding="md">
              <p className="text-sm" style={{ color: 'var(--st-ink-3)' }}>
                {t('selectLesson')}
              </p>
            </StCard>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: 'var(--st-brass-dark)' }}
                >
                  {t('lessonLabel', { ordinal: selectedLesson.ordinal })}
                </p>
                <h2
                  className="mt-0.5 font-display text-lg font-bold"
                  style={{ color: 'var(--st-soot)' }}
                >
                  {selectedLesson.title}
                </h2>
              </div>

              <LessonVideo
                lesson={selectedLesson}
                transcriptMn={lessonContent?.transcript_mn ?? ''}
              />

              {lessonContent && lessonContent.assets.length > 0 && (
                <StCard padding="md">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--st-brass-dark)' }}
                  >
                    {t('assetsEyebrow')}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {lessonContent.assets.map((asset) => (
                      <li key={asset.asset_id}>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
                          style={{ color: 'var(--st-ember)' }}
                        >
                          <StIcon
                            name={
                              asset.kind === 'PDF'
                                ? 'file'
                                : asset.kind === 'LINK'
                                  ? 'globe'
                                  : 'folder'
                            }
                            size={13}
                          />
                          {asset.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </StCard>
              )}

              {/* Lesson quiz */}
              {quizId !== null && (
                <div data-testid="lesson-quiz-slot">
                  <p
                    className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'var(--st-brass-dark)' }}
                  >
                    {t('quizEyebrow')}
                  </p>
                  {quizCache[quizId] ? (
                    <StQuiz assessment={quizCache[quizId]} />
                  ) : quizError ? (
                    <StCard padding="md">
                      <p className="text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
                        {t('videoUnavailable')}
                      </p>
                    </StCard>
                  ) : (
                    <StCard padding="md">
                      <p className="text-xs" style={{ color: 'var(--st-ink-3)' }}>
                        {t('videoLoading')}
                      </p>
                    </StCard>
                  )}
                </div>
              )}

              {/* Mark-complete */}
              <StCard padding="md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {lessonDone ? (
                    <StChip tone="moss">
                      <StIcon name="check" size={11} />
                      {t('completed')}
                    </StChip>
                  ) : (
                    <StButton
                      type="button"
                      variant="brass"
                      size="md"
                      disabled={marking || !enrolled}
                      onClick={handleMarkComplete}
                      data-testid="lesson-mark-complete"
                    >
                      {marking ? t('marking') : t('markComplete')}
                    </StButton>
                  )}
                </div>
                {completeNotice === 'queued' && (
                  <p
                    className="mt-2 rounded-st-md border p-2.5 text-[12px]"
                    style={{
                      borderColor: 'rgba(185, 132, 56, 0.4)',
                      background: 'rgba(185, 132, 56, 0.1)',
                      color: 'var(--st-brass-dark)',
                    }}
                  >
                    {t('completeQueued')}
                  </p>
                )}
                {completeNotice === 'error' && (
                  <p className="mt-2 text-[12px]" style={{ color: 'var(--st-cinnabar)' }}>
                    {t('completeError')}
                  </p>
                )}
              </StCard>
            </div>
          )}
        </section>

        <aside>
          <SyllabusSidebar
            lessons={course.lessons}
            progress={progress}
            selectedLessonId={selectedLessonId}
            completedLessonIds={completedIds}
            onSelect={setSelectedLessonId}
          />
        </aside>
      </div>
    </main>
  );
}
