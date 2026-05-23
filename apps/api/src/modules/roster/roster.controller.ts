import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  RosterCommitRequest,
  type RosterCommitResponse,
  RosterUploadRequest,
  type RosterUploadResponse,
} from '@studyteach/contracts';

import { Roles, RolesGuard } from '../../guards';
import { Db } from '../../lib/db/pool';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { RosterService } from './roster.service';

@Controller('teacher/rosters')
@UseGuards(RolesGuard)
export class RosterController {
  constructor(
    private readonly roster: RosterService,
    private readonly db: Db,
  ) {}

  @Post()
  @Roles('TEACHER')
  async upload(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<RosterUploadResponse> {
    const parsed = RosterUploadRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    if (!ctx) throw new UnauthorizedException();
    const schoolId = await this.resolveSchool(ctx.organization_code);
    return this.roster.upload({
      uploaderUserId: ctx.user_id,
      schoolId,
      rows: parsed.data.rows,
    });
  }

  @Post(':id/commit')
  @Roles('TEACHER')
  async commit(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('id', ParseIntPipe) rosterId: number,
    @Body() raw: unknown,
  ): Promise<RosterCommitResponse> {
    const parsed = RosterCommitRequest.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((i) => i.message).join('; '));
    }
    if (!ctx) throw new UnauthorizedException();
    return this.roster.commit({
      rosterId,
      uploaderUserId: ctx.user_id,
      olympiadId: parsed.data.olympiad_id,
    });
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
    if (!row) throw new NotFoundException('school not found for organization_code');
    return row.school_id;
  }
}
