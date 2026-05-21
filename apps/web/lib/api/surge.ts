import type { QueuePositionResponse } from '@studyteach/contracts';

import { apiFetch } from './base';

export function getQueuePosition(token: string): Promise<QueuePositionResponse> {
  return apiFetch<QueuePositionResponse>(`/queue-position/${token}`);
}
