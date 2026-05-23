import { Injectable } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export interface FindPracticeInput {
  lang: 'mn-Cyrl' | 'mn-Latn' | 'en';
  grade: number;
  subject: string;
  /** Optional strand filter — narrows results to the strand the assistant cited. */
  strand?: string;
  k: number;
}

export interface PracticeProblem {
  problem_id: number;
  strand: string;
  subject: string;
  grade: number;
  lang: string;
  prompt: string;
  answer_key: string;
  difficulty: number;
}

@Injectable()
export class PracticeService {
  constructor(private readonly db: Db) {}

  async find(input: FindPracticeInput): Promise<PracticeProblem[]> {
    if (input.k <= 0 || input.k > 20) {
      throw new Error(`k must be in (0, 20], got ${input.k}`);
    }
    const params: unknown[] = [input.lang, input.subject, input.grade];
    let where = `lang = $1 AND subject = $2 AND grade = $3`;
    if (input.strand) {
      params.push(input.strand);
      where += ` AND strand = $${params.length}`;
    }
    params.push(input.k);
    const { rows } = await this.db.query<{
      problem_id: string;
      strand: string;
      subject: string;
      grade: number;
      lang: string;
      prompt: string;
      answer_key: string;
      difficulty: number;
    }>(
      `SELECT problem_id::text, strand, subject, grade, lang, prompt, answer_key, difficulty
         FROM practice_problems
        WHERE ${where}
        ORDER BY difficulty ASC, problem_id ASC
        LIMIT $${params.length}`,
      params,
    );
    return rows.map((r) => ({
      problem_id: Number(r.problem_id),
      strand: r.strand,
      subject: r.subject,
      grade: r.grade,
      lang: r.lang,
      prompt: r.prompt,
      answer_key: r.answer_key,
      difficulty: r.difficulty,
    }));
  }
}
