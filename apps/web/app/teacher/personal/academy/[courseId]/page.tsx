import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { CourseDetail } from '@studyteach/contracts';

import { StCard } from '@/components/st';
import { CoursePlayer } from '@/components/teacher/academy/CoursePlayer';
import { getCourseServer } from '@/lib/api/teacher-academy';
import { ApiError } from '@/lib/api/base';

// Teacher Academy course player (E-025). Server component: fetches the
// full CourseDetail (syllabus + transcripts) on the Node server with the
// HttpOnly session cookie forwarded, then hands it to the client player so
// the first paint is server-rendered (3G budget).

export const dynamic = 'force-dynamic';

export default async function TeacherAcademyCoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const courseId = Number(params.courseId);
  if (!Number.isInteger(courseId) || courseId <= 0) return notFound();

  const cookieHeader = cookies().toString();

  let course: CourseDetail;
  try {
    course = await getCourseServer(courseId, cookieHeader);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return notFound();
    const t = await getTranslations('teacher.academy');
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <StCard padding="lg">
          <p className="text-sm" style={{ color: 'var(--st-cinnabar)' }}>
            {t('loadError')}
          </p>
        </StCard>
      </main>
    );
  }

  return <CoursePlayer course={course} />;
}
