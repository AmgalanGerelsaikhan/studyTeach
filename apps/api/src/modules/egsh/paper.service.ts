import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export interface PaperDescriptorRow {
  paper_id: string;
  subject: string;
  year: number;
  lang: string;
  question_count: number;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  strand: string;
}

interface PaperBody {
  questions: Array<Question & { answer: number }>;
}

/**
 * Read-only access to egsh_papers. The list/get endpoints strip `answer`
 * before responding; the scoring service reads the full body internally.
 */
@Injectable()
export class PaperService {
  constructor(private readonly db: Db) {}

  async list(filter: { subject?: string; year?: number }): Promise<PaperDescriptorRow[]> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (filter.subject) {
      params.push(filter.subject);
      where.push(`subject = $${params.length}`);
    }
    if (filter.year) {
      params.push(filter.year);
      where.push(`year = $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await this.db.query<{
      paper_id: string;
      subject: string;
      year: number;
      lang: string;
      question_count: string;
    }>(
      `SELECT paper_id,
              subject,
              year,
              lang,
              jsonb_array_length(body->'questions')::text AS question_count
         FROM egsh_papers
         ${whereClause}
         ORDER BY year DESC, subject ASC`,
      params,
    );
    return rows.map((r) => ({
      paper_id: r.paper_id,
      subject: r.subject,
      year: r.year,
      lang: r.lang,
      question_count: Number(r.question_count),
    }));
  }

  async getWithQuestions(paperId: string): Promise<{
    paper_id: string;
    subject: string;
    year: number;
    lang: string;
    questions: Question[];
  }> {
    const { rows } = await this.db.query<{
      paper_id: string;
      subject: string;
      year: number;
      lang: string;
      body: PaperBody;
    }>(`SELECT paper_id, subject, year, lang, body FROM egsh_papers WHERE paper_id = $1`, [
      paperId,
    ]);
    const row = rows[0];
    if (!row) throw new NotFoundException(`paper ${paperId} not found`);
    return {
      paper_id: row.paper_id,
      subject: row.subject,
      year: row.year,
      lang: row.lang,
      questions: row.body.questions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        strand: q.strand,
      })),
    };
  }

  /** Internal — returns the full body including answer keys. Never expose. */
  async getAnswerKey(paperId: string): Promise<Map<string, { answer: number; strand: string }>> {
    const { rows } = await this.db.query<{ body: PaperBody }>(
      `SELECT body FROM egsh_papers WHERE paper_id = $1`,
      [paperId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException(`paper ${paperId} not found`);
    return new Map(row.body.questions.map((q) => [q.id, { answer: q.answer, strand: q.strand }]));
  }
}
