import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AcademyEnrollmentMode,
  CourseProgress,
  EnrollmentDescriptor,
  LessonCompleteResponse,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

/**
 * Teacher Academy enrollment + lesson-completion writes (E-025, PRD §4.5).
 *
 * Both writes are idempotent off the UNIQUE constraints in migration 0014:
 *   - academy_enrollments        UNIQUE (course_id, teacher_user_id)
 *   - academy_lesson_completions UNIQUE (enrollment_id, lesson_id)
 * A resubmission returns the existing row with `replayed: true`, mirroring the
 * olympiad RegistrationDescriptor contract.
 *
 * `organization_code` is snapshotted from the caller's RequestContext at enroll
 * time so the E-026 school-admin CPD transcript can scope by org even if the
 * teacher later moves schools.
 */
@Injectable()
export class EnrollmentService {
  constructor(private readonly db: Db) {}

  /** Idempotent enroll. Returns the existing row unchanged on resubmission. */
  async enroll(input: {
    courseId: number;
    teacherUserId: number;
    organizationCode: string | null;
  }): Promise<EnrollmentDescriptor> {
    const { rows: courseRows } = await this.db.query<{ course_id: number }>(
      `SELECT course_id FROM academy_courses
        WHERE course_id = $1 AND status = 'PUBLISHED'::academy_course_status`,
      [input.courseId],
    );
    if (!courseRows[0]) throw new NotFoundException('course not found');

    const { rows } = await this.db.query<{
      enrollment_id: number;
      course_id: number;
      mode: AcademyEnrollmentMode;
      enrolled_at: Date;
      replayed: boolean;
    }>(
      `INSERT INTO academy_enrollments (course_id, teacher_user_id, organization_code, mode)
       VALUES ($1, $2, $3, 'SELF_PACED'::academy_enrollment_mode)
       ON CONFLICT (course_id, teacher_user_id) DO UPDATE
         SET teacher_user_id = academy_enrollments.teacher_user_id
       RETURNING enrollment_id, course_id, mode, enrolled_at, (xmax <> 0) AS replayed`,
      [input.courseId, input.teacherUserId, input.organizationCode],
    );
    const row = rows[0];
    if (!row) throw new Error('enroll: INSERT returned no row');
    return {
      enrollment_id: row.enrollment_id,
      course_id: row.course_id,
      mode: row.mode,
      enrolled_at: row.enrolled_at.toISOString(),
      replayed: row.replayed,
    };
  }

  /**
   * Idempotent lesson completion. The caller must be enrolled in the course
   * that owns this lesson; otherwise ConflictException.
   */
  async completeLesson(input: {
    lessonId: number;
    teacherUserId: number;
    watchSeconds: number;
  }): Promise<LessonCompleteResponse> {
    const { rows: lessonRows } = await this.db.query<{ course_id: number }>(
      `SELECT course_id FROM academy_lessons WHERE lesson_id = $1`,
      [input.lessonId],
    );
    const lesson = lessonRows[0];
    if (!lesson) throw new NotFoundException('lesson not found');

    const { rows: enrollmentRows } = await this.db.query<{ enrollment_id: number }>(
      `SELECT enrollment_id FROM academy_enrollments
        WHERE course_id = $1 AND teacher_user_id = $2`,
      [lesson.course_id, input.teacherUserId],
    );
    const enrollment = enrollmentRows[0];
    if (!enrollment) {
      throw new ConflictException('enroll in the course before completing a lesson');
    }

    const { rows } = await this.db.query<{
      lesson_id: number;
      completed_at: Date;
      replayed: boolean;
    }>(
      `INSERT INTO academy_lesson_completions (enrollment_id, lesson_id, watch_seconds)
       VALUES ($1, $2, $3)
       ON CONFLICT (enrollment_id, lesson_id) DO UPDATE
         SET enrollment_id = academy_lesson_completions.enrollment_id
       RETURNING lesson_id, completed_at, (xmax <> 0) AS replayed`,
      [enrollment.enrollment_id, input.lessonId, input.watchSeconds],
    );
    const row = rows[0];
    if (!row) throw new Error('completeLesson: INSERT returned no row');

    const progress = await this.progress(lesson.course_id, enrollment.enrollment_id);
    return {
      lesson_id: row.lesson_id,
      completed_at: row.completed_at.toISOString(),
      replayed: row.replayed,
      progress,
    };
  }

  /** completed = distinct lesson completions; total = lessons in the course. */
  async progress(courseId: number, enrollmentId: number): Promise<CourseProgress> {
    const { rows } = await this.db.query<{ completed: string; total: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM academy_lesson_completions
           WHERE enrollment_id = $2) AS completed,
         (SELECT COUNT(*)::text FROM academy_lessons
           WHERE course_id = $1)     AS total`,
      [courseId, enrollmentId],
    );
    const row = rows[0];
    return {
      completed: Number(row?.completed ?? 0),
      total: Number(row?.total ?? 0),
    };
  }
}
