import { Controller, Get, UnauthorizedException, UseGuards } from '@nestjs/common';

import { Roles, RolesGuard } from '../../guards';
import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

/**
 * Demonstrates the middleware-populated context + RBAC.
 * - /me/scope: any authenticated user, returns their resolved scope.
 * - /me/admin-ping: PLATFORM_ADMIN only — shows guard denial path.
 */
@Controller('me')
@UseGuards(RolesGuard)
export class MeController {
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
}
