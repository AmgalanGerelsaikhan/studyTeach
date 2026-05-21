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
import { RegistrationRequest, type RegistrationDescriptor } from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { OlympiadService } from './olympiad.service';
import { RegistrationService } from './registration.service';

const ListQuery = z.object({
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  is_online: z.coerce.boolean().optional(),
  aimag: z.string().optional(),
  fee_max: z.coerce.number().int().nonnegative().optional(),
  window: z.enum(['open', 'upcoming', 'closed']).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

@Controller()
@UseGuards(RolesGuard)
export class OlympiadController {
  constructor(
    private readonly db: Db,
    private readonly olympiads: OlympiadService,
    private readonly registrations: RegistrationService,
  ) {}

  @Get('olympiads')
  @Roles('STUDENT', 'TEACHER', 'PARENT')
  async list(@CurrentContext() ctx: RequestContext | undefined, @Query() raw: unknown) {
    const parsed = ListQuery.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    const subjectFilter = Array.isArray(parsed.data.subject)
      ? parsed.data.subject
      : parsed.data.subject
        ? [parsed.data.subject]
        : undefined;
    const input: Parameters<OlympiadService['list']>[0] = {
      limit: parsed.data.limit,
      ...(subjectFilter ? { subject: subjectFilter } : {}),
      ...(parsed.data.grade !== undefined ? { grade: parsed.data.grade } : {}),
      ...(parsed.data.is_online !== undefined ? { is_online: parsed.data.is_online } : {}),
      ...(parsed.data.aimag ? { aimag: parsed.data.aimag } : {}),
      ...(parsed.data.fee_max !== undefined ? { fee_max: parsed.data.fee_max } : {}),
      ...(parsed.data.window ? { window: parsed.data.window } : {}),
      ...(parsed.data.cursor ? { cursor: parsed.data.cursor } : {}),
    };
    const forStudent = ctx?.primary_role === 'STUDENT' ? await this.resolveStudent(ctx) : undefined;
    return this.olympiads.list(input, forStudent);
  }

  @Get('olympiads/:olympiadId')
  @Roles('STUDENT', 'TEACHER', 'PARENT')
  async get(@Param('olympiadId') olympiadId: string) {
    const id = Number(olympiadId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new BadRequestException('olympiad_id must be a positive integer');
    }
    return this.olympiads.get(id);
  }

  @Post('registrations')
  @Roles('STUDENT')
  async register(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<RegistrationDescriptor> {
    const parsed = RegistrationRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    if (!ctx) throw new UnauthorizedException();
    const studentId = await this.resolveStudent(ctx);
    const desc = await this.registrations.register({
      studentId,
      registeredBy: ctx.user_id,
      olympiadId: parsed.data.olympiad_id,
    });
    // Touch idempotency_key for traceability (we don't persist it on registrations
    // today — the row-level idempotency is on (student_id, olympiad_id)).
    void parsed.data.idempotency_key;
    return desc;
  }

  @Get('registrations')
  @Roles('STUDENT')
  async listMine(@CurrentContext() ctx: RequestContext | undefined) {
    if (!ctx) throw new UnauthorizedException();
    const studentId = await this.resolveStudent(ctx);
    return this.registrations.listForStudent(studentId);
  }

  private async resolveStudent(ctx: RequestContext): Promise<number> {
    const { rows } = await this.db.query<{ student_id: number }>(
      `SELECT student_id FROM students WHERE user_id = $1`,
      [ctx.user_id],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('student record missing for this user');
    return row.student_id;
  }
}
