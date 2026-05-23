import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Destination,
  DestinationDetail,
  Scholarship,
  ScholarshipFundingType,
  ScholarshipLevel,
  ScholarshipListQuery,
  ScholarshipWatch,
  StudyAbroadBlueprintSection,
  StudyAbroadDestinationCode,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

/**
 * Study Abroad Hub v2 — PRD §4.10a + §4.10b (P1 portions).
 *
 * Destinations + blueprints are a global content catalog seeded from
 * `apps/api/src/db/seed/study-abroad/`. Scholarship aggregator is filterable
 * by destination/level/funding type/deadline window. Watches are per-user
 * deadline subscriptions; notification dispatch is a follow-up cron job.
 */
@Injectable()
export class StudyAbroadService {
  constructor(private readonly db: Db) {}

  async listDestinations(): Promise<Destination[]> {
    const { rows } = await this.db.query<{
      destination_code: StudyAbroadDestinationCode;
      name_mn: string;
      primary_pathway_mn: string;
      hero_image_url: string | null;
      ordinal: number;
    }>(
      `SELECT destination_code, name_mn, primary_pathway_mn, hero_image_url, ordinal
         FROM destinations
        ORDER BY ordinal`,
    );
    return rows;
  }

  async getDestination(code: StudyAbroadDestinationCode): Promise<DestinationDetail> {
    const { rows: destRows } = await this.db.query<Destination>(
      `SELECT destination_code, name_mn, primary_pathway_mn, hero_image_url, ordinal
         FROM destinations WHERE destination_code = $1`,
      [code],
    );
    const destination = destRows[0];
    if (!destination) throw new NotFoundException('destination not found');

    const { rows: blueprintRows } = await this.db.query<{
      blueprint_id: string;
      destination_code: StudyAbroadDestinationCode;
      section: StudyAbroadBlueprintSection;
      body_mn: string;
      ordinal: number;
    }>(
      `SELECT blueprint_id::text, destination_code, section, body_mn, ordinal
         FROM destination_blueprints
        WHERE destination_code = $1
        ORDER BY ordinal`,
      [code],
    );

    return {
      destination,
      blueprints: blueprintRows.map((r) => ({
        blueprint_id: Number(r.blueprint_id),
        destination_code: r.destination_code,
        section: r.section,
        body_mn: r.body_mn,
        ordinal: r.ordinal,
      })),
    };
  }

  async listScholarships(filter: ScholarshipListQuery): Promise<Scholarship[]> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (filter.destination_code) {
      params.push(filter.destination_code);
      where.push(`destination_code = $${params.length}::study_abroad_destination_code`);
    }
    if (filter.level) {
      params.push(filter.level);
      where.push(`level = $${params.length}::scholarship_level`);
    }
    if (filter.funding_type) {
      params.push(filter.funding_type);
      where.push(`funding_type = $${params.length}::scholarship_funding_type`);
    }
    if (filter.deadline_within_days !== undefined) {
      params.push(filter.deadline_within_days);
      where.push(
        `deadline BETWEEN CURRENT_DATE AND CURRENT_DATE + ($${params.length}::int * INTERVAL '1 day')`,
      );
    }
    const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await this.db.query<{
      scholarship_id: string;
      name_mn: string;
      funder: string;
      destination_code: StudyAbroadDestinationCode;
      level: ScholarshipLevel;
      eligibility_mn: string;
      deadline: Date;
      application_url: string;
      document_checklist: string[];
      funding_type: ScholarshipFundingType;
    }>(
      `SELECT scholarship_id::text, name_mn, funder, destination_code, level,
              eligibility_mn, deadline, application_url, document_checklist, funding_type
         FROM scholarships
         ${clause}
        ORDER BY deadline ASC
        LIMIT 200`,
      params,
    );
    return rows.map((r) => ({
      scholarship_id: Number(r.scholarship_id),
      name_mn: r.name_mn,
      funder: r.funder,
      destination_code: r.destination_code,
      level: r.level,
      eligibility_mn: r.eligibility_mn,
      deadline: r.deadline.toISOString().slice(0, 10),
      application_url: r.application_url,
      document_checklist: r.document_checklist,
      funding_type: r.funding_type,
    }));
  }

  async getScholarship(scholarshipId: number): Promise<Scholarship> {
    const result = await this.listScholarships({});
    const item = result.find((s) => s.scholarship_id === scholarshipId);
    if (!item) {
      // Fall back to a direct fetch if not in the top-200 window.
      const { rows } = await this.db.query<{
        scholarship_id: string;
        name_mn: string;
        funder: string;
        destination_code: StudyAbroadDestinationCode;
        level: ScholarshipLevel;
        eligibility_mn: string;
        deadline: Date;
        application_url: string;
        document_checklist: string[];
        funding_type: ScholarshipFundingType;
      }>(
        `SELECT scholarship_id::text, name_mn, funder, destination_code, level,
                eligibility_mn, deadline, application_url, document_checklist, funding_type
           FROM scholarships WHERE scholarship_id = $1`,
        [scholarshipId],
      );
      const r = rows[0];
      if (!r) throw new NotFoundException('scholarship not found');
      return {
        scholarship_id: Number(r.scholarship_id),
        name_mn: r.name_mn,
        funder: r.funder,
        destination_code: r.destination_code,
        level: r.level,
        eligibility_mn: r.eligibility_mn,
        deadline: r.deadline.toISOString().slice(0, 10),
        application_url: r.application_url,
        document_checklist: r.document_checklist,
        funding_type: r.funding_type,
      };
    }
    return item;
  }

  /**
   * Subscribes the caller to deadline reminders for a scholarship.
   * Idempotent on (user_id, scholarship_id). The notification dispatch loop
   * is a follow-up cron job — for now we just persist the watch.
   */
  async watch(input: { userId: number; scholarshipId: number }): Promise<ScholarshipWatch> {
    // Schedule a reminder 7 days before the deadline. If the deadline is
    // already inside that window, fire at the next sync.
    const { rows: schol } = await this.db.query<{ deadline: Date }>(
      `SELECT deadline FROM scholarships WHERE scholarship_id = $1`,
      [input.scholarshipId],
    );
    if (!schol[0]) throw new NotFoundException('scholarship not found');
    const notifyAt = new Date(schol[0].deadline.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { rows } = await this.db.query<{
      watch_id: string;
      scholarship_id: string;
      notify_at: Date | null;
      notified_at: Date | null;
      created_at: Date;
    }>(
      `INSERT INTO scholarship_watches (user_id, scholarship_id, notify_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, scholarship_id) DO UPDATE
         SET notify_at = EXCLUDED.notify_at
       RETURNING watch_id::text, scholarship_id::text, notify_at, notified_at, created_at`,
      [input.userId, input.scholarshipId, notifyAt],
    );
    const r = rows[0]!;
    return {
      watch_id: Number(r.watch_id),
      scholarship_id: Number(r.scholarship_id),
      notify_at: r.notify_at ? r.notify_at.toISOString() : null,
      notified_at: r.notified_at ? r.notified_at.toISOString() : null,
      created_at: r.created_at.toISOString(),
    };
  }
}
