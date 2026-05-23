import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AcademyEnrollmentMode,
  AcademyFacets,
  AcademyLanguageTrack,
  Certification,
  CourseCard,
  CourseDetail,
  CourseListResponse,
  LessonContent,
  LessonSummary,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

export interface CourseListInput {
  subject?: string[];
  grade?: number;
  methodology?: string;
  language_track?: AcademyLanguageTrack;
  cursor?: number;
  limit: number;
}

interface CourseRow {
  course_id: number;
  title: string;
  subject: string;
  grade_min: number;
  grade_max: number;
  methodology: string | null;
  language_track: AcademyLanguageTrack;
  cpd_credits: string;
  estimated_minutes: number;
  summary: string;
}

/**
 * Teacher Academy catalog + syllabus reads (E-025, PRD §4.5).
 *
 * `academy_courses` is a GLOBAL national CPD catalog — like `olympiads`, it is
 * NOT org-scoped. Org separation lives on `academy_enrollments` instead, which
 * snapshots the enrolling teacher's organization_code.
 */
@Injectable()
export class CourseService {
  constructor(private readonly db: Db) {}

  /** Cursor-paginated catalog of PUBLISHED courses; cursor = last seen course_id. */
  async list(input: CourseListInput, teacherUserId: number): Promise<CourseListResponse> {
    const params: unknown[] = [];
    const where: string[] = [`status = 'PUBLISHED'::academy_course_status`];

    if (input.subject && input.subject.length > 0) {
      params.push(input.subject);
      where.push(`subject = ANY($${params.length}::text[])`);
    }
    if (input.grade !== undefined) {
      params.push(input.grade);
      where.push(`$${params.length}::int BETWEEN grade_min AND grade_max`);
    }
    if (input.methodology) {
      params.push(input.methodology);
      where.push(`methodology = $${params.length}`);
    }
    if (input.language_track) {
      params.push(input.language_track);
      where.push(`language_track = $${params.length}::academy_language_track`);
    }
    if (input.cursor !== undefined) {
      params.push(input.cursor);
      // Stable ascending pagination — cursor is "course_id greater than last seen".
      where.push(`course_id > $${params.length}`);
    }

    params.push(input.limit + 1); // fetch one extra to detect the next page
    const limitIdx = params.length;

    const { rows } = await this.db.query<CourseRow>(
      `SELECT course_id, title, subject, grade_min, grade_max, methodology,
              language_track, cpd_credits, estimated_minutes, summary
         FROM academy_courses
        WHERE ${where.join(' AND ')}
        ORDER BY course_id ASC
        LIMIT $${limitIdx}`,
      params,
    );

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;
    const items: CourseCard[] = [];

    for (const row of page) {
      const lessonCount = await this.lessonCount(row.course_id);
      const peerCount = await this.peerCount(row.course_id);
      const progress = await this.progressFor(row.course_id, teacherUserId, lessonCount);
      items.push({
        course_id: row.course_id,
        title: row.title,
        subject: row.subject,
        grade_min: row.grade_min,
        grade_max: row.grade_max,
        methodology: row.methodology,
        language_track: row.language_track,
        cpd_credits: Number(row.cpd_credits),
        estimated_minutes: row.estimated_minutes,
        summary: row.summary,
        lesson_count: lessonCount,
        peer_count: peerCount,
        progress,
      });
    }

    return {
      items,
      next_cursor: hasMore ? page[page.length - 1]!.course_id : null,
    };
  }

  /**
   * Distinct facet values present in the PUBLISHED corpus. Drives the catalog
   * filter dropdowns so adding a course with a new methodology surfaces in the
   * UI without a code change. Tiny query, no cursor — clients can fetch once.
   */
  async facets(): Promise<AcademyFacets> {
    const { rows } = await this.db.query<{
      subject: string | null;
      methodology: string | null;
      language_track: AcademyLanguageTrack;
    }>(
      `SELECT DISTINCT subject, methodology, language_track
         FROM academy_courses
        WHERE status = 'PUBLISHED'::academy_course_status`,
    );
    const subjects = new Set<string>();
    const methodologies = new Set<string>();
    const tracks = new Set<AcademyLanguageTrack>();
    for (const r of rows) {
      if (r.subject) subjects.add(r.subject);
      if (r.methodology) methodologies.add(r.methodology);
      tracks.add(r.language_track);
    }
    return {
      subjects: [...subjects].sort(),
      methodologies: [...methodologies].sort((a, b) => a.localeCompare(b, 'mn')),
      language_tracks: [...tracks].sort(),
    };
  }

