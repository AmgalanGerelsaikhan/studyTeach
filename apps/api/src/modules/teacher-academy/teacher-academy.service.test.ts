/**
 * Integration — Teacher Academy (E-025).
 * Real PG. Builds a self-contained TEST-TA- course + teacher, then exercises
 * enroll idempotency, lesson-completion idempotency, and MC auto-grading.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { AssessmentService } from './assessment.service';
import { EnrollmentService } from './enrollment.service';

interface Fixture {
  courseId: number;
  lessonId: number;
  otherLessonId: number;
  quizAssessmentId: number;
}

async function createTeacher(db: Db): Promise<number> {
  const suffix = randomUUID().slice(0, 8);
  const phone = `TEST-TA-${suffix}`;
  const { rows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'TEACHER'::user_role_enum, 'TEST-TA-ORG', 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`],
  );
  return rows[0]!.user_id;
}

/** A PUBLISHED course with 2 lessons; lesson 1 carries a 2-MC LESSON_QUIZ. */
async function createCourse(db: Db): Promise<Fixture> {
  const suffix = randomUUID().slice(0, 8);
  const { rows: courseRows } = await db.query<{ course_id: number }>(
    `INSERT INTO academy_courses
       (title, subject, grade_min, grade_max, language_track,
        cpd_credits, estimated_minutes, summary, status)
     VALUES ($1, 'pedagogy', 1, 12, 'GENERAL'::academy_language_track,
             3, 120, 'TEST-TA курс', 'PUBLISHED'::academy_course_status)
     RETURNING course_id`,
    [`TEST-TA-COURSE-${suffix}`],
  );
  const courseId = courseRows[0]!.course_id;

  const { rows: lessonRows } = await db.query<{ lesson_id: number }>(
    `INSERT INTO academy_lessons (course_id, ordinal, title, transcript_mn)
     VALUES ($1, 1, 'TEST-TA хичээл 1', 'Тест хичээлийн бичвэр')
     RETURNING lesson_id`,
    [courseId],
  );
  const lessonId = lessonRows[0]!.lesson_id;

  const { rows: otherLessonRows } = await db.query<{ lesson_id: number }>(
    `INSERT INTO academy_lessons (course_id, ordinal, title, transcript_mn)
     VALUES ($1, 2, 'TEST-TA хичээл 2', 'Тест хичээлийн бичвэр 2')
     RETURNING lesson_id`,
    [courseId],
  );
  const otherLessonId = otherLessonRows[0]!.lesson_id;

  const { rows: assessmentRows } = await db.query<{ assessment_id: number }>(
    `INSERT INTO academy_assessments (course_id, lesson_id, kind, title, pass_threshold)
     VALUES ($1, $2, 'LESSON_QUIZ'::academy_assessment_kind, 'TEST-TA шалгалт', 75)
     RETURNING assessment_id`,
    [courseId, lessonId],
  );
  const quizAssessmentId = assessmentRows[0]!.assessment_id;

  // Q1 (MC, correct index 1), Q2 (MC, correct index 0). Each worth 1 point.
  await db.query(
    `INSERT INTO academy_assessment_questions
       (assessment_id, ordinal, prompt, kind, choices, answer_key, points)
     VALUES
       ($1, 1, 'Асуулт 1', 'MULTIPLE_CHOICE'::academy_question_kind,
        '["буруу","зөв","буруу"]'::jsonb, '[1]'::jsonb, 1),
       ($1, 2, 'Асуулт 2', 'MULTIPLE_CHOICE'::academy_question_kind,
        '["зөв","буруу"]'::jsonb, '[0]'::jsonb, 1)`,
    [quizAssessmentId],
  );

  return { courseId, lessonId, otherLessonId, quizAssessmentId };
}

