import type { AnalyticsResponse } from '@studyteach/contracts';

import { apiFetch } from './base';

export function fetchAnalytics(subject: string, grade: number): Promise<AnalyticsResponse> {
  const params = new URLSearchParams({ subject, grade: grade.toString() });
  return apiFetch<AnalyticsResponse>(`/teacher/analytics?${params.toString()}`);
}

export function fetchStudentRecent(
  studentId: number,
): Promise<{ score: number; submitted_at: string }[]> {
  return apiFetch<{ score: number; submitted_at: string }[]>(
    `/teacher/analytics/${studentId}/recent`,
  );
}
