import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@studyteach/contracts';

import { AuditService } from '../lib/audit/audit.service';

import { ROLES_KEY } from './roles.decorator';

/**
 * Reads @Roles() metadata. If absent, the route is anonymous-friendly
 * (guard does nothing). If present:
 *   - Empty list => any authenticated user passes.
 *   - Non-empty list => req.context.primary_role must be in the list.
 *
 * Denial emits an audit_log row so unauthorized attempts are visible.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(execution: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      execution.getHandler(),
      execution.getClass(),
    ]);
    if (!required) return true;

    const req = execution.switchToHttp().getRequest<Request>();
    const ctx = req.context;
    if (!ctx) throw new UnauthorizedException();

    if (required.length === 0) return true; // authenticated-only
    if (required.includes(ctx.primary_role)) return true;

    await this.audit.record({
      actor_user_id: ctx.user_id,
      action: 'rbac.denied',
      metadata: { required, actual: ctx.primary_role, path: req.path },
    });
    throw new ForbiddenException(`requires one of: ${required.join(', ')}`);
  }
}