describe('Teacher Academy module (integration)', () => {
  let db: Db;
  let enrollments: EnrollmentService;
  let assessments: AssessmentService;
  let fixture: Fixture;

  beforeAll(async () => {
    db = new Db(loadEnv());
    enrollments = new EnrollmentService(db);
    assessments = new AssessmentService(db);
    fixture = await createCourse(db);
  });

  const wipeTeachers = async () => {
    // academy_enrollments cascades from users; lesson_completions + submissions
    // cascade from enrollments — deleting the test users clears the rest.
    await db.query(`DELETE FROM users WHERE phone_number LIKE 'TEST-TA-%'`);
  };

  afterAll(async () => {
    await wipeTeachers();
    await db.query(`DELETE FROM academy_courses WHERE title LIKE 'TEST-TA-%'`);
    await db.end();
  });

  beforeEach(async () => {
    await wipeTeachers();
  });

  it('enroll is idempotent on (course_id, teacher_user_id)', async () => {
    const teacherId = await createTeacher(db);
    const first = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    expect(first.replayed).toBe(false);
    expect(first.course_id).toBe(fixture.courseId);
    expect(first.mode).toBe('SELF_PACED');

    const second = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    expect(second.enrollment_id).toBe(first.enrollment_id);
    expect(second.replayed).toBe(true);
  });

  it('lesson completion is idempotent on (enrollment, lesson)', async () => {
    const teacherId = await createTeacher(db);
    await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });

    const first = await enrollments.completeLesson({
      lessonId: fixture.lessonId,
      teacherUserId: teacherId,
      watchSeconds: 90,
    });
    expect(first.replayed).toBe(false);
    expect(first.progress.completed).toBe(1);
    expect(first.progress.total).toBe(2);

    const second = await enrollments.completeLesson({
      lessonId: fixture.lessonId,
      teacherUserId: teacherId,
      watchSeconds: 120,
    });
    expect(second.replayed).toBe(true);
    // Replay must not double-count the completion.
    expect(second.progress.completed).toBe(1);
  });

  it('rejects lesson completion when the teacher is not enrolled', async () => {
    const teacherId = await createTeacher(db);
    await expect(
      enrollments.completeLesson({
        lessonId: fixture.lessonId,
        teacherUserId: teacherId,
        watchSeconds: 10,
      }),
    ).rejects.toThrow(/enroll in the course/);
  });

  it('LESSON_QUIZ auto-grades multiple-choice answers correctly', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });

    // Both answers correct → score 100, passed.
    const allCorrect = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await answerKeyFor(db, fixture.quizAssessmentId, true),
    });
    expect(allCorrect.score).toBe(100);
    expect(allCorrect.passed).toBe(true);
    expect(allCorrect.replayed).toBe(false);
    expect(allCorrect.results.every((r) => r.correct === true)).toBe(true);
  });

  it('LESSON_QUIZ scores a half-correct submission below the pass threshold', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });

    // Only Q1 correct → 1 of 2 points → 50, below the 75 threshold.
    const partial = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await answerKeyFor(db, fixture.quizAssessmentId, false),
    });
    expect(partial.score).toBe(50);
    expect(partial.passed).toBe(false);
  });

  it('assessment submit is idempotent and carries the replayed flag', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    const answers = await answerKeyFor(db, fixture.quizAssessmentId, true);

    const first = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers,
    });
    expect(first.replayed).toBe(false);

    const second = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers,
    });
    expect(second.submission_id).toBe(first.submission_id);
    expect(second.replayed).toBe(true);
    // Replay returns the persisted score unchanged.
    expect(second.score).toBe(first.score);
  });

  it('replay reports the persisted result, ignoring different resubmitted answers', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });

    // First submission: all correct → persisted score 100, all results correct.
    const first = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await answerKeyFor(db, fixture.quizAssessmentId, true),
    });
    expect(first.score).toBe(100);

    // Resubmit with a half-wrong set — must be ignored. The replay reports the
    // persisted 100, and per-question results must match the stored submission
    // (all correct), not the resubmitted answers.
    const replay = await assessments.submit({
      assessmentId: fixture.quizAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await answerKeyFor(db, fixture.quizAssessmentId, false),
    });
    expect(replay.replayed).toBe(true);
    expect(replay.score).toBe(100);
    expect(replay.passed).toBe(true);
    expect(replay.results.every((r) => r.correct === true)).toBe(true);
  });

  it('get assessment never exposes the answer key', async () => {
    const assessment = await assessments.get(fixture.quizAssessmentId);
    expect(assessment.questions.length).toBe(2);
    for (const q of assessment.questions) {
      expect(Object.keys(q)).not.toContain('answer_key');
    }
  });
});

/**
 * Builds an answers map for the test quiz. `allCorrect=true` answers every
 * question with its key; `false` answers only Q1 correctly (Q2 wrong) so the
 * submission lands at 50%.
 */
async function answerKeyFor(
  db: Db,
  assessmentId: number,
  allCorrect: boolean,
): Promise<Record<string, number>> {
  const { rows } = await db.query<{ question_id: number; ordinal: number; answer_key: number[] }>(
    `SELECT question_id, ordinal, answer_key
       FROM academy_assessment_questions
      WHERE assessment_id = $1
      ORDER BY ordinal ASC`,
    [assessmentId],
  );
  const answers: Record<string, number> = {};
  for (const row of rows) {
    const correctIndex = row.answer_key[0]!;
    if (allCorrect || row.ordinal === 1) {
      answers[String(row.question_id)] = correctIndex;
    } else {
      // Deliberately wrong: pick any index other than the correct one.
      answers[String(row.question_id)] = correctIndex === 0 ? 1 : 0;
    }
  }
  return answers;
}
