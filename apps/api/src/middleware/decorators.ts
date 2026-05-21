import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { RequestContext } from './types';

/** Returns the full request context (user + tenant). Throws indirectly via guard if absent. */
export const CurrentContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext | undefined =>
    ctx.switchToHttp().getRequest<Request>().context,
);

/** Convenience: just the organization_code (or null for PLATFORM_ADMIN cross-tenant). */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null | undefined =>
    ctx.switchToHttp().getRequest<Request>().context?.organization_code,
);
