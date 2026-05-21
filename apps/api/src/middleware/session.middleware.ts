import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { Db } from '../lib/db/pool';
import { SessionService } from '../lib/sessions/session.service';
import type { UserRole } from '@studyteach/contracts';

import './types';

/**
 * Resolves the session cookie, loads the user, and attaches req.context.
 * Anonymous requests (no cookie or expired) pass through with no context —
 * downstream guards decide whether that's acceptable.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(
    private readonly sessions: SessionService,
    private readonly db: Db,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const sid = req.cookies?.[this.sessions.cookieName()] as string | undefined;
    if (!sid) return next();

    const session = await this.sessions.resolve(sid);
    if (!session) return next();

    const { rows } = await this.db.query<{
      primary_role: UserRole;
      organization_code: string | null;
    }>(`SELECT primary_role, organization_code FROM users WHERE user_id = $1`, [session.user_id]);
    const user = rows[0];
    if (!user) return next();

    req.context = {
      user_id: session.user_id,
      primary_role: user.primary_role,
      organization_code: user.organization_code,
      session_id: sid,
    };
    next();
  }
}
