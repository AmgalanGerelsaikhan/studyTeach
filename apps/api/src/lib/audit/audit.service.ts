import { Injectable } from '@nestjs/common';

// Runtime import — NestJS DI uses class identity, so `import type` would break injection.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { Db } from '../db/pool';

export interface AuditEntry {
  actor_user_id: number | null;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append-only audit log writer. See PRD §8.1 + docs/SECURITY_PRIVACY.md.
 * UPDATE/DELETE on audit_log raises in Postgres — this service only INSERTs.
 *
 * Every sensitive action goes through here: login, logout, cross-tenant read,
 * payment status change, PSR read, crisis-flag de-anonymization, role change.
 */
@Injectable()
export class AuditService {
  constructor(private readonly db: Db) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_log (actor_user_id, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.actor_user_id,
        entry.action,
        entry.target_type ?? null,
        entry.target_id ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    );
  }
}
