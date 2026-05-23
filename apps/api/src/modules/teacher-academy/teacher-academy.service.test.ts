/**
 * Integration — Teacher Academy (E-025/E-026).
 * Real PG. Builds a self-contained TEST-TA- course + teacher, then exercises
 * enroll idempotency, lesson-completion idempotency, MC auto-grading,
 * FINAL grading, and badge issuance + transcript RBAC.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';

import { ForbiddenException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AuditService } from '../../lib/audit/audit.service';
import { loadEnv } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';

import { AssessmentService } from './assessment.service';
import { CertificationService } from './certification.service';
import { EnrollmentService } from './enrollment.service';

interface Fixture {
  courseId: number;
  lessonId: number;
  otherLessonId: number;
  quizAssessmentId: number;
  finalAssessmentId: number;
  finalShortAnswerKey: string;
}

async function createTeacher(db: Db, orgCode = 'TEST-TA-ORG'): Promise<number> {
  const suffix = randomUUID().slice(0, 8);
  const phone = `TEST-TA-${suffix}`;
  const { rows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'TEACHER'::user_role_enum, $3, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`, orgCode],
  );
  return rows[0]!.user_id;
}

async function createSchoolAdmin(db: Db, orgCode: string): Promise<number> {
  // phone_number is VARCHAR(20); the wipeTeachers LIKE filter keys off
  // 'TEST-TA-' so use that prefix + a short suffix.
  const suffix = randomUUID().slice(0, 6);
  const phone = `TEST-TA-A${suffix}`;
  const { rows } = await db.query<{ user_id: number }>(
    `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
     VALUES ($1, $2, 'x', 'SCHOOL_ADMIN'::user_role_enum, $3, 'mn-Cyrl')
     RETURNING user_id`,
    [phone, `${phone}@test.local`, orgCode],
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

  // Course-level FINAL — 2 MC (1pt each) + 1 SHORT_ANSWER with concrete key
  // (1pt). Acing all three → 100; MC-only correct → 67% (still ≥ 65). The
  // SHORT_ANSWER answer_key is non-ASCII Cyrillic to exercise NFC + locale
  // case-fold normalization in the grader.
  const finalShortAnswerKey = 'Шуурхай үнэлгээ';
  const { rows: finalAssessmentRows } = await db.query<{ assessment_id: number }>(
    `INSERT INTO academy_assessments (course_id, lesson_id, kind, title, pass_threshold)
     VALUES ($1, NULL, 'FINAL'::academy_assessment_kind, 'TEST-TA эцсийн', 65)
     RETURNING assessment_id`,
    [courseId],
  );
  const finalAssessmentId = finalAssessmentRows[0]!.assessment_id;

  await db.query(
    `INSERT INTO academy_assessment_questions
       (assessment_id, ordinal, prompt, kind, choices, answer_key, points)
     VALUES
       ($1, 1, 'Эцсийн асуулт 1', 'MULTIPLE_CHOICE'::academy_question_kind,
        '["буруу","зөв","буруу"]'::jsonb, '[1]'::jsonb, 1),
       ($1, 2, 'Эцсийн асуулт 2', 'MULTIPLE_CHOICE'::academy_question_kind,
        '["зөв","буруу"]'::jsonb, '[0]'::jsonb, 1),
       ($1, 3, 'Эцсийн богино хариулт', 'SHORT_ANSWER'::academy_question_kind,
        '[]'::jsonb, $2::jsonb, 1)`,
    [finalAssessmentId, JSON.stringify([finalShortAnswerKey])],
  );

  return {
    courseId,
    lessonId,
    otherLessonId,
    quizAssessmentId,
    finalAssessmentId,
    finalShortAnswerKey,
  };
}

/** Marks every lesson in the fixture course complete for an enrollment. */
async function completeAllLessons(
  enrollments: EnrollmentService,
  fixture: Fixture,
  teacherUserId: number,
): Promise<void> {
  await enrollments.completeLesson({ lessonId: fixture.lessonId, teacherUserId, watchSeconds: 60 });
  await enrollments.completeLesson({
    lessonId: fixture.otherLessonId,
    teacherUserId,
    watchSeconds: 60,
  });
}

/** Builds answers for the FINAL: all MC + optional short answer. */
async function finalAnswers(
  db: Db,
  fixture: Fixture,
  withShortAnswer: string | null,
): Promise<Record<string, number | string>> {
  const { rows } = await db.query<{ question_id: number; ordinal: number; kind: string }>(
    `SELECT question_id, ordinal, kind::text AS kind
       FROM academy_assessment_questions
      WHERE assessment_id = $1
      ORDER BY ordinal ASC`,
    [fixture.finalAssessmentId],
  );
  const answers: Record<string, number | string> = {};
  for (const r of rows) {
    if (r.kind === 'MULTIPLE_CHOICE') {
      answers[String(r.question_id)] = r.ordinal === 1 ? 1 : 0;
    } else if (withShortAnswer !== null) {
      answers[String(r.question_id)] = withShortAnswer;
    }
  }
  return answers;
}

