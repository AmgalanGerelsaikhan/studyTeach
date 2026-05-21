import { createHash, randomUUID } from 'node:crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  RosterCommitResponse,
  RosterRow,
  RosterUploadResponse,
  RosterValidationError,
} from '@studyteach/contracts';

import { Db } from '../../lib/db/pool';
import { InvoiceService } from '../payments/invoice.service';
import { RegistrationService } from '../olympiad/registration.service';

interface RowOutcome {
  row_index: number;
  national_id_hash: string | null;
  validation_error: RosterValidationError | null;
}

/**
 * Teacher bulk roster (E-017). Two-step flow:
 *
 *   1. POST /teacher/rosters  → server re-validates + hashes national IDs →
 *      writes roster_uploads row (idempotent on roster_hash); returns the
 *      roster_id + per-row errors.
 *   2. POST /teacher/rosters/:id/commit { olympiad_id } → creates students
 *      (upserts on (school_id, national_id_hash)) → registers each via
 *      RegistrationService.register → creates one invoice covering all
 *      successful registrations.
 *
 * Plain national_id is hashed at upload time and never persists. The
 * parsed_rows JSONB snapshot stores the hash + the rest of the row
 * verbatim minus the plain national_id — replay safe.
 */
@Injectable()
export class RosterService {
  constructor(
    private readonly db: Db,
    private readonly registrations: RegistrationService,
    private readonly invoices: InvoiceService,
  ) {}

  async upload(input: {
    uploaderUserId: number;
    schoolId: number;
    rows: readonly RosterRow[];
  }): Promise<RosterUploadResponse> {
    const outcomes = input.rows.map((row, i): RowOutcome => {
      // First-pass server-side validation. Phone + grade ranges already
      // enforced by zod at the contract layer; this catches duplicates
      // within the upload itself.
      const idHash = row.national_id ? sha256(row.national_id) : null;
      return { row_index: i, national_id_hash: idHash, validation_error: null };
    });

    // Detect duplicate national_id_hash within the upload.
    const seenHashes = new Set<string>();
    const errors: RosterValidationError[] = [];
    for (const o of outcomes) {
      if (!o.national_id_hash) continue;
      if (seenHashes.has(o.national_id_hash)) {
        const err = {
          row_index: o.row_index,
          field: 'national_id',
          message: 'duplicate national_id in this upload',
        };
        o.validation_error = err;
        errors.push(err);
      } else {
        seenHashes.add(o.national_id_hash);
      }
    }

    // Canonical roster_hash for idempotency. Same school + same sorted hashes
    // + same window (here: roster has no olympiad yet, so window = "upload"
    // — sufficient for "same CSV re-uploaded" dedup).
    const sortedHashes = outcomes.map((o) => o.national_id_hash ?? `noid:${o.row_index}`).sort();
    const rosterHash = sha256(`${input.schoolId}|${sortedHashes.join(',')}|upload`);

    // parsed_rows snapshot: keeps full_name + phone_number + grade +
    // national_id_hash (NOT plain national_id) + validation_error.
    const parsedRows = input.rows.map((row, i) => ({
      full_name: row.full_name,
      phone_number: row.phone_number,
      grade: row.grade,
      national_id_hash: outcomes[i]!.national_id_hash,
      validation_error: outcomes[i]!.validation_error,
    }));

    const { rows: insRows } = await this.db.query<{
      roster_id: number;
      row_count: number;
      replayed: boolean;
    }>(
      `INSERT INTO roster_uploads
         (school_id, uploaded_by, roster_hash, row_count, parsed_rows)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (roster_hash) DO UPDATE
         SET roster_hash = EXCLUDED.roster_hash
       RETURNING roster_id, row_count, (xmax <> 0) AS replayed`,
      [
        input.schoolId,
        input.uploaderUserId,
        rosterHash,
        input.rows.length,
        JSON.stringify(parsedRows),
      ],
    );
    const upserted = insRows[0]!;

    return {
      roster_id: upserted.roster_id,
      roster_hash: rosterHash,
      row_count: upserted.row_count,
      errors,
      replayed: upserted.replayed,
    };
  }

