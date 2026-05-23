import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

type Window = 'open' | 'upcoming' | 'closed';

export interface OlympiadListInput {
  subject?: string[];
  grade?: number;
  is_online?: boolean;
  aimag?: string;
  fee_max?: number;
  window?: Window;
  cursor?: string;
  limit: number;
}

export interface OlympiadCardRow {
  olympiad_id: number;
  title: string;
  organizer: string;
  subject: string;
  grade_min: number;
  grade_max: number;
  registration_opens: string;
  registration_closes: string;
  exam_date: string;
  aimag: string | null;
  venue: string | null;
  is_online: boolean;
  base_fee_mnt: number;
  registered?: boolean;
}

@Injectable()
export class OlympiadService {
  constructor(private readonly db: Db) {}

  async list(
    input: OlympiadListInput,
    forStudentId?: number,
  ): Promise<{ items: OlympiadCardRow[]; next_cursor: string | null }> {
    const params: unknown[] = [];
    const where: string[] = [];
    if (input.subject && input.subject.length > 0) {
      params.push(input.subject);
      where.push(`subject = ANY($${params.length}::text[])`);
    }
    if (input.grade !== undefined) {
      params.push(input.grade);
      where.push(`$${params.length}::int BETWEEN grade_min AND grade_max`);
    }
    if (input.is_online !== undefined) {
      params.push(input.is_online);
      where.push(`is_online = $${params.length}`);
    }
    if (input.aimag) {
      params.push(input.aimag);
      where.push(`aimag = $${params.length}`);
    }
    if (input.fee_max !== undefined) {
      params.push(input.fee_max);
      where.push(`base_fee_mnt <= $${params.length}`);
    }
    if (input.window) {
      // Window status is evaluated against NOW() at query time.
      if (input.window === 'open') {
        where.push(`registration_opens <= NOW() AND registration_closes >= NOW()`);
      } else if (input.window === 'upcoming') {
        where.push(`registration_opens > NOW()`);
      } else {
        where.push(`registration_closes < NOW()`);
      }
    }
    if (input.cursor) {
      params.push(input.cursor);
      // Cursor is "older than this exam_date".
      where.push(`exam_date < $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(input.limit + 1); // fetch one extra to detect next page
    const limitIdx = params.length;

    const { rows } = await this.db.query<{
      olympiad_id: number;
      title: string;
      organizer: string;
      subject: string;
      grade_min: number;
      grade_max: number;
      registration_opens: Date;
      registration_closes: Date;
      exam_date: Date;
      aimag: string | null;
      venue: string | null;
      is_online: boolean;
      base_fee_mnt: number;
    }>(
      `SELECT olympiad_id, title, organizer, subject, grade_min, grade_max,
              registration_opens, registration_closes, exam_date,
              aimag, venue, is_online, base_fee_mnt
         FROM olympiads
         ${whereClause}
         ORDER BY exam_date DESC, olympiad_id DESC
         LIMIT $${limitIdx}`,
      params,
    );

    const hasMore = rows.length > input.limit;
    const page = hasMore ? rows.slice(0, input.limit) : rows;

    // Mark registered=true on rows the calling student already has a registration for.
    let registeredIds = new Set<number>();
    if (forStudentId !== undefined && page.length > 0) {
      const ids = page.map((r) => r.olympiad_id);
      const { rows: regRows } = await this.db.query<{ olympiad_id: number }>(
        `SELECT olympiad_id FROM registrations
          WHERE student_id = $1 AND olympiad_id = ANY($2::int[])`,
        [forStudentId, ids],
      );
      registeredIds = new Set(regRows.map((r) => r.olympiad_id));
    }

    return {
      items: page.map((r) => ({
        olympiad_id: r.olympiad_id,
        title: r.title,
        organizer: r.organizer,
        subject: r.subject,
        grade_min: r.grade_min,
        grade_max: r.grade_max,
        registration_opens: r.registration_opens.toISOString(),
        registration_closes: r.registration_closes.toISOString(),
        exam_date: r.exam_date.toISOString(),
        aimag: r.aimag,
        venue: r.venue,
        is_online: r.is_online,
        base_fee_mnt: r.base_fee_mnt,
        ...(forStudentId !== undefined ? { registered: registeredIds.has(r.olympiad_id) } : {}),
      })),
      next_cursor: hasMore ? page[page.length - 1]!.exam_date.toISOString() : null,
    };
  }

  async get(olympiadId: number): Promise<OlympiadCardRow> {
    const { rows } = await this.db.query<{
      olympiad_id: number;
      title: string;
      organizer: string;
      subject: string;
      grade_min: number;
      grade_max: number;
      registration_opens: Date;
      registration_closes: Date;
      exam_date: Date;
      aimag: string | null;
      venue: string | null;
      is_online: boolean;
      base_fee_mnt: number;
    }>(
      `SELECT olympiad_id, title, organizer, subject, grade_min, grade_max,
              registration_opens, registration_closes, exam_date,
              aimag, venue, is_online, base_fee_mnt
         FROM olympiads WHERE olympiad_id = $1`,
      [olympiadId],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('olympiad not found');
    return {
      olympiad_id: row.olympiad_id,
      title: row.title,
      organizer: row.organizer,
      subject: row.subject,
      grade_min: row.grade_min,
      grade_max: row.grade_max,
      registration_opens: row.registration_opens.toISOString(),
      registration_closes: row.registration_closes.toISOString(),
      exam_date: row.exam_date.toISOString(),
      aimag: row.aimag,
      venue: row.venue,
      is_online: row.is_online,
      base_fee_mnt: row.base_fee_mnt,
    };
  }
}
