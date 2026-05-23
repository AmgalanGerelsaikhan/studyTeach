import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Assessment,
  AssessmentKind,
  AssessmentQuestionKind,
  AssessmentSubmitResponse,
  Certification,
  QuestionResult,
} from '@studyteach/contracts';
import type { PoolClient } from 'pg';

import { Db } from '../../lib/db/pool';

interface QuestionGradingRow {
  question_id: number;
  ordinal: number;
  prompt: string;
  kind: AssessmentQuestionKind;
  choices: string[];
  answer_key: Array<number | string>;
  points: number;
}

interface GradedResult {
  /** Percent 0-100; null when no question contributed gradable points. */
  score: number | null;
  passed: boolean | null;
  results: QuestionResult[];
}

/**
 * Teacher Academy assessment read + submit (E-025/E-026, PRD §4.5).
 *
 * Read: questions are returned WITHOUT the answer_key — the key never leaves
 * the server.
 *
 * Submit is idempotent on (assessment_id, enrollment_id) per migration 0014;
 * a resubmission returns the stored submission with `replayed: true`.
 *
 *   - LESSON_QUIZ + FINAL auto-grade MULTIPLE_CHOICE against answer_key.
 *     score = round(earned_points / gradable_points * 100); passed = score >=
 *     pass_threshold. SHORT_ANSWER without an answer_key returns `correct: null`
 *     and its points are excluded from gradable_points (defer to manual rubric).
 *   - FINAL only: on a passing submission + all lessons complete, atomically
 *     issues a Certification (migration 0015). Re-passing returns the existing
 *     badge unchanged.
 */
@Injectable()
export class AssessmentService {
  constructor(private readonly db: Db) {}

  /** Returns the assessment with its questions — never the answer key. */
  async get(assessmentId: number): Promise<Assessment> {
    const { rows } = await this.db.query<{
      assessment_id: number;
      course_id: number;
      lesson_id: number | null;
      kind: AssessmentKind;
      title: string;
      pass_threshold: number;
    }>(
      `SELECT assessment_id, course_id, lesson_id, kind, title, pass_threshold
         FROM academy_assessments WHERE assessment_id = $1`,
      [assessmentId],
    );
    const assessment = rows[0];
    if (!assessment) throw new NotFoundException('assessment not found');

    const questions = await this.loadQuestions(assessmentId);
    return {
      assessment_id: assessment.assessment_id,
      course_id: assessment.course_id,
      lesson_id: assessment.lesson_id,
      kind: assessment.kind,
      title: assessment.title,
      pass_threshold: assessment.pass_threshold,
      questions: questions.map((q) => ({
        question_id: q.question_id,
        ordinal: q.ordinal,
        prompt: q.prompt,
        kind: q.kind,
        choices: q.choices,
        points: q.points,
      })),
    };
  }

