import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  MockStartRequest,
  MockSubmitRequest,
  type MockStartResponse,
  type MockSubmitResponse,
} from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { CohortService } from './cohort.service';
import { MockService } from './mock.service';
import { PaperService } from './paper.service';
import { PredictorService } from './predictor.service';

const PaperListQuery = z.object({
  subject: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

const PredictorQuery = z.object({
  subject: z.string().min(1),
});

const CohortQuery = z.object({
  subject: z.string().min(1),
  grade: z.coerce.number().int().min(1).max(12),
  aimag: z.string().optional(),
});

@Controller('egsh')
@UseGuards(RolesGuard)
export class EgshController {
  constructor(
    private readonly db: Db,
    private readonly papers: PaperService,
    private readonly mocks: MockService,
    private readonly predictor: PredictorService,
    private readonly cohort: CohortService,
  ) {}

  @Get('papers')
  @Roles('STUDENT', 'TEACHER')
  async listPapers(@Query() raw: unknown) {
    const parsed = PaperListQuery.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    return this.papers.list(parsed.data);
  }

  @Get('papers/:paperId')
  @Roles('STUDENT', 'TEACHER')
  async getPaper(@Param('paperId') paperId: string) {
    const paper = await this.papers.getWithQuestions(paperId);
    return {
      ...paper,
      question_count: paper.questions.length,
    };
  }

  @Post('mocks')
  @Roles('STUDENT')
  async startMock(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<MockStartResponse> {
    const parsed = MockStartRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    const session = await this.mocks.start({
      studentId,
      paperId: parsed.data.paper_id,
      idempotencyKey: parsed.data.idempotency_key,
    });
    return {
      session_id: session.session_id,
      paper_id: session.paper_id,
      subject: session.subject as MockStartResponse['subject'],
      is_proctored_active: session.is_proctored_active,
      started_at: session.started_at,
      replayed: session.replayed,
    };
  }

  @Post('mocks/:sessionId/submit')
  @Roles('STUDENT')
  async submitMock(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('sessionId') sessionId: string,
    @Body() raw: unknown,
  ): Promise<MockSubmitResponse> {
    const parsed = MockSubmitRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    return this.mocks.submit({ sessionId, studentId, answers: parsed.data.answers });
  }

  @Get('predictor')
  @Roles('STUDENT')
  async getPredictor(@CurrentContext() ctx: RequestContext | undefined, @Query() raw: unknown) {
    const parsed = PredictorQuery.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    return this.predictor.predict(studentId, parsed.data.subject);
  }

  @Get('cohort')
  @Roles('STUDENT')
  async getCohort(@CurrentContext() ctx: RequestContext | undefined, @Query() raw: unknown) {
    const parsed = CohortQuery.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const studentId = await this.resolveStudent(ctx);
    return this.cohort.percentile({
      studentId,
      grade: parsed.data.grade,
      subject: parsed.data.subject,
      ...(parsed.data.aimag ? { aimag: parsed.data.aimag } : {}),
    });
  }

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
