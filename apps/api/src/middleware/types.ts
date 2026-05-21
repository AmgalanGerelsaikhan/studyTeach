import type { UserRole } from '@studyteach/contracts';

/**
 * Augments Express Request with the auth + tenant context populated by
 * SessionMiddleware + TenantScopeMiddleware. Every controller that needs
 * the caller reads from req.context.
 */
export interface RequestContext {
  user_id: number;
  primary_role: UserRole;
  organization_code: string | null;
  session_id: string;
}

declare module 'express' {
  interface Request {
    context?: RequestContext;
  }
}
