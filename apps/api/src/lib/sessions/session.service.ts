import { randomBytes } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { Db } from '../db/pool';

/** 24-hour active lifetime; sliding refresh up to 7 days total (ADR-0007). */
const ACTIVE_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionRow {
  session_id: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class SessionService {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly db: Db,
  ) {}

  cookieName(): string {
    // __Host- prefix locks the cookie to the exact origin per ADR-0007.
    return this.env.NODE_ENV === 'development' ? 'st-sid' : '__Host-st-sid';
  }

  async create(userId: number, ip?: string, userAgent?: string): Promise<string> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ACTIVE_LIFETIME_MS);
    await this.db.query(
      `INSERT INTO sessions (session_id, user_id, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, userId, ip ?? null, userAgent ?? null, expiresAt],
    );
    return sessionId;
  }

  async resolve(sessionId: string): Promise<SessionRow | null> {
    const { rows } = await this.db.query<SessionRow>(
      `SELECT session_id, user_id, expires_at, created_at
       FROM sessions
       WHERE session_id = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()
         AND created_at > NOW() - $2::interval`,
      [sessionId, `${MAX_LIFETIME_MS} milliseconds`],
    );
    const row = rows[0];
    if (!row) return null;

    // Sliding refresh: extend expires_at on every successful resolve, capped
    // by the original created_at + MAX_LIFETIME_MS.
    const newExpires = new Date(
      Math.min(Date.now() + ACTIVE_LIFETIME_MS, row.created_at.getTime() + MAX_LIFETIME_MS),
    );
    await this.db.query(
      `UPDATE sessions SET expires_at = $1, last_seen_at = NOW() WHERE session_id = $2`,
      [newExpires, sessionId],
    );
    return row;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.db.query(`UPDATE sessions SET revoked_at = NOW() WHERE session_id = $1`, [
      sessionId,
    ]);
  }
}
