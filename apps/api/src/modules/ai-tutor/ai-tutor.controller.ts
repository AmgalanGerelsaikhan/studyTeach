import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  SessionStartRequest,
  type SessionStartResponse,
  TurnRequest,
  type TurnResponse,
} from '@studyteach/contracts';

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
