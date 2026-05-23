import type { RosterCommitResponse, RosterRow, RosterUploadResponse } from '@studyteach/contracts';

import { uuidv7 } from '../offline/uuid';

import { apiFetch } from './base';

export function uploadRoster(rows: RosterRow[]): Promise<RosterUploadResponse> {
  return apiFetch<RosterUploadResponse>('/teacher/rosters', {
    method: 'POST',
    body: {
      rows,
      idempotency_key: uuidv7(),
    },
  });
}

export function commitRoster(rosterId: number, olympiadId: number): Promise<RosterCommitResponse> {
  return apiFetch<RosterCommitResponse>(`/teacher/rosters/${rosterId}/commit`, {
    method: 'POST',
    body: { olympiad_id: olympiadId },
  });
}
