import type { SchoolTeachersResponse } from '@studyteach/contracts';

import { apiBase, ApiError } from './base';

/**
 * School-admin reads. Server-component fetch with cookie forwarding —
 * mirrors the pattern in teacher-academy.ts / parent.ts.
 */
async function serverGet<T>(path: string, cookieHeader: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`HTTP ${res.status}`, res.status, text || null);
  }
  return (await res.json()) as T;
}

export function listSchoolTeachersServer(cookieHeader: string): Promise<SchoolTeachersResponse> {
  return serverGet<SchoolTeachersResponse>(`/school/teachers`, cookieHeader);
}