  /** Full syllabus: lessons, lesson bodies, final assessment, caller's state. */
  async detail(courseId: number, teacherUserId: number): Promise<CourseDetail> {
    const { rows } = await this.db.query<CourseRow>(
      `SELECT course_id, title, subject, grade_min, grade_max, methodology,
              language_track, cpd_credits, estimated_minutes, summary
         FROM academy_courses
        WHERE course_id = $1 AND status = 'PUBLISHED'::academy_course_status`,
      [courseId],
    );
    const course = rows[0];
    if (!course) throw new NotFoundException('course not found');

    const enrollment = await this.enrollmentFor(courseId, teacherUserId);
    const lessons = await this.lessonSummaries(
      courseId,
      enrollment ? enrollment.enrollment_id : null,
    );
    const lessonContent = await this.lessonContents(courseId);
    const finalAssessmentId = await this.finalAssessmentId(courseId);
    const peerCount = await this.peerCount(courseId);
    const completed = lessons.filter((l) => l.completed).length;
    const callerCertification = await this.callerCertification(
      courseId,
      teacherUserId,
      course.title,
      course.subject,
      course.language_track,
    );

    return {
      course_id: course.course_id,
      title: course.title,
      subject: course.subject,
      grade_min: course.grade_min,
      grade_max: course.grade_max,
      methodology: course.methodology,
      language_track: course.language_track,
      cpd_credits: Number(course.cpd_credits),
      estimated_minutes: course.estimated_minutes,
      summary: course.summary,
      peer_count: peerCount,
      lessons,
      lesson_content: lessonContent,
      final_assessment_id: finalAssessmentId,
      enrollment: enrollment
        ? {
            enrollment_id: enrollment.enrollment_id,
            mode: enrollment.mode,
            enrolled_at: enrollment.enrolled_at.toISOString(),
          }
        : null,
      progress: { completed, total: lessons.length },
      caller_certification: callerCertification,
    };
  }

  /** Caller's CPD badge for this course, or null. Joined with academy_courses
   *  for the display fields the Certification contract requires. */
  private async callerCertification(
    courseId: number,
    teacherUserId: number,
    courseTitle: string,
    subject: string,
    languageTrack: AcademyLanguageTrack,
  ): Promise<Certification | null> {
    const { rows } = await this.db.query<{
      certification_id: number;
      score: number;
      cpd_credits: string;
      moe_endorsed: boolean;
      issued_at: Date;
    }>(
      `SELECT certification_id, score, cpd_credits, moe_endorsed, issued_at
         FROM academy_certifications
        WHERE course_id = $1 AND teacher_user_id = $2`,
      [courseId, teacherUserId],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      certification_id: row.certification_id,
      course_id: courseId,
      course_title: courseTitle,
      subject,
      language_track: languageTrack,
      score: row.score,
      cpd_credits: Number(row.cpd_credits),
      moe_endorsed: row.moe_endorsed,
      issued_at: row.issued_at.toISOString(),
    };
  }

