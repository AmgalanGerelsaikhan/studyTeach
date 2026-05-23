import {
  BadRequestException,
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
  ScholarshipListQuery,
  StudyAbroadDestinationCode,
  type Destination,
  type DestinationDetail,
  type Scholarship,
  type ScholarshipWatch,
} from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { ScholarshipWatchDispatcher } from './watch-dispatcher.service';
import { StudyAbroadService } from './study-abroad.service';

@Controller()
@UseGuards(RolesGuard)
export class StudyAbroadController {
  constructor(
    private readonly studyAbroad: StudyAbroadService,
    private readonly watchDispatcher: ScholarshipWatchDispatcher,
  ) {}

  /**
   * Manual trigger for the hourly scholarship-deadline cron. PLATFORM_ADMIN
   * only. Useful for (a) verifying the pipeline in dev without waiting for
   * the next hour boundary and (b) catching up after a missed cron tick in
   * prod. Idempotent by design — sent watches won't re-fire.
   */
  @Post('study-abroad/admin/dispatch-watches')
  @Roles('PLATFORM_ADMIN')
  async dispatchWatches(): Promise<{ ok: true }> {
    await this.watchDispatcher.dispatch();
    return { ok: true };
  }

  @Get('study-abroad/destinations')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async list(): Promise<{ items: Destination[] }> {
    const items = await this.studyAbroad.listDestinations();
    return { items };
  }

  @Get('study-abroad/destinations/:code')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async detail(@Param('code') codeRaw: string): Promise<DestinationDetail> {
    const code = StudyAbroadDestinationCode.safeParse(codeRaw);
    if (!code.success) throw new NotFoundException('destination not found');
    return this.studyAbroad.getDestination(code.data);
  }

  @Get('study-abroad/scholarships')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async scholarships(@Query() raw: unknown): Promise<{ items: Scholarship[] }> {
    const coerced: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
    if (typeof coerced.deadline_within_days === 'string') {
      coerced.deadline_within_days = Number(coerced.deadline_within_days);
    }
    const parsed = ScholarshipListQuery.safeParse(coerced);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const items = await this.studyAbroad.listScholarships(parsed.data);
    return { items };
  }

  @Get('study-abroad/scholarships/:scholarshipId')
  @Roles('STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async scholarshipDetail(@Param('scholarshipId') scholarshipIdRaw: string): Promise<Scholarship> {
    const scholarshipId = parsePositiveInt(scholarshipIdRaw, 'scholarship_id');
    return this.studyAbroad.getScholarship(scholarshipId);
  }

  @Post('study-abroad/scholarships/:scholarshipId/watch')
  @Roles('STUDENT', 'TEACHER')
  async watch(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('scholarshipId') scholarshipIdRaw: string,
  ): Promise<ScholarshipWatch> {
    if (!ctx) throw new UnauthorizedException();
    const scholarshipId = parsePositiveInt(scholarshipIdRaw, 'scholarship_id');
    return this.studyAbroad.watch({ userId: ctx.user_id, scholarshipId });
  }
}

function parsePositiveInt(value: string, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return n;
}
