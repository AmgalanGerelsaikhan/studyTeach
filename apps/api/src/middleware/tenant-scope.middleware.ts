import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { AuditService } from '../lib/audit/audit.service';

import './types';

/**
 * Enforces multi-tenant scoping per ADR-0006 + PRD §8.1.
 *
 * - If the request carries a context (i.e. authenticated), the controller is
 *   free to scope its queries by req.context.organization_code.
 * - If the request sets the `X-Cross-Tenant-Org` header, the user must be
 *   PLATFORM_ADMIN, the override is allowed, and an audit row is written.
 *   Any other role gets a 403 + audit row.
 * - Unauthenticated requests pass through; route-level guards reject as needed.
 */
@Injectable()
export class TenantScopeMiddleware implements NestMiddleware {
  constructor(private readonly audit: AuditService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const ctx = req.context;
    const crossTenant = req.get('x-cross-tenant-org');
    if (!crossTenant) return next();

    if (!ctx) {
      await this.audit.record({
        actor_user_id: null,
        action: 'tenant.cross_read.unauthenticated_attempt',
        metadata: { target_org: crossTenant, path: req.path },
      });
      throw new ForbiddenException('cross-tenant access requires authentication');
    }
    if (ctx.primary_role !== 'PLATFORM_ADMIN') {
      await this.audit.record({
        actor_user_id: ctx.user_id,
        action: 'tenant.cross_read.denied',
        metadata: { target_org: crossTenant, role: ctx.primary_role, path: req.path },
      });
      throw new ForbiddenException('cross-tenant access requires PLATFORM_ADMIN');
    }

    await this.audit.record({
      actor_user_id: ctx.user_id,
      action: 'tenant.cross_read.granted',
      metadata: { from_org: ctx.organization_code, target_org: crossTenant, path: req.path },
    });
    req.context = { ...ctx, organization_code: crossTenant };
    next();
  }
}
