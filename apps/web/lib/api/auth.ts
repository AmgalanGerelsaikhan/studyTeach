import type { Me, UserRole } from '@studyteach/contracts';

import { apiFetch } from './base';

export type LoginResult = { kind: 'ok'; me: Me } | { kind: 'requires_2fa'; challenge: string };

export interface RegisterArgs {
  phone: string;
  password: string;
  role: UserRole;
  organization_code?: string;
}

export async function register(args: RegisterArgs): Promise<Me> {
  return apiFetch<Me>('/auth/register', {
    method: 'POST',
    body: {
      phone_number: args.phone,
      password: args.password,
      primary_role: args.role,
      ...(args.organization_code ? { organization_code: args.organization_code } : {}),
    },
  });
}

interface RawLogin {
  requires_2fa?: true;
  challenge?: string;
  user_id?: number;
  primary_role?: Me['primary_role'];
  organization_code?: Me['organization_code'];
  locale?: Me['locale'];
}

export async function login(phone: string, password: string): Promise<LoginResult> {
  const raw = await apiFetch<RawLogin>('/auth/login', {
    method: 'POST',
    body: { phone_number: phone, password },
  });
  if (raw.requires_2fa && raw.challenge) {
    return { kind: 'requires_2fa', challenge: raw.challenge };
  }
  return {
    kind: 'ok',
    me: {
      user_id: raw.user_id!,
      primary_role: raw.primary_role!,
      organization_code: raw.organization_code ?? null,
      locale: raw.locale!,
    },
  };
}

export async function verify2fa(challenge: string, code: string): Promise<Me> {
  return apiFetch<Me>('/auth/2fa/verify', {
    method: 'POST',
    body: { challenge, code },
  });
}

export async function logout(): Promise<void> {
  await apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export async function me(): Promise<Me | null> {
  try {
    return await apiFetch<Me>('/me');
  } catch {
    return null;
  }
}

/** Default redirect after auth, by primary_role. `/` is the public landing. */
export function postLoginPath(role: Me['primary_role']): string {
  switch (role) {
    case 'STUDENT':
      return '/student';
    case 'TEACHER':
      return '/teacher';
    case 'PARENT':
      return '/parent';
    case 'SCHOOL_ADMIN':
      return '/school';
    case 'PLATFORM_ADMIN':
      return '/admin';
  }
}
