import { cookies } from 'next/headers';
import type { CourseListResponse } from '@studyteach/contracts';

import { CourseCatalog } from '@/components/teacher/academy/CourseCatalog';
import { listCoursesServer, type CourseCatalogFilter } from '@/lib/api/teacher-academy';

// Teacher Academy catalog (E-025). Server component: it fetches the
// per-teacher course list on the Node server, forwarding the HttpOnly
// session cookie explicitly (CLAUDE.md constraint #8 — the cookie is never
// readable from client JS, so it must be threaded through here).

export const dynamic = 'force-dynamic';

function readFilter(
  searchParams: Record<string, string | string[] | undefined>,
): CourseCatalogFilter {
  const filter: CourseCatalogFilter = { limit: 24 };
  const subject = searchParams.subject;
  if (typeof subject === 'string' && subject) filter.subject = [subject];
  else if (Array.isArray(subject)) filter.subject = subject;

  const grade = searchParams.grade;
  if (typeof grade === 'string' && grade) {
    const g = Number(grade);
    if (Number.isInteger(g) && g >= 1 && g <= 12) filter.grade = g;
  }

  const methodology = searchParams.methodology;
  if (typeof methodology === 'string' && methodology) filter.methodology = methodology;

  const languageTrack = searchParams.language_track;
  if (typeof languageTrack === 'string' && languageTrack) filter.language_track = languageTrack;

  const cursor = searchParams.cursor;
  if (typeof cursor === 'string' && cursor) {
    const c = Number(cursor);
    if (Number.isInteger(c)) filter.cursor = c;
  }
  return filter;
}

export default async function TeacherAcademyPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cookieHeader = cookies().toString();
  const filter = readFilter(searchParams);

  let data: CourseListResponse | null = null;
  let error = false;
  try {
    data = await listCoursesServer(cookieHeader, filter);
  } catch {
    error = true;
  }

  return <CourseCatalog data={data} searchParams={searchParams} error={error} />;
}
