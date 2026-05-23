import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { AnalyticsResponse } from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { AnalyticsService } from './analytics.service';

@Controller('teacher/analytics')
@UseGuards(RolesGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly db: Db,
  ) {}

  @Get()
  @Roles('TEACHER')
  async matrix(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query('subject') subject?: string,
    @Query('grade') gradeRaw?: string,
  ): Promise<AnalyticsResponse> {
    if (!ctx) throw new UnauthorizedException();
    const grade = Number(gradeRaw ?? '11');
    if (!subject) throw new BadRequestException('subject required');
    if (!(grade >= 1 && grade <= 12)) {
      throw new BadRequestException('grade out of range');
    }
    const schoolId = await this.resolveSchool(ctx.organization_code);
    return this.analytics.matrix({ schoolId, subject, grade });
  }

  @Get(':studentId/recent')
  @Roles('TEACHER')
  async recent(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<{ score: number; submitted_at: string }[]> {
    if (!ctx) throw new UnauthorizedException();
    const schoolId = await this.resolveSchool(ctx.organization_code);
    return this.analytics.studentRecent(schoolId, studentId);
  }

  private async resolveSchool(organizationCode: string | null): Promise<number> {
    if (!organizationCode) {
      throw new BadRequestException('teacher must belong to a school');
    }
    const { rows } = await this.db.query<{ school_id: number }>(
      `SELECT school_id FROM schools WHERE school_code = $1`,
      [organizationCode],
    );
    const row = rows[0];
    if (!row) throw new NotFoundException('school not found');
    return row.school_id;
  }
}