  async commit(input: {
    rosterId: number;
    uploaderUserId: number;
    olympiadId: number;
  }): Promise<RosterCommitResponse> {
    const { rows: rosterRows } = await this.db.query<{
      school_id: number;
      committed_at: Date | null;
      parsed_rows: Array<{
        full_name: string;
        phone_number: string;
        grade: number;
        national_id_hash: string | null;
        validation_error: RosterValidationError | null;
      }>;
    }>(
      `SELECT school_id, committed_at, parsed_rows
         FROM roster_uploads WHERE roster_id = $1 AND uploaded_by = $2`,
      [input.rosterId, input.uploaderUserId],
    );
    const roster = rosterRows[0];
    if (!roster) throw new NotFoundException('roster not found');
    if (roster.committed_at) {
      throw new ConflictException('roster already committed');
    }

    const results: RosterCommitResponse['results'] = [];
    const successfulRegIds: number[] = [];

    for (const [i, row] of roster.parsed_rows.entries()) {
      if (row.validation_error) {
        results.push({
          row_index: i,
          student_id: null,
          registration_id: null,
          error: row.validation_error.message,
        });
        continue;
      }
      try {
        // Upsert user → student → registration.
        const userId = await this.upsertUserStudent({
          schoolId: roster.school_id,
          fullName: row.full_name,
          phoneNumber: row.phone_number,
          grade: row.grade,
          nationalIdHash: row.national_id_hash,
        });
        const studentId = await this.studentIdForUser(userId);
        const reg = await this.registrations.register({
          studentId,
          registeredBy: input.uploaderUserId,
          olympiadId: input.olympiadId,
        });
        results.push({
          row_index: i,
          student_id: studentId,
          registration_id: reg.registration_id,
          error: null,
        });
        successfulRegIds.push(reg.registration_id);
      } catch (err) {
        results.push({
          row_index: i,
          student_id: null,
          registration_id: null,
          error: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }

    if (successfulRegIds.length === 0) {
      throw new ConflictException('no rows committed successfully');
    }

    const invoice = await this.invoices.create({
      issuedTo: input.uploaderUserId,
      registrationIds: successfulRegIds,
    });

    await this.db.query(`UPDATE roster_uploads SET committed_at = NOW() WHERE roster_id = $1`, [
      input.rosterId,
    ]);

    return {
      roster_id: input.rosterId,
      results,
      invoice_id: invoice.invoice_id,
    };
  }

  private async upsertUserStudent(input: {
    schoolId: number;
    fullName: string;
    phoneNumber: string;
    grade: number;
    nationalIdHash: string | null;
  }): Promise<number> {
    // 1. Upsert user on phone_number.
    const { rows: userRows } = await this.db.query<{ user_id: number }>(
      `INSERT INTO users (phone_number, email, password_hash, primary_role, organization_code, locale)
       VALUES ($1, $1, $2, 'STUDENT'::user_role_enum, NULL, 'mn-Cyrl')
       ON CONFLICT (phone_number) DO UPDATE
         SET phone_number = EXCLUDED.phone_number
       RETURNING user_id`,
      [input.phoneNumber, randomUUID()],
    );
    const userId = userRows[0]!.user_id;

    // 2. Upsert student on (user_id) — students.user_id is UNIQUE.
    // If national_id_hash is present, this also serves the per-school dedup
    // via the partial UNIQUE index on (school_id, national_id_hash).
    await this.db.query(
      `INSERT INTO students (user_id, school_id, grade, national_id_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET grade = EXCLUDED.grade,
             national_id_hash = COALESCE(students.national_id_hash, EXCLUDED.national_id_hash)`,
      [userId, input.schoolId, input.grade, input.nationalIdHash],
    );
    return userId;
  }

  private async studentIdForUser(userId: number): Promise<number> {
    const { rows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [userId],
    );
    const row = rows[0];
    if (!row) throw new Error(`no student row for user_id=${userId}`);
    return row.student_id;
  }
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}
