import { useTranslations } from 'next-intl';
import type { CourseProgress, LessonSummary } from '@studyteach/contracts';

import { StCard, StIcon, StProgress } from '@/components/st';

/**
 * Course syllabus — a flat lesson list plus a progress card. Presentational:
 * it renders inside the client `CoursePlayer` (which owns the selected-lesson
 * state) so it carries no `'use client'` directive of its own. Selection is
 * delegated up via `onSelect`.
 */
export function SyllabusSidebar({
  lessons,
  progress,
  selectedLessonId,
  completedLessonIds,
  onSelect,
}: {
  lessons: LessonSummary[];
  progress: CourseProgress;
  selectedLessonId: number;
  /** Lesson ids completed this session (optimistic) merged with server state. */
  completedLessonIds: Set<number>;
  onSelect: (lessonId: number) => void;
}) {
  const t = useTranslations('teacher.academy.player');
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('progressEyebrow')}
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--st-soot)' }}>
          {t('progressValue', { done: progress.completed, total: progress.total })}
        </p>
        <div className="mt-2">
          <StProgress value={pct} height={8} />
        </div>
      </StCard>

      <StCard padding="md">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--st-brass-dark)' }}
        >
          {t('syllabusEyebrow')}
        </p>
        <ul className="mt-2 flex flex-col gap-1" data-testid="syllabus-list">
          {lessons.map((lesson) => {
            const active = lesson.lesson_id === selectedLessonId;
            const done = lesson.completed || completedLessonIds.has(lesson.lesson_id);
            return (
              <li key={lesson.lesson_id}>
                <button
                  type="button"
                  onClick={() => onSelect(lesson.lesson_id)}
                  aria-current={active ? 'true' : undefined}
                  className="flex w-full items-start gap-2 rounded-st-sm border px-2.5 py-2 text-left text-[13px] transition-colors"
                  style={
                    active
                      ? {
                          background: 'var(--st-soot)',
                          color: '#FBF3E2',
                          borderColor: 'var(--st-soot)',
                        }
                      : {
                          background: 'transparent',
                          color: 'var(--st-ink-2)',
                          borderColor: 'rgba(185, 132, 56, 0.3)',
                        }
                  }
                  data-testid={`syllabus-lesson-${lesson.lesson_id}`}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border"
                    style={{
                      borderColor: done
                        ? 'var(--st-moss)'
                        : active
                          ? 'rgba(244,232,209,0.6)'
                          : 'rgba(185, 132, 56, 0.5)',
                      background: done ? 'var(--st-moss)' : 'transparent',
                    }}
                  >
                    {done && <StIcon name="check" size={9} color="#FBF3E2" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {t('lessonLabel', { ordinal: lesson.ordinal })}
                    </span>
                    <span className="block">{lesson.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] opacity-80">
                      {lesson.has_video && (
                        <span className="inline-flex items-center gap-1">
                          <StIcon name="play" size={10} />
                          {lesson.video_duration_seconds !== null
                            ? `${Math.round(lesson.video_duration_seconds / 60)}′`
                            : ''}
                        </span>
                      )}
                      {lesson.quiz_assessment_id !== null && (
                        <span className="inline-flex items-center gap-1">
                          <StIcon name="pencil" size={10} />
                          {t('lessonHasQuiz')}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </StCard>
    </div>
  );
}
