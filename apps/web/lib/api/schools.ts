import type { SchoolLookupResult } from '@studyteach/contracts';

import { apiFetch } from './base';

export async function lookupSchools(q: string, limit = 20): Promise<SchoolLookupResult[]> {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  params.set('limit', String(limit));
  const res = await apiFetch<{ items: SchoolLookupResult[] }>(`/schools/lookup?${params}`);
  return res.items;
}
