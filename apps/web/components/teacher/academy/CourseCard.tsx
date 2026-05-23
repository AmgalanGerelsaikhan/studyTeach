import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { CourseCard as CourseCardModel } from '@studyteach/contracts';

import { StCard, StChip, StIcon, StProgress } from '@/components/st';

/**
 * Catalog grid card. Server component — pure render off a `CourseCard`
 * contract object, no interactivity. Mirrors the prototype's course tile:
 * subject badge, grade range, duration, CPD credits, peer count, and the
 * caller's progress ("6/10 хичээл") when enrolled.
 */
export async function CourseCard({ course }: { course: CourseCardModel }) {
  const t = await getTranslations('teacher.academy');
  const enrolled = course.progress !== null;
  const progressPct =
    course.progress && course.progress.total > 0
      ? Math.round((course.progress.completed / course.progress.total) * 100)
      : 0;

  return (
    <StCard padding="md" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-1.5">
        <StChip tone="brass">{course.subject}</StChip>
        <StChip tone="default">
          {t('gradeRange', { min: course.grade_min, max: course.grade_max })}
        </StChip>
        {course.language_track !== 'GENERAL' && (
          <StChip tone="sky">
            <StIcon name="globe" size={11} />
            {t(`languageTrack.${course.language_track}`)}
          </StChip>
        )}
        {enrolled && (
          <StChip tone="moss">
            <StIcon name="check" size={11} />
            {t('enrolledBadge')}
          </StChip>
        )}
      </div>

      <h3 className="mt-2 font-display text-base font-bold" style={{ color: 'var(--st-soot)' }}>
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--st-ink-2)' }}>
        {course.summary}
      </p>
      {course.methodology && (
        <p
          className="mt-1 flex items-center gap-1 text-[11px]"
          style={{ color: 'var(--st-ink-3)' }}
        >
          <StIcon name="target" size={11} color="#836340" />
          {course.methodology}
        </p>
      )}

      <dl
        className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
        style={{ color: 'var(--st-ink-3)' }}
      >
        <div className="flex items-center gap-1">
          <StIcon name="book" size={12} color="#836340" />
          <dd>{t('lessonCount', { n: course.lesson_count })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <StIcon name="clock" size={12} color="#836340" />
          <dd>{t('minutes', { n: course.estimated_minutes })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <StIcon name="award" size={12} color="#836340" />
          <dd>{t('credits', { n: course.cpd_credits })}</dd>
        </div>
        <div className="flex items-center gap-1">
          <StIcon name="users" size={12} color="#836340" />
          <dd>{t('peers', { n: course.peer_count })}</dd>
        </div>
      </dl>

      {enrolled && course.progress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span style={{ color: 'var(--st-brass-dark)' }} className="font-semibold">
              {t('progressLabel', {
                done: course.progress.completed,
                total: course.progress.total,
              })}
            </span>
            <span style={{ color: 'var(--st-ink-3)' }}>{progressPct}%</span>
          </div>
          <StProgress value={progressPct} height={6} />
        </div>
      )}

      <div className="mt-auto pt-3">
        <Link
          href={`/teacher/personal/academy/${course.course_id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--st-ember)' }}
        >
          {t('openCourse')}
          <StIcon name="chevron_r" size={12} />
        </Link>
      </div>
    </StCard>
  );
}
