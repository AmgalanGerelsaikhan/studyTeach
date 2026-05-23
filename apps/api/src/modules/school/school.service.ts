import { Injectable } from '@nestjs/common';
import type { SchoolTeacherRow } from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';

/**
 * School-admin reads (PRD §4.4). Returns the teachers at an organization
 * with a small per-teacher summary (cert count + total CPD credits + most
 * recent certification date). The detail view is the existing
 * /teacher-academy/teachers/:id/transcript route.
 */
@Injectable()
export class SchoolService {
  constructor(private readonly db: Db) {}

  async listTeachers(organizationCode: string): Promise<SchoolTeacherRow[]> {
    const { rows } = await this.db.query<{
      user_id: number;
      email: string | null;
      certifications_count: string;
      total_cpd_credits: string;
      last_certified_at: Date | null;
    }>(
      `SELECT u.user_id,
              u.email,
              COUNT(ac.certification_id)::text       AS certifications_count,
              COALESCE(SUM(ac.cpd_credits), 0)::text AS total_cpd_credits,
              MAX(ac.issued_at)                      AS last_certified_at
         FROM users u
         LEFT JOIN academy_certifications ac
                ON ac.teacher_user_id = u.user_id
        WHERE u.organization_code = $1
          AND u.primary_role = 'TEACHER'::user_role_enum
        GROUP BY u.user_id, u.email
        ORDER BY total_cpd_credits DESC NULLS LAST, u.user_id ASC`,
      [organizationCode],
    );
    return rows.map((r) => ({
      user_id: r.user_id,
      email: r.email,
      certifications_count: Number(r.certifications_count),
      total_cpd_credits: Number(r.total_cpd_credits),
      last_certified_at: r.last_certified_at ? r.last_certified_at.toISOString() : null,
    }));
  }
}
