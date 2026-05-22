import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Assessment,
  AssessmentKind,
  AssessmentQuestionKind,
  AssessmentSubmitResponse,
  QuestionResult,
} from '@studyteach/contracts';

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

/**
 * Teacher Academy assessment read + submit (E-025, PRD §4.5).
 *
 * Read: questions are returned WITHOUT the answer_key — the key never leaves
 * the server.
 *
 * Submit is idempotent on (assessment_id, enrollment_id) per migration 0014;
 * a resubmission returns the stored submission with `replayed: true`.
 *   - LESSON_QUIZ auto-grades MULTIPLE_CHOICE against answer_key on submit.
 *     score = round(earned_points / total_points * 100); passed = score >=
 *     pass_threshold. SHORT_ANSWER answers are stored but graded later (E-026)
 *     so their QuestionResult.correct is null.
 *   - FINAL stores answers only; score/passed stay null until the E-026 badge
 *     service grades it.
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
      // Strip answer_key — the contract's AssessmentQuestion has no such field.
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
   * Idempotent submit. LESSON_QUIZ auto-grades MC; FINAL defers grading.
   * The caller must own the enrollment used here (checked by the controller).
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
    const { rows: enrollmentRows } = await this.db.query<{ course_id: number }>(
      `SELECT course_id FROM academy_enrollments WHERE enrollment_id = $1`,
      [input.enrollmentId],
    );
    const enrollment = enrollmentRows[0];
    if (!enrollment) throw new NotFoundException('enrollment not found');
    if (enrollment.course_id !== assessment.course_id) {
      throw new ConflictException('enrollment is not for this assessment’s course');
    }

    const questions = await this.loadQuestions(input.assessmentId);

    // Grade up front so the INSERT carries score/passed atomically. FINAL
    // grading is deferred to E-026 → score/passed null.
    const graded =
      assessment.kind === 'LESSON_QUIZ'
        ? this.gradeLessonQuiz(questions, input.answers, assessment.pass_threshold)
        : { score: null, passed: null, results: this.deferredResults(questions) };

    const { rows: submissionRows } = await this.db.query<{
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
    // persisted answers so `results` agrees with `score`/`passed` instead of
    // reflecting the resubmitted (and ignored) answers. FINAL results are
    // answer-independent (all deferred), so `graded.results` already holds.
    const results =
      submission.replayed && assessment.kind === 'LESSON_QUIZ'
        ? this.gradeLessonQuiz(questions, submission.answers, assessment.pass_threshold).results
        : graded.results;

    return {
      submission_id: submission.submission_id,
      // On a replay, the persisted score/passed are authoritative.
      score: submission.replayed ? submission.score : graded.score,
      passed: submission.replayed ? submission.passed : graded.passed,
      results,
      replayed: submission.replayed,
    };
  }

  /**
   * Auto-grade: MULTIPLE_CHOICE compared to answer_key[0] (the correct index);
   * SHORT_ANSWER left ungraded (correct: null). score is the percentage of
   * available points earned.
   */
  private gradeLessonQuiz(
    questions: QuestionGradingRow[],
    answers: Record<string, number | string>,
    passThreshold: number,
  ): { score: number; passed: boolean; results: QuestionResult[] } {
    let totalPoints = 0;
    let earnedPoints = 0;
    const results: QuestionResult[] = [];

    for (const q of questions) {
      totalPoints += q.points;
      if (q.kind === 'SHORT_ANSWER') {
        results.push({ question_id: q.question_id, correct: null });
        continue;
      }
      const submitted = answers[String(q.question_id)];
      const correctIndex = q.answer_key[0];
      const isCorrect =
        typeof submitted === 'number' &&
        typeof correctIndex === 'number' &&
        submitted === correctIndex;
      if (isCorrect) earnedPoints += q.points;
      results.push({ question_id: q.question_id, correct: isCorrect });
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return { score, passed: score >= passThreshold, results };
  }

  /** FINAL: every question's correctness is deferred to E-026 → null. */
  private deferredResults(questions: QuestionGradingRow[]): QuestionResult[] {
    return questions.map((q) => ({ question_id: q.question_id, correct: null }));
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
      // JSONB columns arrive already parsed from node-postgres.
      choices: Array.isArray(r.choices) ? (r.choices as string[]) : [],
      answer_key: Array.isArray(r.answer_key) ? (r.answer_key as Array<number | string>) : [],
      points: r.points,
    }));
  }
}
