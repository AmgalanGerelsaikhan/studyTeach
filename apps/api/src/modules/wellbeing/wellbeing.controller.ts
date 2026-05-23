import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  UpdateCrisisFlagRequest,
  WellbeingPulseRequest,
  type WellbeingCanSubmit,
  type WellbeingCrisisFlagListResponse,
  type WellbeingPulseResponse,
} from '@studyteach/contracts';
import { z } from 'zod';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { WellbeingService } from './wellbeing.service';

const ListQuery = z.object({
  only_open: z.coerce.boolean().optional(),
});

@Controller()
@UseGuards(RolesGuard)
export class WellbeingController {
  constructor(private readonly wellbeing: WellbeingService) {}

  @Get('wellbeing/me/can-submit')
  @Roles('STUDENT')
  async canSubmit(@CurrentContext() ctx: RequestContext | undefined): Promise<WellbeingCanSubmit> {
    if (!ctx) throw new UnauthorizedException();
    return this.wellbeing.canSubmit(ctx.user_id);
  }

  @Post('wellbeing/pulse')
  @Roles('STUDENT')
  async submitPulse(
    @CurrentContext() ctx: RequestContext | undefined,
    @Body() raw: unknown,
  ): Promise<WellbeingPulseResponse> {
    if (!ctx) throw new UnauthorizedException();
    const parsed = WellbeingPulseRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.wellbeing.submitPulse({
      studentUserId: ctx.user_id,
      request: parsed.data,
    });
  }

  // ── Counselor surface (SCHOOL_ADMIN or PLATFORM_ADMIN with is_counselor) ─

  @Get('wellbeing/flags')
  @Roles('SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async listFlags(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query() raw: unknown,
  ): Promise<WellbeingCrisisFlagListResponse> {
    if (!ctx) throw new UnauthorizedException();
    if (!ctx.organization_code) throw new ForbiddenException('organization_code required');
    const parsed = ListQuery.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const items = await this.wellbeing.listFlagsForCounselor({
      counselorUserId: ctx.user_id,
      organizationCode: ctx.organization_code,
      onlyOpen: parsed.data.only_open ?? false,
    });
    return { items };
  }

  @Post('wellbeing/flags/:flagId')
  @Roles('SCHOOL_ADMIN', 'PLATFORM_ADMIN')
  async updateFlag(
    @CurrentContext() ctx: RequestContext | undefined,
    @Param('flagId') flagIdRaw: string,
    @Body() raw: unknown,
  ): Promise<{ ok: true }> {
    if (!ctx) throw new UnauthorizedException();
    if (!ctx.organization_code) throw new ForbiddenException('organization_code required');
    const parsed = UpdateCrisisFlagRequest.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const flagId = Number(flagIdRaw);
    if (!Number.isInteger(flagId) || flagId <= 0) {
      throw new BadRequestException('flag_id must be a positive integer');
    }
    await this.wellbeing.updateFlag({
      counselorUserId: ctx.user_id,
      organizationCode: ctx.organization_code,
      flagId,
      update: parsed.data,
    });
    return { ok: true };
  }
}
