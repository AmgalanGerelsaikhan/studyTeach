import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../lib/db/pool';
import { BktService } from '../ai-tutor/bkt.service';

import { PaperService } from './paper.service';

export interface MockSession {
  session_id: string;
  paper_id: string;
  subject: string;
  is_proctored_active: boolean;
  started_at: string;
  replayed: boolean;
}

export interface MockAnswer {
  question_id: string;
  chosen_index: number;
}

export interface StrandResult {
  strand: string;
  correct: number;
  wrong: number;
}

export interface MissedConcept {
  strand: string;
  question_id: string;
  prompt: string;
}

export interface SubmitResult {
  session_id: string;
  score: number;
  max_score: number;
  per_strand: StrandResult[];
  missed: MissedConcept[];
}

@Injectable()
export class MockService {
  constructor(
    private readonly db: Db,
    private readonly papers: PaperService,
    private readonly bkt: BktService,
  ) {}

  /**
   * Idempotent on idempotencyKey. On first call also flips
   * ai_tutor_sessions.in_active_mock_test for any open tutor sessions of this
   * student so the exam-mode refusal fires immediately on the next tutor turn.
   */
  async start(input: {
    studentId: number;
    paperId: string;
    idempotencyKey: string;
  }): Promise<MockSession> {
    // Validate paper exists up-front so the error is clear.
    const paper = await this.papers.getWithQuestions(input.paperId);

    const { rows } = await this.db.query<{
      session_id: string;
      paper_id: string;
      subject: string;
      is_proctored_active: boolean;
      started_at: Date;
      replayed: boolean;
    }>(
      `INSERT INTO mock_test_sessions
         (student_id, test_type, paper_id, subject, is_proctored_active, idempotency_key)
       VALUES ($1, 'EGSH'::test_type_enum, $2, $3, TRUE, $4)
       ON CONFLICT (idempotency_key) DO UPDATE
         SET idempotency_key = EXCLUDED.idempotency_key
       RETURNING session_id::text, paper_id, subject, is_proctored_active, started_at,
                 (xmax <> 0) AS replayed`,
      [input.studentId, paper.paper_id, paper.subject, input.idempotencyKey],
    );
    const session = rows[0];
    if (!session) throw new Error('mock.start: INSERT returned no row');

    // Flip the parallel tutor flag for every open session of this student.
    // Idempotent — running twice keeps the rows true.
    await this.db.query(
      `UPDATE ai_tutor_sessions SET in_active_mock_test = TRUE
        WHERE student_id = $1 AND ended_at IS NULL`,
      [input.studentId],
    );

    return {
      session_id: session.session_id,
      paper_id: session.paper_id,
      subject: session.subject,
      is_proctored_active: session.is_proctored_active,
      started_at: session.started_at.toISOString(),
      replayed: session.replayed,
    };
  }

  async submit(input: {
    sessionId: string;
    studentId: number;
    answers: readonly MockAnswer[];
  }): Promise<SubmitResult> {
    const session = await this.loadOwnedSession(input.sessionId, input.studentId);
    if (!session.paper_id) throw new NotFoundException('session has no paper');

    const paperFull = await this.papers.getWithQuestions(session.paper_id);
    const answerKey = await this.papers.getAnswerKey(session.paper_id);

    let score = 0;
    const max = paperFull.questions.length;
    const strandStats = new Map<string, StrandResult>();
    const missed: MissedConcept[] = [];
    const observations: { strand: string; correct: boolean }[] = [];

    const answerMap = new Map(input.answers.map((a) => [a.question_id, a.chosen_index]));
    for (const q of paperFull.questions) {
      const chosen = answerMap.get(q.id);
      const key = answerKey.get(q.id);
      if (!key) continue;
      const correct = chosen === key.answer;
      if (correct) score += 1;
      else missed.push({ strand: q.strand, question_id: q.id, prompt: q.prompt });
      observations.push({ strand: q.strand, correct });
      const existing = strandStats.get(q.strand) ?? { strand: q.strand, correct: 0, wrong: 0 };
      if (correct) existing.correct += 1;
      else existing.wrong += 1;
      strandStats.set(q.strand, existing);
    }

    const perStrand = Array.from(strandStats.values()).sort((a, b) =>
      a.strand.localeCompare(b.strand),
    );

    // Persist results, mark session submitted, clear the proctor flag both
    // here and on the parallel tutor sessions. Tutor will resume normal
    // behavior on its next turn.
    await this.db.withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO mock_test_results
             (session_id, student_id, test_type, subject, score, max_score, per_strand_score)
           VALUES ($1, $2, 'EGSH'::test_type_enum, $3, $4, $5, $6::jsonb)
           ON CONFLICT (session_id) DO UPDATE
             SET score            = EXCLUDED.score,
                 max_score        = EXCLUDED.max_score,
                 per_strand_score = EXCLUDED.per_strand_score,
                 taken_at         = NOW()`,
          [
            input.sessionId,
            input.studentId,
            session.subject,
            score,
            max,
            JSON.stringify(perStrandAsObject(perStrand)),
          ],
        );
        await client.query(
          `UPDATE mock_test_sessions
              SET submitted_at        = NOW(),
                  is_proctored_active = FALSE
            WHERE session_id = $1`,
          [input.sessionId],
        );
        await client.query(
          `UPDATE ai_tutor_sessions SET in_active_mock_test = FALSE
            WHERE student_id = $1`,
          [input.studentId],
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    });

    // BKT observations happen outside the transaction so a transient mastery
    // write doesn't roll back the score (the result is the authoritative
    // record; the mastery update is reconstructible from it).
    await this.bkt.observe(input.studentId, observations);

    return { session_id: input.sessionId, score, max_score: max, per_strand: perStrand, missed };
  }

  private async loadOwnedSession(
    sessionId: string,
    studentId: number,
  ): Promise<{ paper_id: string | null; subject: string }> {
    const { rows } = await this.db.query<{
      student_id: number;
      paper_id: string | null;
      subject: string;
    }>(`SELECT student_id, paper_id, subject FROM mock_test_sessions WHERE session_id = $1`, [
      sessionId,
    ]);
    const row = rows[0];
    if (!row) throw new NotFoundException('mock session not found');
    if (row.student_id !== studentId) throw new NotFoundException('mock session not found');
    return { paper_id: row.paper_id, subject: row.subject };
  }
}

function perStrandAsObject(
  rows: StrandResult[],
): Record<string, { correct: number; wrong: number }> {
  return rows.reduce<Record<string, { correct: number; wrong: number }>>((acc, r) => {
    acc[r.strand] = { correct: r.correct, wrong: r.wrong };
    return acc;
  }, {});
}
