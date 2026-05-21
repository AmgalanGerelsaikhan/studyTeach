import { Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export interface MasteryRow {
  curriculum_strand: string;
  level: 'NOT_STARTED' | 'INTRODUCED' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  p_mastered: number;
  last_updated: string;
}

@Injectable()
export class MasteryService {
  constructor(private readonly db: Db) {}

  /**
   * Resolves users.user_id → students.student_id, then returns all
   * concept_mastery rows. Optional `strandPrefix` filters by leading substring
   * — used by the tutor concept panel which scopes to "this subject's
   * strands" (cheap eyeball check: physics strands begin with «Механик»,
   * «Дулааны физик», etc.).
   */
  async forUser(userId: number, strandPrefix?: string): Promise<MasteryRow[]> {
    const { rows: studentRows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId],
    );
    const student = studentRows[0];
    if (!student) throw new NotFoundException('student record missing for this user');
    const params: unknown[] = [student.student_id];
    let where = 'student_id = $1';
    if (strandPrefix) {
      params.push(`${strandPrefix}%`);
      where += ` AND curriculum_strand LIKE $${params.length}`;
    }
    const { rows } = await this.db.query<{
      curriculum_strand: string;
      level: MasteryRow['level'];
      p_mastered: string;
      last_updated: Date;
    }>(
      `SELECT curriculum_strand, level::text AS level, p_mastered::text, last_updated
         FROM concept_mastery
        WHERE ${where}
        ORDER BY p_mastered DESC, curriculum_strand ASC`,
      params,
    );
    return rows.map((r) => ({
      curriculum_strand: r.curriculum_strand,
      level: r.level,
      p_mastered: Number(r.p_mastered),
      last_updated: r.last_updated.toISOString(),
    }));
  }
}
