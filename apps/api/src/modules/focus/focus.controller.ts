import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  CreateFocusSessionRequest,
  JoinFocusSessionRequest,
  type ActiveFocusSession,
  type FocusSession,
  type FocusSessionSummary,
} from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { FocusService } from './focus.service';

/**
 * Focus Mode HTTP surface (PRD §4.6, P1).
 *
 *   POST   /focus/sessions                — TEACHER creates a session.
 *   POST   /focus/sessions/join           — STUDENT joins by code.
 *   POST   /focus/sessions/:id/close      — TEACHER ends early.
 *   GET    /focus/sessions/:id/summary    — TEACHER or PLATFORM_ADMIN reads
 *                                            the anonymous engagement summary.
 *   GET    /focus/me/active               — STUDENT polls for the current
 *                                            active session (or null).
 */
@Controller()
@UseGuards(RolesGuard)
export class FocusController {
  constructor(private readonly focus: FocusService) {}

  @Post('focus/sessions')
  @Roles('TEACHER')
  async create(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<FocusSession> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = CreateFocusSessionRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.focus.create({
      teacherUserId: ctx.user_id,
      organizationCode: ctx.organization_code,
      activityKind: parsed.data.activity_kind,
      activityRef: parsed.data.activity_ref,
      scheduledEnd: new Date(parsed.data.scheduled_end),
    });
  }

  @Post('focus/sessions/join')
  @Roles('STUDENT')
  async join(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<ActiveFocusSession> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = JoinFocusSessionRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.focus.join({
      studentUserId: ctx.user_id,
      studentOrganizationCode: ctx.organization_code,
      code: parsed.data.code,
    });
  }

  @Post('focus/sessions/:sessionId/close')
  @Roles('TEACHER')
  async close(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionIdRaw: string,
  ): Promise<{ closed: boolean }> {
    if (!ctx) throw new UnauthorizedException();
    const sessionId = parsePositiveInt(sessionIdRaw, 'session_id');
    await this.focus.close({ sessionId, teacherUserId: ctx.user_id });
    return { closed: true };
  }

  @Get('focus/sessions/:sessionId/summary')
  @Roles('TEACHER', 'PLATFORM_ADMIN')
  async summary(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionIdRaw: string,
  ): Promise<FocusSessionSummary> {
    if (!ctx) throw new UnauthorizedException();
    const sessionId = parsePositiveInt(sessionIdRaw, 'session_id');
    return this.focus.summary({
      sessionId,
      actorUserId: ctx.user_id,
      actorRole: ctx.primary_role as 'TEACHER' | 'PLATFORM_ADMIN',
    });
  }

  @Get('focus/me/active')
  @Roles('STUDENT')
  async meActive(
    @CurrentContext() ctx: RequestContext | undefined,
  ): Promise<ActiveFocusSession | null> {
    if (!ctx) throw new UnauthorizedException();
    return this.focus.meActive(ctx.user_id);
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