describe('Teacher Academy module (integration)', () => {
  let db: Db;
  let enrollments: EnrollmentService;
  let assessments: AssessmentService;
  let certifications: CertificationService;
  let fixture: Fixture;

  beforeAll(async () => {
    db = new Db(loadEnv());
    enrollments = new EnrollmentService(db);
    assessments = new AssessmentService(db);
    certifications = new CertificationService(db, new AuditService(db));
    fixture = await createCourse(db);
  });

  const wipeTeachers = async () => {
    // academy_certifications cascades from users; enrollments cascade from
    // users too — lesson_completions + submissions cascade from enrollments.
    // audit_log is append-only (migration 0002 triggers), so its rows persist;
    // assertions look up the rows by the unique per-test actor_user_id.
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

  // ── E-026 — FINAL grading + badge issuance ─────────────────────────────────

  it('FINAL grades MC and matches Cyrillic SHORT_ANSWER after normalization', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });

    // Submit FINAL with all MC correct + short answer differing in case and
    // surrounding whitespace from the seeded key. NFC + locale lowercase + trim
    // must match.
    const result = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, `  ${fixture.finalShortAnswerKey.toUpperCase()}  `),
    });
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.every((r) => r.correct === true)).toBe(true);
  });

  it('FINAL with empty SHORT_ANSWER key defers that question and excludes its points', async () => {
    // Create a one-off course with a FINAL whose SHORT_ANSWER has no answer_key.
    const suffix = randomUUID().slice(0, 8);
    const { rows: courseRows } = await db.query<{ course_id: number }>(
      `INSERT INTO academy_courses
         (title, subject, grade_min, grade_max, language_track,
          cpd_credits, estimated_minutes, summary, status)
       VALUES ($1, 'pedagogy', 1, 12, 'GENERAL'::academy_language_track,
               2, 60, 'TEST-TA defer', 'PUBLISHED'::academy_course_status)
       RETURNING course_id`,
      [`TEST-TA-DEFER-${suffix}`],
    );
    const deferCourseId = courseRows[0]!.course_id;
    const { rows: lessonRows } = await db.query<{ lesson_id: number }>(
      `INSERT INTO academy_lessons (course_id, ordinal, title, transcript_mn)
       VALUES ($1, 1, 'L', 'T') RETURNING lesson_id`,
      [deferCourseId],
    );
    const deferLessonId = lessonRows[0]!.lesson_id;
    const { rows: finalRows } = await db.query<{ assessment_id: number }>(
      `INSERT INTO academy_assessments (course_id, lesson_id, kind, title, pass_threshold)
       VALUES ($1, NULL, 'FINAL'::academy_assessment_kind, 'D', 65) RETURNING assessment_id`,
      [deferCourseId],
    );
    const deferFinalId = finalRows[0]!.assessment_id;
    await db.query(
      `INSERT INTO academy_assessment_questions
         (assessment_id, ordinal, prompt, kind, choices, answer_key, points)
       VALUES
         ($1, 1, 'MC', 'MULTIPLE_CHOICE'::academy_question_kind,
          '["a","b"]'::jsonb, '[0]'::jsonb, 1),
         ($1, 2, 'SA open', 'SHORT_ANSWER'::academy_question_kind,
          '[]'::jsonb, '[]'::jsonb, 5)`,
      [deferFinalId],
    );

    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: deferCourseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await enrollments.completeLesson({
      lessonId: deferLessonId,
      teacherUserId: teacherId,
      watchSeconds: 1,
    });

    // Q1 MC correct; Q2 SHORT_ANSWER deferred. Score should reflect 1/1 MC, the
    // SHORT_ANSWER's 5 points are excluded → 100%.
    const { rows: qRows } = await db.query<{ question_id: number; ordinal: number }>(
      `SELECT question_id, ordinal FROM academy_assessment_questions
        WHERE assessment_id = $1 ORDER BY ordinal ASC`,
      [deferFinalId],
    );
    const mcQid = qRows.find((r) => r.ordinal === 1)!.question_id;
    const saQid = qRows.find((r) => r.ordinal === 2)!.question_id;

    const result = await assessments.submit({
      assessmentId: deferFinalId,
      enrollmentId: enrollment.enrollment_id,
      answers: { [String(mcQid)]: 0, [String(saQid)]: 'free-form essay text' },
    });
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.results.find((r) => r.question_id === saQid)?.correct).toBeNull();
    expect(result.certification).toBeDefined();
    // Course cleanup happens in afterAll (LIKE 'TEST-TA-%') — the FK to
    // academy_enrollments is ON DELETE RESTRICT, so we leave it for the user
    // cascade in the next beforeEach to clear the enrollment first.
  });

  it('FINAL pass + all lessons complete issues a Certification', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await completeAllLessons(enrollments, fixture, teacherId);

    const result = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });
    expect(result.passed).toBe(true);
    expect(result.certification).toBeDefined();
    expect(result.certification?.score).toBe(100);
    expect(result.certification?.cpd_credits).toBe(3);
    expect(result.certification?.moe_endorsed).toBe(false);
  });

  it('FINAL pass without all lessons does NOT issue a badge', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    // Only lesson 1 complete — lesson 2 still outstanding.
    await enrollments.completeLesson({
      lessonId: fixture.lessonId,
      teacherUserId: teacherId,
      watchSeconds: 30,
    });

    const result = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });
    expect(result.passed).toBe(true);
    expect(result.certification).toBeUndefined();

    const { rows } = await db.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM academy_certifications WHERE teacher_user_id = $1`,
      [teacherId],
    );
    expect(Number(rows[0]!.n)).toBe(0);
  });

  it('FINAL re-submit returns the same certification (idempotent)', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await completeAllLessons(enrollments, fixture, teacherId);

    const first = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });
    expect(first.certification).toBeDefined();
    const firstCertId = first.certification!.certification_id;

    const replay = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });
    expect(replay.replayed).toBe(true);
    expect(replay.certification?.certification_id).toBe(firstCertId);
  });

  it('FINAL below pass_threshold does not issue a badge', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await completeAllLessons(enrollments, fixture, teacherId);

    // Wrong MC1 (1 → 0), MC2 still correct, no short answer → 1/3 → 33%.
    const { rows } = await db.query<{ question_id: number; ordinal: number; kind: string }>(
      `SELECT question_id, ordinal, kind::text AS kind FROM academy_assessment_questions
        WHERE assessment_id = $1 ORDER BY ordinal ASC`,
      [fixture.finalAssessmentId],
    );
    const answers: Record<string, number | string> = {};
    for (const r of rows) {
      if (r.kind === 'MULTIPLE_CHOICE') answers[String(r.question_id)] = r.ordinal === 1 ? 0 : 0;
    }
    const result = await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers,
    });
    expect(result.passed).toBe(false);
    expect(result.certification).toBeUndefined();
  });

  // ── E-026 — Transcript RBAC + audit ────────────────────────────────────────

  it('own transcript aggregates totals over issued certifications', async () => {
    const teacherId = await createTeacher(db);
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await completeAllLessons(enrollments, fixture, teacherId);
    await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });

    const transcript = await certifications.ownTranscript(teacherId);
    expect(transcript.teacher_user_id).toBe(teacherId);
    expect(transcript.total_courses_completed).toBe(1);
    expect(transcript.total_cpd_credits).toBe(3);
    expect(transcript.moe_endorsed_credits).toBe(0);
    expect(transcript.certifications).toHaveLength(1);
  });

  it('school-admin in same org can read teacher transcript and audit is logged', async () => {
    const teacherId = await createTeacher(db, 'TEST-TA-ORG');
    const adminId = await createSchoolAdmin(db, 'TEST-TA-ORG');
    const enrollment = await enrollments.enroll({
      courseId: fixture.courseId,
      teacherUserId: teacherId,
      organizationCode: 'TEST-TA-ORG',
    });
    await completeAllLessons(enrollments, fixture, teacherId);
    await assessments.submit({
      assessmentId: fixture.finalAssessmentId,
      enrollmentId: enrollment.enrollment_id,
      answers: await finalAnswers(db, fixture, fixture.finalShortAnswerKey),
    });

    const transcript = await certifications.transcriptForRequester({
      targetTeacherUserId: teacherId,
      requesterUserId: adminId,
      requesterRole: 'SCHOOL_ADMIN',
      requesterOrganizationCode: 'TEST-TA-ORG',
    });
    expect(transcript.certifications).toHaveLength(1);

    const { rows: audits } = await db.query<{ action: string; target_id: string | null }>(
      `SELECT action, target_id FROM audit_log
        WHERE actor_user_id = $1 AND action = 'cpd_transcript.read'`,
      [adminId],
    );
    expect(audits).toHaveLength(1);
    expect(audits[0]!.target_id).toBe(String(teacherId));
  });

  it('school-admin in different org cannot read teacher transcript and writes no audit', async () => {
    const teacherId = await createTeacher(db, 'TEST-TA-ORG');
    const adminId = await createSchoolAdmin(db, 'TEST-TA-OTHER-ORG');

    await expect(
      certifications.transcriptForRequester({
        targetTeacherUserId: teacherId,
        requesterUserId: adminId,
        requesterRole: 'SCHOOL_ADMIN',
        requesterOrganizationCode: 'TEST-TA-OTHER-ORG',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    const { rows: audits } = await db.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM audit_log
        WHERE actor_user_id = $1 AND action = 'cpd_transcript.read'`,
      [adminId],
    );
    expect(Number(audits[0]!.n)).toBe(0);
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
