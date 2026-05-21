import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common';
import {
  SessionStartRequest,
  type SessionStartResponse,
  TranscriptReplayQuery,
  type TranscriptReplayResponse,
  TurnRequest,
  type TurnResponse,
} from '@studyteach/contracts';
import { Observable } from 'rxjs';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { AiTutorService } from './ai-tutor.service';

@Controller('ai-tutor')
@UseGuards(RolesGuard)
export class AiTutorController {
  constructor(
    private readonly service: AiTutorService,
    private readonly db: Db,
  ) {}

  @Post('sessions')
  @Roles('STUDENT')
  async startSession(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() rawBody: unknown,
  ): Promise<SessionStartResponse> {
    const parsed = SessionStartRequest.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    return this.service.startSession({
      studentId,
      lang: parsed.data.lang,
      subject: parsed.data.subject,
      grade: parsed.data.grade,
      idempotencyKey: parsed.data.idempotency_key,
    });
  }

  @Post('sessions/:sessionId/turns')
  @Roles('STUDENT')
  async turn(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() rawBody: unknown,
  ): Promise<TurnResponse> {
    const parsed = TurnRequest.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    return this.service.turn({
      sessionId,
      studentId,
      userText: parsed.data.text,
    });
  }

  /**
   * Streaming variant of the turn endpoint — Nest @Sse pipes the
   * AsyncGenerator's StreamEvent values out as `event: message` SSE frames.
   * The client reads them via fetch + ReadableStream (EventSource can't send
   * cookies cross-port reliably; cookies are how we authenticate).
   *
   * NOTE: with @Sse the input must be a query param, not a body — POST + body
   * isn't compatible with SSE in Nest 10. So this is a GET with `?text=...`.
   * Acceptable here because the text is already <2000 chars (zod-enforced).
   */
  @Sse('sessions/:sessionId/stream')
  @Roles('STUDENT')
  async stream(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionId: string,
    @Query('text') text: string,
  ): Promise<Observable<MessageEvent>> {
    const parsed = TurnRequest.safeParse({ text });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    const stream = this.service.turnStream({
      sessionId,
      studentId,
      userText: parsed.data.text,
    });
    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          for await (const ev of stream) {
            subscriber.next({ data: ev });
          }
          subscriber.complete();
        } catch (err) {
          subscriber.error(err);
        }
      })();
    });
  }

  @Get('sessions/:sessionId/messages')
  @Roles('STUDENT')
  async replay(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionId: string,
    @Query() raw: unknown,
  ): Promise<TranscriptReplayResponse> {
    const parsed = TranscriptReplayQuery.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    const transcript = await this.service.transcript({
      sessionId,
      studentId,
      limit: parsed.data.limit,
      ...(parsed.data.before !== undefined ? { before: parsed.data.before } : {}),
    });
    return {
      messages: transcript.messages,
      next_before: transcript.next_before,
    };
  }

  /**
   * Resolves users.user_id → students.student_id. A STUDENT user MUST have a
   * matching students row; absence is a setup bug, not a runtime case.
   */
  private async resolveStudent(ctx: RequestContext | undefined): Promise<number> {
    if (!ctx) throw new UnauthorizedException();
    const { rows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [ctx.user_id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('student record missing for this user');
    return row.student_id;
  }
}
