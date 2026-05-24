import { Injectable } from '@nestjs/common';
import type {
  PublicDestination,
  PublicEgshSubject,
  PublicSampleQuestion,
  PublicStats,
  PublicStatsTotals,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

/**
 * Anonymous landing-page payload. All queries hit aggregated columns or
 * the closed-enum reference tables (destinations, scholarships, schools).
 * No PII leaves this service. A 5-min in-memory cache shields the DB
 * from the landing-page traffic burst (anonymous visitors don't get
 * per-user variants, so a single cache entry is enough).
 */
@Injectable()
export class PublicService {
  private cache: { value: PublicStats; expiresAt: number } | null = null;
  private readonly TTL_MS = 5 * 60 * 1000;

  constructor(private readonly db: Db) {}

  async getStats(): Promise<PublicStats> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.value;
    }
    const value = await this.computeStats();
    this.cache = { value, expiresAt: now + this.TTL_MS };
    return value;
  }

  private async computeStats(): Promise<PublicStats> {
    const [totals, egshSubjects, destinations, sample] = await Promise.all([
      this.fetchTotals(),
      this.fetchEgshSubjects(),
      this.fetchDestinations(),
      this.fetchSampleQuestion(),
    ]);
    return { totals, egsh_subjects: egshSubjects, destinations, sample_question: sample };
  }

  private async fetchTotals(): Promise<PublicStatsTotals> {
    const { rows } = await this.db.query<{
      schools: string;
      students: string;
      egsh_papers: string;
      destinations: string;
      scholarships: string;
    }>(
      `SELECT (SELECT COUNT(*) FROM schools)::text       AS schools,
              (SELECT COUNT(*) FROM students)::text      AS students,
              (SELECT COUNT(*) FROM egsh_papers)::text   AS egsh_papers,
              (SELECT COUNT(*) FROM destinations)::text  AS destinations,
              (SELECT COUNT(*) FROM scholarships)::text  AS scholarships`,
    );
    const r = rows[0]!;
    return {
      schools: Number(r.schools),
      students: Number(r.students),
      egsh_papers: Number(r.egsh_papers),
      destinations: Number(r.destinations),
      scholarships: Number(r.scholarships),
    };
  }

  private async fetchEgshSubjects(): Promise<PublicEgshSubject[]> {
    // Latest paper per subject. Stable display order via SUBJECT_ORDER.
    const { rows } = await this.db.query<{ subject: string; year: number }>(
      `SELECT DISTINCT ON (subject) subject, year
         FROM egsh_papers
         ORDER BY subject, year DESC`,
    );
    return rows
      .map((r) => ({ subject: r.subject, year: r.year, label_mn: subjectLabelMn(r.subject) }))
      .sort((a, b) => orderOf(a.subject) - orderOf(b.subject));
  }

  private async fetchDestinations(): Promise<PublicDestination[]> {
    // Top by ordinal + scholarship count joined in. Cap at 8 — the landing
    // carousel doesn't need every destination, just the headline set.
    const { rows } = await this.db.query<{
      destination_code: string;
      name_mn: string;
      primary_pathway_mn: string;
      scholarship_count: string;
    }>(
      `SELECT d.destination_code, d.name_mn, d.primary_pathway_mn,
              COUNT(s.scholarship_id)::text AS scholarship_count
         FROM destinations d
         LEFT JOIN scholarships s ON s.destination_code = d.destination_code
         GROUP BY d.destination_code, d.name_mn, d.primary_pathway_mn, d.ordinal
         ORDER BY d.ordinal ASC
         LIMIT 8`,
    );
    return rows.map((r) => ({
      destination_code: r.destination_code,
      name_mn: r.name_mn,
      pathway_mn: r.primary_pathway_mn,
      scholarship_count: Number(r.scholarship_count),
    }));
  }

  private async fetchSampleQuestion(): Promise<PublicSampleQuestion | null> {
    // Pull a math question by preference (most universally recognizable
    // on a landing page). Fall back to whatever's available.
    const { rows } = await this.db.query<{
      subject: string;
      year: number;
      question: {
        prompt?: string;
        options?: string[];
        answer?: number;
        strand?: string;
      } | null;
    }>(
      `SELECT subject, year, (body->'questions'->0) AS question
         FROM egsh_papers
         ORDER BY CASE WHEN subject = 'math' THEN 0 ELSE 1 END, year DESC
         LIMIT 1`,
    );
    const r = rows[0];
    if (!r || !r.question || !r.question.prompt || !Array.isArray(r.question.options)) {
      return null;
    }
    return {
      subject: r.subject,
      label_mn: subjectLabelMn(r.subject),
      year: r.year,
      prompt: r.question.prompt,
      options: r.question.options,
      answer_index: typeof r.question.answer === 'number' ? r.question.answer : 0,
      strand: r.question.strand ?? null,
    };
  }
}

// Curriculum labels — mirrors the seed in apps/api/src/db/seed/egsh/.
// Kept here so a missing key still renders something rather than throwing.
const SUBJECT_LABELS_MN: Record<string, string> = {
  math: 'Математик',
  physics: 'Физик',
  chem: 'Хими',
  bio: 'Биологи',
  mongolian: 'Монгол хэл',
  english: 'Англи хэл',
  russian: 'Орос хэл',
  history: 'Түүх',
  social: 'Нийгмийн ухаан',
  geography: 'Газарзүй',
};

const SUBJECT_ORDER = [
  'math',
  'physics',
  'chem',
  'bio',
  'mongolian',
  'english',
  'russian',
  'history',
  'social',
  'geography',
];

function subjectLabelMn(subject: string): string {
  return SUBJECT_LABELS_MN[subject] ?? subject;
}

function orderOf(subject: string): number {
  const idx = SUBJECT_ORDER.indexOf(subject);
  return idx === -1 ? 999 : idx;
}
