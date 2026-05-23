import { Controller, Get, Query, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

import { MasteryService, type MasteryRow } from './mastery.service';

/**
 * Demonstrates the middleware-populated context + RBAC.
 * - /me/scope: any authenticated user, returns their resolved scope.
 * - /me/admin-ping: PLATFORM_ADMIN only — shows guard denial path.
 * - /me/mastery: STUDENT only — concept_mastery rows for this student.
 */
@Controller('me')
@UseGuards(RolesGuard)
export class MeController {
  constructor(private readonly mastery: MasteryService) {}

  @Get('scope')
  @Roles()
  scope(@CurrentContext() ctx: RequestContext | undefined): {
    user_id: number;
    primary_role: string;
    organization_code: string | null;
  } {
    if (!ctx) throw new UnauthorizedException();
    return {
      user_id: ctx.user_id,
      primary_role: ctx.primary_role,
      organization_code: ctx.organization_code,
    };
  }

  @Get('admin-ping')
  @Roles('PLATFORM_ADMIN')
  adminPing(@CurrentContext() ctx: RequestContext | undefined): { ok: true; admin: number } {
    return { ok: true, admin: ctx!.user_id };
  }

  @Get('mastery')
  @Roles('STUDENT')
  myMastery(
    @CurrentContext() ctx: RequestContext | undefined,
    @Query('strand_prefix') strandPrefix?: string,
  ): Promise<MasteryRow[]> {
    if (!ctx) throw new UnauthorizedException();
    return this.mastery.forUser(ctx.user_id, strandPrefix);
  }
}
