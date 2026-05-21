import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { AuditService } from '../../lib/audit/audit.service';
import { ENV } from '../../lib/config/config.module';
import type { Env } from '../../lib/config/env';
import { Db } from '../../lib/db/pool';
import { verifyPassword } from '../../lib/crypto/passwords';
import { OtpService } from '../../lib/otp/otp.service';
import { SessionService } from '../../lib/sessions/session.service';
import type { Me, UserRole } from '@studyteach/contracts';

const LoginInput = z.object({
  phone_number: z.string().regex(/^\+976\d{8}$/, 'must be E.164 +976XXXXXXXX'),
  password: z.string().min(1),
});

const VerifyOtpInput = z.object({
  challenge: z.string().min(1),
  code: z.string().regex(/^\d{6}$/),
});

interface UserRow {
  user_id: number;
  password_hash: string;
  primary_role: UserRole;
  organization_code: string | null;
  locale: string;
  two_factor_enabled: boolean;
  phone_number: string;
}

@Controller()
export class AuthController {
  constructor(
    @Inject(ENV) private readonly env: Env,
    private readonly db: Db,
    private readonly sessions: SessionService,
    private readonly otp: OtpService,
    private readonly audit: AuditService,
  ) {}

  @Post('auth/login')
  async login(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ requires_2fa: true; challenge: string } | Me> {
    const parsed = LoginInput.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const { rows } = await this.db.query<UserRow>(
      `SELECT user_id, password_hash, primary_role, organization_code, locale,
              two_factor_enabled, phone_number
       FROM users WHERE phone_number = $1`,
      [parsed.data.phone_number],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('invalid credentials');

    const ok = await verifyPassword(user.password_hash, parsed.data.password);
    if (!ok) {
      await this.audit.record({ actor_user_id: user.user_id, action: 'auth.login.failed' });
      throw new UnauthorizedException('invalid credentials');
    }

    if (user.two_factor_enabled) {
      const challenge = await this.otp.issue(user.user_id, user.phone_number);
      await this.audit.record({
        actor_user_id: user.user_id,
        action: 'auth.login.2fa-challenge',
        metadata: { challenge },
      });
      return { requires_2fa: true, challenge };
    }

    await this.issueSession(user, req, res);
    return this.toMe(user);
  }

  @Post('auth/2fa/verify')
  async verify2fa(
    @Body() body: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Me> {
    const parsed = VerifyOtpInput.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const userId = await this.otp.verify(parsed.data.challenge, parsed.data.code);
    if (!userId) throw new UnauthorizedException('invalid or expired OTP');

    const { rows } = await this.db.query<UserRow>(
      `SELECT user_id, password_hash, primary_role, organization_code, locale,
              two_factor_enabled, phone_number
       FROM users WHERE user_id = $1`,
      [userId],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('invalid');

    await this.issueSession(user, req, res);
    await this.audit.record({ actor_user_id: user.user_id, action: 'auth.login.2fa-verified' });
    return this.toMe(user);
  }

  @Post('auth/logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const sid = req.cookies?.[this.sessions.cookieName()] as string | undefined;
    if (sid) {
      await this.sessions.revoke(sid);
      await this.audit.record({ actor_user_id: null, action: 'auth.logout', metadata: { sid } });
    }
    this.clearCookie(res);
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request): Promise<Me> {
    const sid = req.cookies?.[this.sessions.cookieName()] as string | undefined;
    if (!sid) throw new UnauthorizedException();
    const session = await this.sessions.resolve(sid);
    if (!session) throw new UnauthorizedException();

    const { rows } = await this.db.query<UserRow>(
      `SELECT user_id, password_hash, primary_role, organization_code, locale,
              two_factor_enabled, phone_number
       FROM users WHERE user_id = $1`,
      [session.user_id],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException();
    return this.toMe(user);
  }

  private async issueSession(user: UserRow, req: Request, res: Response): Promise<void> {
    const sid = await this.sessions.create(
      user.user_id,
      req.ip,
      req.get('user-agent') ?? undefined,
    );
    const isProd = this.env.NODE_ENV === 'production';
    res.cookie(this.sessions.cookieName(), sid, {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    await this.audit.record({
      actor_user_id: user.user_id,
      action: 'auth.login.success',
      metadata: { sid },
    });
  }

  private clearCookie(res: Response): void {
    const isProd = this.env.NODE_ENV === 'production';
    res.clearCookie(this.sessions.cookieName(), {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProd,
      path: '/',
    });
  }

  private toMe(user: UserRow): Me {
    return {
      user_id: user.user_id,
      primary_role: user.primary_role,
      organization_code: user.organization_code,
      locale: (user.locale as Me['locale']) ?? 'mn-Cyrl',
    };
  }
}
