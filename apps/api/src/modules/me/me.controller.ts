import { Controller, Get, UnauthorizedException } from '@nestjs/common';

import { CurrentContext } from '../../middleware/decorators';
import type { RequestContext } from '../../middleware/types';

/**
 * Demonstrates the middleware-populated context. `/me/scope` returns the
 * tenant scope the caller will be filtered by. Useful for verifying
 * SessionMiddleware + TenantScopeMiddleware end-to-end.
 */
@Controller('me')
export class MeController {
  @Get('scope')
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
}
