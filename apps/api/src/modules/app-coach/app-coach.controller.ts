import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  CreateCoachSessionRequest,
  MockInterviewRequest,
  RewriteParagraphRequest,
  getRefusalText,
  type AcceptRewriteResponse,
  type CoachSession,
  type CritiqueResponse,
  type MockInterviewResponse,
  type RefusalKey,
  type RewriteResponse,
} from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { AppCoachService, CoachRefusalError } from './app-coach.service';

/**
 * AI Application Coach controller (PRD §4.10c, P2).
 *
 * Every endpoint is STUDENT-only and own-resource scoped. Refusals propagate
 * as 400 with a typed body — `{ refusal_key, text }` — so clients render the
 * canonical Mongolian Cyrillic message verbatim (never paraphrased).
 */
@Controller('app-coach')
@UseGuards(RolesGuard)
export class AppCoachController {
  constructor(private readonly service: AppCoachService) {}

  @Post('sessions')
  @Roles('STUDENT')
  async createSession(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() rawBody: unknown,
  ): Promise<CoachSession> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = CreateCoachSessionRequest.safeParse(rawBody);
    if (!parsed.success) {
      // A blank/short draft fails the Zod min(100). Surface it as the canonical
      // refusal so the client renders the right Mongolian text instead of a
      // generic Zod error message.
      throw new BadRequestException(refusalBody('app-coach.refusal.blank-statement', ctx));
    }
    try {
      return await this.service.createSession({
        userId: ctx.user_id,
        destination_code: parsed.data.destination_code,
        ...(parsed.data.scholarship_id !== undefined
          ? { scholarship_id: parsed.data.scholarship_id }
          : {}),
        draft_text: parsed.data.draft_text,
      });
    } catch (err) {
      if (err instanceof CoachRefusalError) {
        throw new BadRequestException({ refusal_key: err.refusal_key, text: err.text });
      }
      throw err;
    }
  }

  @Post('sessions/:sessionId/critique')
  @Roles('STUDENT')
  async critique(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionIdRaw: string,
  ): Promise<CritiqueResponse> {
    if (!ctx) throw new UnauthorizedException();
    const sessionId = parsePositiveInt(sessionIdRaw, 'sessionId');
    return this.service.critique({ sessionId, userId: ctx.user_id });
  }

  @Post('sessions/:sessionId/rewrite-paragraph')
  @Roles('STUDENT')
  async rewrite(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionIdRaw: string,
    @Body() rawBody: unknown,
  ): Promise<RewriteResponse> {
    if (!ctx) throw new UnauthorizedException();
    const sessionId = parsePositiveInt(sessionIdRaw, 'sessionId');
    const parsed = RewriteParagraphRequest.safeParse(rawBody);
    if (!parsed.success) {
      // Reuses the blank-statement key — same product intent ("you didn't
      // give me enough text to work with"). A dedicated key isn't warranted
      // for "paragraph too short" today.
      throw new BadRequestException(refusalBody('app-coach.refusal.blank-statement', ctx));
    }
    try {
      return await this.service.rewriteParagraph({
        sessionId,
        userId: ctx.user_id,
        paragraph_text: parsed.data.paragraph_text,
      });
    } catch (err) {
      if (err instanceof CoachRefusalError) {
        throw new BadRequestException({ refusal_key: err.refusal_key, text: err.text });
      }
      throw err;
    }
  }

  @Post('rewrites/:rewriteId/accept')
  @Roles('STUDENT')
  async accept(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('rewriteId') rewriteIdRaw: string,
  ): Promise<AcceptRewriteResponse> {
    if (!ctx) throw new UnauthorizedException();
    const rewriteId = parsePositiveInt(rewriteIdRaw, 'rewriteId');
    return this.service.acceptRewrite({ rewriteId, userId: ctx.user_id });
  }

  @Post('interviews')
  @Roles('STUDENT')
  async interview(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() rawBody: unknown,
  ): Promise<MockInterviewResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = MockInterviewRequest.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    try {
      return await this.service.mockInterview({
        userId: ctx.user_id,
        scholarship_name: parsed.data.scholarship_name,
      });
    } catch (err) {
      if (err instanceof CoachRefusalError) {
        throw new BadRequestException({ refusal_key: err.refusal_key, text: err.text });
      }
      throw err;
    }
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}

function refusalBody(
  key: RefusalKey,
  _ctx: RequestContext,
): { refusal_key: RefusalKey; text: string } {
  // Locale is fixed to mn-Cyrl per hard constraint #1. The function takes
  // ctx so when a per-user locale toggle ever returns the call site doesn't
  // need to change.
  return { refusal_key: key, text: getRefusalText(key, 'mn-Cyrl') };
}