  private async lessonCount(courseId: number): Promise<number> {
    const { rows } = await this.db.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM academy_lessons WHERE course_id = $1`,
      [courseId],
    );
    return Number(rows[0]?.n ?? 0);
  }

  /** Distinct teachers enrolled — the prototype's "peer count". */
  private async peerCount(courseId: number): Promise<number> {
    const { rows } = await this.db.query<{ n: string }>(
      `SELECT COUNT(DISTINCT teacher_user_id)::text AS n
         FROM academy_enrollments WHERE course_id = $1`,
      [courseId],
    );
    return Number(rows[0]?.n ?? 0);
  }

  private async progressFor(
    courseId: number,
    teacherUserId: number,
    lessonCount: number,
  ): Promise<CourseCard['progress']> {
    const enrollment = await this.enrollmentFor(courseId, teacherUserId);
    if (!enrollment) return null;
    const { rows } = await this.db.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
         FROM academy_lesson_completions WHERE enrollment_id = $1`,
      [enrollment.enrollment_id],
    );
    return { completed: Number(rows[0]?.n ?? 0), total: lessonCount };
  }

  private async enrollmentFor(
    courseId: number,
    teacherUserId: number,
  ): Promise<{
    enrollment_id: number;
    mode: AcademyEnrollmentMode;
    enrolled_at: Date;
  } | null> {
    const { rows } = await this.db.query<{
      enrollment_id: number;
      mode: AcademyEnrollmentMode;
      enrolled_at: Date;
    }>(
      `SELECT enrollment_id, mode, enrolled_at
         FROM academy_enrollments
        WHERE course_id = $1 AND teacher_user_id = $2`,
      [courseId, teacherUserId],
    );
    return rows[0] ?? null;
  }

  private async lessonSummaries(
    courseId: number,
    enrollmentId: number | null,
  ): Promise<LessonSummary[]> {
    const { rows } = await this.db.query<{
      lesson_id: number;
      ordinal: number;
      title: string;
      video_uid: string | null;
      video_duration_seconds: number | null;
      quiz_assessment_id: number | null;
      completed: boolean;
    }>(
      `SELECT l.lesson_id,
              l.ordinal,
              l.title,
              l.video_uid,
              l.video_duration_seconds,
              q.assessment_id AS quiz_assessment_id,
              CASE WHEN $2::int IS NULL THEN FALSE
                   ELSE c.completion_id IS NOT NULL END AS completed
         FROM academy_lessons l
         LEFT JOIN academy_assessments q
                ON q.lesson_id = l.lesson_id AND q.kind = 'LESSON_QUIZ'
         LEFT JOIN academy_lesson_completions c
                ON c.lesson_id = l.lesson_id AND c.enrollment_id = $2::int
        WHERE l.course_id = $1
        ORDER BY l.ordinal ASC`,
      [courseId, enrollmentId],
    );
    return rows.map((r) => ({
      lesson_id: r.lesson_id,
      ordinal: r.ordinal,
      title: r.title,
      has_video: r.video_uid !== null,
      video_duration_seconds: r.video_duration_seconds,
      quiz_assessment_id: r.quiz_assessment_id,
      completed: r.completed,
    }));
  }

  private async lessonContents(courseId: number): Promise<LessonContent[]> {
    const { rows: lessonRows } = await this.db.query<{
      lesson_id: number;
      transcript_mn: string;
    }>(
      `SELECT lesson_id, transcript_mn
         FROM academy_lessons WHERE course_id = $1 ORDER BY ordinal ASC`,
      [courseId],
    );
    const { rows: assetRows } = await this.db.query<{
      lesson_id: number;
      asset_id: number;
      kind: 'SLIDE' | 'PDF' | 'LINK';
      url: string;
      label: string;
    }>(
      `SELECT a.lesson_id, a.asset_id, a.kind, a.url, a.label
         FROM academy_lesson_assets a
         JOIN academy_lessons l ON l.lesson_id = a.lesson_id
        WHERE l.course_id = $1
        ORDER BY a.lesson_id ASC, a.ordinal ASC`,
      [courseId],
    );
    return lessonRows.map((l) => ({
      lesson_id: l.lesson_id,
      transcript_mn: l.transcript_mn,
      assets: assetRows
        .filter((a) => a.lesson_id === l.lesson_id)
        .map((a) => ({ asset_id: a.asset_id, kind: a.kind, url: a.url, label: a.label })),
    }));
  }

  private async finalAssessmentId(courseId: number): Promise<number | null> {
    const { rows } = await this.db.query<{ assessment_id: number }>(
      `SELECT assessment_id FROM academy_assessments
        WHERE course_id = $1 AND kind = 'FINAL'`,
      [courseId],
    );
    return rows[0]?.assessment_id ?? null;
  }
}
