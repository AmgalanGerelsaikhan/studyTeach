import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@studyteach/contracts';

export const ROLES_KEY = 'roles';

/**
 * Per-route role restriction. Empty list = authenticated only.
 * Composes with RolesGuard.
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
