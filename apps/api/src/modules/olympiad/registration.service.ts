import { createHash } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Db } from '../../lib/db/pool';

export interface RegistrationDescriptor {
  registration_id: number;
  student_id: number;
  olympiad_id: number;
  signature_hash: string;
  payment_status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  qr_payload: string | null;
  created_at: string;
  replayed: boolean;
}

/**
 * Idempotent olympiad registration.
 *
 * The signature_hash is the QPay-invoice idempotency anchor described in
 * PRD §7.2 / hard-constraint #5:
 *   SHA-256(school_id ‖ student_ids_sorted ‖ olympiad_ids_sorted ‖ registration_window_id)
 *
 * S04 ships single-student registration (school_id resolved from the student),
 * so student_ids_sorted = [student_id]; olympiad_ids_sorted = [olympiad_id].
 * The same payload submitted twice returns the existing row unchanged. Bulk
 * teacher-roster registration (multi-student) lands in S05 with the QPay
 * invoice path; the hash format is unchanged so the existing rows remain
 * compatible.
 *
 * Window id = olympiads.olympiad_id ‖ registration_opens — a per-window
 * identifier that prevents a second registration in a re-opened window from
 * being deduped against the first.
 */
@Injectable()
export class RegistrationService {
  constructor(private readonly db: Db) {}

  async register(input: {
    studentId: number;
    registeredBy: number;
    olympiadId: number;
  }): Promise<RegistrationDescriptor> {
    const meta = await this.loadMetadata(input.studentId, input.olympiadId);
    if (!meta) throw new NotFoundException('student or olympiad not found');

    // Verify the registration window is currently open before we accept it.
    const now = new Date();
    if (now < meta.registration_opens) {
      throw new ConflictException('registration window has not opened yet');
    }
    if (now > meta.registration_closes) {
      throw new ConflictException('registration window is closed');
    }

    const signatureHash = computeSignatureHash({
      schoolId: meta.school_id,
      studentIds: [input.studentId],
      olympiadIds: [input.olympiadId],
      registrationWindowId: `${input.olympiadId}|${meta.registration_opens.toISOString()}`,
    });

    const { rows } = await this.db.query<{
      registration_id: number;
      student_id: number;
      olympiad_id: number;
      signature_hash: string;
      payment_status: RegistrationDescriptor['payment_status'];
      qr_payload: string | null;
      created_at: Date;
      replayed: boolean;
    }>(
      `INSERT INTO registrations (student_id, olympiad_id, registered_by, signature_hash, payment_status)
       VALUES ($1, $2, $3, $4, 'PENDING'::payment_status_enum)
       ON CONFLICT (student_id, olympiad_id) DO UPDATE
         SET registered_by = registrations.registered_by
       RETURNING registration_id, student_id, olympiad_id, signature_hash,
                 payment_status, qr_payload, created_at,
                 (xmax <> 0) AS replayed`,
      [input.studentId, input.olympiadId, input.registeredBy, signatureHash],
    );
    const row = rows[0];
    if (!row) throw new Error('registration: INSERT returned no row');
    return {
      registration_id: row.registration_id,
      student_id: row.student_id,
      olympiad_id: row.olympiad_id,
      signature_hash: row.signature_hash,
      payment_status: row.payment_status,
      qr_payload: row.qr_payload,
      created_at: row.created_at.toISOString(),
      replayed: row.replayed,
    };
  }

  async listForStudent(studentId: number): Promise<RegistrationDescriptor[]> {
    const { rows } = await this.db.query<{
      registration_id: number;
      student_id: number;
      olympiad_id: number;
      signature_hash: string;
      payment_status: RegistrationDescriptor['payment_status'];
      qr_payload: string | null;
      created_at: Date;
    }>(
      `SELECT registration_id, student_id, olympiad_id, signature_hash,
              payment_status, qr_payload, created_at
         FROM registrations
        WHERE student_id = $1
        ORDER BY created_at DESC`,
      [studentId],
    );
    return rows.map((r) => ({
      registration_id: r.registration_id,
      student_id: r.student_id,
      olympiad_id: r.olympiad_id,
      signature_hash: r.signature_hash,
      payment_status: r.payment_status,
      qr_payload: r.qr_payload,
      created_at: r.created_at.toISOString(),
      replayed: false,
    }));
  }

  private async loadMetadata(
    studentId: number,
    olympiadId: number,
  ): Promise<{
    school_id: number;
    registration_opens: Date;
    registration_closes: Date;
  } | null> {
    const { rows } = await this.db.query<{
      school_id: number;
      registration_opens: Date;
      registration_closes: Date;
    }>(
      `SELECT st.school_id, o.registration_opens, o.registration_closes
         FROM students st
         CROSS JOIN olympiads o
        WHERE st.student_id = $1 AND o.olympiad_id = $2`,
      [studentId, olympiadId],
    );
    return rows[0] ?? null;
  }
}

export function computeSignatureHash(input: {
  schoolId: number | null;
  studentIds: number[];
  olympiadIds: number[];
  registrationWindowId: string;
}): string {
  const studentIds = [...input.studentIds].sort((a, b) => a - b).join(',');
  const olympiadIds = [...input.olympiadIds].sort((a, b) => a - b).join(',');
  const payload = `${input.schoolId ?? 'none'}|${studentIds}|${olympiadIds}|${input.registrationWindowId}`;
  return createHash('sha256').update(payload).digest('hex');
}
