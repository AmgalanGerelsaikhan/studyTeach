import 'dotenv/config';

import { Pool } from 'pg';

import { loadEnv } from '../../../lib/config/env';

import { ACADEMY_COURSES, type SeedQuestion } from './fixtures';

/**
 * Teacher Academy ingest CLI (E-025, PRD §4.5).
 *
 *   pnpm --filter @studyteach/api ingest:academy
 *
 * Idempotent + re-runnable. Upserts off the natural keys in migration 0014:
 *   - academy_courses              ON CONFLICT (title)
 *   - academy_lessons              ON CONFLICT (course_id, ordinal)
 *   - academy_assessments          one FINAL per course / one quiz per lesson
 *     (the migration's partial UNIQUE indexes); we look up + UPDATE-or-INSERT.
 *   - academy_assessment_questions ON CONFLICT (assessment_id, ordinal)
 *
 * Course content is content-ops data, not org-scoped — the catalog is global.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  try {
    let courseCount = 0;
    let lessonCount = 0;
    let assessmentCount = 0;
    let questionCount = 0;

    for (const course of ACADEMY_COURSES) {
      const { rows: courseRows } = await pool.query<{ course_id: number }>(
        `INSERT INTO academy_courses
           (title, subject, grade_min, grade_max, methodology, language_track,
            cpd_credits, estimated_minutes, summary, status)
         VALUES ($1, $2, $3, $4, $5, $6::academy_language_track, $7, $8, $9,
                 'PUBLISHED'::academy_course_status)
         ON CONFLICT (title) DO UPDATE
           SET subject           = EXCLUDED.subject,
               grade_min         = EXCLUDED.grade_min,
               grade_max         = EXCLUDED.grade_max,
               methodology       = EXCLUDED.methodology,
               language_track    = EXCLUDED.language_track,
               cpd_credits       = EXCLUDED.cpd_credits,
               estimated_minutes = EXCLUDED.estimated_minutes,
               summary           = EXCLUDED.summary,
               status            = EXCLUDED.status
         RETURNING course_id`,
        [
          course.title,
          course.subject,
          course.grade_min,
          course.grade_max,
          course.methodology,
          course.language_track,
          course.cpd_credits,
          course.estimated_minutes,
          course.summary,
        ],
      );
      const courseId = courseRows[0]!.course_id;
      courseCount += 1;

      for (const lesson of course.lessons) {
        const { rows: lessonRows } = await pool.query<{ lesson_id: number }>(
          `INSERT INTO academy_lessons
             (course_id, ordinal, title, video_uid, video_duration_seconds, transcript_mn)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (course_id, ordinal) DO UPDATE
             SET title                  = EXCLUDED.title,
                 video_uid              = EXCLUDED.video_uid,
                 video_duration_seconds = EXCLUDED.video_duration_seconds,
                 transcript_mn          = EXCLUDED.transcript_mn
           RETURNING lesson_id`,
          [
            courseId,
            lesson.ordinal,
            lesson.title,
            lesson.video_uid,
            lesson.video_duration_seconds,
            lesson.transcript_mn,
          ],
        );
        const lessonId = lessonRows[0]!.lesson_id;
        lessonCount += 1;

        // Embedded LESSON_QUIZ — one per lesson (partial UNIQUE index on lesson_id).
        const quizId = await upsertAssessment(pool, {
          courseId,
          lessonId,
          kind: 'LESSON_QUIZ',
          title: lesson.quiz.title,
          passThreshold: lesson.quiz.pass_threshold,
        });
        assessmentCount += 1;
        questionCount += await upsertQuestions(pool, quizId, lesson.quiz.questions);
      }

      // Course-level FINAL — one per course (partial UNIQUE index on course_id).
      const finalId = await upsertAssessment(pool, {
        courseId,
        lessonId: null,
        kind: 'FINAL',
        title: course.final.title,
        passThreshold: course.final.pass_threshold,
      });
      assessmentCount += 1;
      questionCount += await upsertQuestions(pool, finalId, course.final.questions);
    }

    console.warn(
      `[ingest:academy] upserted ${courseCount} courses · ${lessonCount} lessons · ` +
        `${assessmentCount} assessments · ${questionCount} questions`,
    );
  } finally {
    await pool.end();
  }
}

/**
 * Upserts a single assessment. The migration's UNIQUE constraints are partial
 * indexes (WHERE kind = ...), so ON CONFLICT cannot target them by column list.
 * We instead SELECT the existing row and UPDATE, else INSERT — idempotent.
 */
async function upsertAssessment(
  pool: Pool,
  input: {
    courseId: number;
    lessonId: number | null;
    kind: 'LESSON_QUIZ' | 'FINAL';
    title: string;
    passThreshold: number;
  },
): Promise<number> {
  const lookup =
    input.kind === 'FINAL'
      ? await pool.query<{ assessment_id: number }>(
          `SELECT assessment_id FROM academy_assessments
            WHERE course_id = $1 AND kind = 'FINAL'`,
          [input.courseId],
        )
      : await pool.query<{ assessment_id: number }>(
          `SELECT assessment_id FROM academy_assessments
            WHERE lesson_id = $1 AND kind = 'LESSON_QUIZ'`,
          [input.lessonId],
        );

  const existing = lookup.rows[0];
  if (existing) {
    await pool.query(
      `UPDATE academy_assessments
          SET title = $2, pass_threshold = $3
        WHERE assessment_id = $1`,
      [existing.assessment_id, input.title, input.passThreshold],
    );
    return existing.assessment_id;
  }

  const { rows } = await pool.query<{ assessment_id: number }>(
    `INSERT INTO academy_assessments (course_id, lesson_id, kind, title, pass_threshold)
     VALUES ($1, $2, $3::academy_assessment_kind, $4, $5)
     RETURNING assessment_id`,
    [input.courseId, input.lessonId, input.kind, input.title, input.passThreshold],
  );
  return rows[0]!.assessment_id;
}

/** Upserts an assessment's questions on (assessment_id, ordinal). */
async function upsertQuestions(
  pool: Pool,
  assessmentId: number,
  questions: readonly SeedQuestion[],
): Promise<number> {
  for (const q of questions) {
    await pool.query(
      `INSERT INTO academy_assessment_questions
         (assessment_id, ordinal, prompt, kind, choices, answer_key, points)
       VALUES ($1, $2, $3, $4::academy_question_kind, $5::jsonb, $6::jsonb, $7)
       ON CONFLICT (assessment_id, ordinal) DO UPDATE
         SET prompt     = EXCLUDED.prompt,
             kind       = EXCLUDED.kind,
             choices    = EXCLUDED.choices,
             answer_key = EXCLUDED.answer_key,
             points     = EXCLUDED.points`,
      [
        assessmentId,
        q.ordinal,
        q.prompt,
        q.kind,
        JSON.stringify(q.choices),
        JSON.stringify(q.answer_key),
        q.points,
      ],
    );
  }
  return questions.length;
}

main().catch((err: unknown) => {
  console.error('[ingest:academy] failed:', err);
  process.exit(1);
});