  /**
   * Idempotent submit. LESSON_QUIZ + FINAL auto-grade; FINAL also attempts to
   * issue a Certification when the teacher passed AND finished every lesson.
   * The caller must own the enrollment used here (checked by the controller).
   *
   * Submission INSERT + certification INSERT run in one transaction so a badge
   * never points at a submission that never existed.
   */
  async submit(input: {
    assessmentId: number;
    enrollmentId: number;
    answers: Record<string, number | string>;
  }): Promise<AssessmentSubmitResponse> {
    const { rows } = await this.db.query<{
      assessment_id: number;
      course_id: number;
      kind: AssessmentKind;
      pass_threshold: number;
    }>(
      `SELECT assessment_id, course_id, kind, pass_threshold
         FROM academy_assessments WHERE assessment_id = $1`,
      [input.assessmentId],
    );
    const assessment = rows[0];
    if (!assessment) throw new NotFoundException('assessment not found');

    // The enrollment must belong to the same course as the assessment.
    const { rows: enrollmentRows } = await this.db.query<{
      course_id: number;
      teacher_user_id: number;
      organization_code: string | null;
    }>(
      `SELECT course_id, teacher_user_id, organization_code
         FROM academy_enrollments WHERE enrollment_id = $1`,
      [input.enrollmentId],
    );
    const enrollment = enrollmentRows[0];
    if (!enrollment) throw new NotFoundException('enrollment not found');
    if (enrollment.course_id !== assessment.course_id) {
      throw new ConflictException('enrollment is not for this assessment’s course');
    }

    const questions = await this.loadQuestions(input.assessmentId);
    const graded = this.grade(questions, input.answers, assessment.pass_threshold);

    return this.db.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const { rows: submissionRows } = await client.query<{
          submission_id: number;
          score: number | null;
          passed: boolean | null;
          answers: Record<string, number | string>;
          replayed: boolean;
        }>(
          `INSERT INTO academy_assessment_submissions (assessment_id, enrollment_id, answers, score, passed)
           VALUES ($1, $2, $3::jsonb, $4, $5)
           ON CONFLICT (assessment_id, enrollment_id) DO UPDATE
             SET assessment_id = academy_assessment_submissions.assessment_id
           RETURNING submission_id, score, passed, answers, (xmax <> 0) AS replayed`,
          [
            input.assessmentId,
            input.enrollmentId,
            JSON.stringify(input.answers),
            graded.score,
            graded.passed,
          ],
        );
        const submission = submissionRows[0];
        if (!submission) throw new Error('submit: INSERT returned no row');

        // On a replay the stored submission is authoritative: re-grade the
        // persisted answers so `results` agrees with `score`/`passed` instead
        // of reflecting the (ignored) resubmitted answers.
        const results = submission.replayed
          ? this.grade(questions, submission.answers, assessment.pass_threshold).results
          : graded.results;

        // FINAL only — try to issue a badge in the same transaction.
        let certification: Certification | null = null;
        if (assessment.kind === 'FINAL') {
          const passed = submission.replayed ? submission.passed === true : graded.passed === true;
          if (passed) {
            certification = await this.certifyIfEligible(client, {
              enrollmentId: input.enrollmentId,
              courseId: assessment.course_id,
              teacherUserId: enrollment.teacher_user_id,
              organizationCode: enrollment.organization_code,
              submissionId: submission.submission_id,
              score: (submission.replayed ? submission.score : graded.score) ?? 0,
            });
          }
        }

        await client.query('COMMIT');

        return {
          submission_id: submission.submission_id,
          score: submission.replayed ? submission.score : graded.score,
          passed: submission.replayed ? submission.passed : graded.passed,
          results,
          replayed: submission.replayed,
          ...(certification !== null ? { certification } : {}),
        };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      }
    });
  }

  /**
   * Grades a submission.
   *
   *  - MULTIPLE_CHOICE: submitted index === answer_key[0].
   *  - SHORT_ANSWER with non-empty answer_key: NFC + locale-casefold + trim,
   *    then match any accepted string.
   *  - SHORT_ANSWER with empty answer_key: deferred (correct: null); points
   *    excluded from both earned and gradable totals.
   *
   * score is the percent of *gradable* points earned. If every question is
   * deferred (no MC, all SHORT_ANSWER w/o keys) returns score=null/passed=null.
   */
  private grade(
    questions: QuestionGradingRow[],
    answers: Record<string, number | string>,
    passThreshold: number,
  ): GradedResult {
    let gradablePoints = 0;
    let earnedPoints = 0;
    const results: QuestionResult[] = [];

    for (const q of questions) {
      const submitted = answers[String(q.question_id)];

      if (q.kind === 'MULTIPLE_CHOICE') {
        gradablePoints += q.points;
        const correctIndex = q.answer_key[0];
        const isCorrect =
          typeof submitted === 'number' &&
          typeof correctIndex === 'number' &&
          submitted === correctIndex;
        if (isCorrect) earnedPoints += q.points;
        results.push({ question_id: q.question_id, correct: isCorrect });
        continue;
      }

      // SHORT_ANSWER
      if (q.answer_key.length === 0) {
        // No key → manual rubric pending. Points don't count toward score.
        results.push({ question_id: q.question_id, correct: null });
        continue;
      }
      gradablePoints += q.points;
      const submittedNorm = normalizeShortAnswer(submitted);
      const isCorrect =
        submittedNorm !== null &&
        q.answer_key.some(
          (accepted) =>
            typeof accepted === 'string' && normalizeShortAnswer(accepted) === submittedNorm,
        );
      if (isCorrect) earnedPoints += q.points;
      results.push({ question_id: q.question_id, correct: isCorrect });
    }

    if (gradablePoints === 0) {
      return { score: null, passed: null, results };
    }
    const score = Math.round((earnedPoints / gradablePoints) * 100);
    return { score, passed: score >= passThreshold, results };
  }

  /**
   * Issues a badge when every lesson in the course is complete for this
   * enrollment. Idempotent on (course_id, teacher_user_id). Returns the row
   * (replayed or fresh) or null if lessons are still outstanding.
   */
  private async certifyIfEligible(
    client: PoolClient,
    input: {
      enrollmentId: number;
      courseId: number;
      teacherUserId: number;
      organizationCode: string | null;
      submissionId: number;
      score: number;
    },
  ): Promise<Certification | null> {
    const progressRes = await client.query<{ done: string; total: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM academy_lesson_completions
           WHERE enrollment_id = $1) AS done,
         (SELECT COUNT(*)::text FROM academy_lessons
           WHERE course_id = $2)     AS total`,
      [input.enrollmentId, input.courseId],
    );
    const done = Number(progressRes.rows[0]?.done ?? 0);
    const total = Number(progressRes.rows[0]?.total ?? 0);
    if (total === 0 || done < total) return null;

    const courseRes = await client.query<{
      title: string;
      subject: string;
      language_track: Certification['language_track'];
      cpd_credits: string;
    }>(
      `SELECT title, subject, language_track, cpd_credits
         FROM academy_courses WHERE course_id = $1`,
      [input.courseId],
    );
    const course = courseRes.rows[0];
    if (!course) return null;

    const certRes = await client.query<{
      certification_id: number;
      score: number;
      cpd_credits: string;
      moe_endorsed: boolean;
      issued_at: Date;
    }>(
      `INSERT INTO academy_certifications
         (enrollment_id, course_id, teacher_user_id, organization_code,
          final_submission_id, score, cpd_credits)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (course_id, teacher_user_id) DO UPDATE
         SET teacher_user_id = academy_certifications.teacher_user_id
       RETURNING certification_id, score, cpd_credits, moe_endorsed, issued_at`,
      [
        input.enrollmentId,
        input.courseId,
        input.teacherUserId,
        input.organizationCode,
        input.submissionId,
        input.score,
        course.cpd_credits,
      ],
    );
    const cert = certRes.rows[0];
    if (!cert) return null;

    return {
      certification_id: cert.certification_id,
      course_id: input.courseId,
      course_title: course.title,
      subject: course.subject,
      language_track: course.language_track,
      score: cert.score,
      cpd_credits: Number(cert.cpd_credits),
      moe_endorsed: cert.moe_endorsed,
      issued_at: cert.issued_at.toISOString(),
    };
  }

  private async loadQuestions(assessmentId: number): Promise<QuestionGradingRow[]> {
    const { rows } = await this.db.query<{
      question_id: number;
      ordinal: number;
      prompt: string;
      kind: AssessmentQuestionKind;
      choices: unknown;
      answer_key: unknown;
      points: number;
    }>(
      `SELECT question_id, ordinal, prompt, kind, choices, answer_key, points
         FROM academy_assessment_questions
        WHERE assessment_id = $1
        ORDER BY ordinal ASC`,
      [assessmentId],
    );
    return rows.map((r) => ({
      question_id: r.question_id,
      ordinal: r.ordinal,
      prompt: r.prompt,
      kind: r.kind,
      choices: Array.isArray(r.choices) ? (r.choices as string[]) : [],
      answer_key: Array.isArray(r.answer_key) ? (r.answer_key as Array<number | string>) : [],
      points: r.points,
    }));
  }
}

/** NFC + Mongolian-locale case-fold + trim. Null for non-string inputs. */
function normalizeShortAnswer(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value.normalize('NFC').trim().toLocaleLowerCase('mn-MN');
}
