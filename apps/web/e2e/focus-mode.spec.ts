import { expect, request, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:4000';

/**
 * Close any focus session the given student is currently participating in.
 * Uses the teacher cookie (only teachers may close sessions). Pulls the
 * active session id via /focus/me/active on the student, then POSTs
 * /focus/sessions/:id/close from the teacher.
 *
 * Idempotent — does nothing if the student has no active session.
 */
async function endActiveSessionFor(studentCookie: string, teacherCookie: string): Promise<void> {
  const api = await request.newContext({ baseURL: API_BASE });
  try {
    const activeRes = await api.get('/focus/me/active', {
      headers: { cookie: studentCookie },
    });
    if (!activeRes.ok()) return;
    // NestJS returns `null` as an EMPTY body, not the literal "null" — so
    // res.json() throws SyntaxError on a no-active-session response. Read
    // text first and bail when it's empty.
    const body = (await activeRes.text()).trim();
    if (!body || body === 'null') return;
    const active = JSON.parse(body) as { session_id?: number };
    if (!active.session_id) return;
    await api.post(`/focus/sessions/${active.session_id}/close`, {
      headers: { cookie: teacherCookie },
    });
  } finally {
    await api.dispose();
  }
}

function cookieHeaderFromContext(cookies: { name: string; value: string }[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Teacher creates an AI_TUTOR focus session, reads the 6-char code from the
 * hero, then a separate student context joins via /student/focus. The
 * student lock screen must render with the assigned topic as its heading.
 *
 * Two browser contexts run in parallel so the cookie jars stay isolated.
 */
test.describe('focus mode handshake', () => {
  test('teacher creates AI_TUTOR session, student joins by code', async ({ browser }) => {
    const teacherCtx = await browser.newContext();
    const studentCtx = await browser.newContext();

    try {
      await loginAs(teacherCtx, 'teacher');
      await loginAs(studentCtx, 'student');

      // Pre-cleanup — if a previous run left the dev student in an
      // active session, the empty-state assertion below would fail.
      // We close from the teacher account that owned that session
      // (or any teacher, since the dev seed has a single teacher).
      const teacherCookie = cookieHeaderFromContext(await teacherCtx.cookies());
      const studentCookie = cookieHeaderFromContext(await studentCtx.cookies());
      await endActiveSessionFor(studentCookie, teacherCookie);

      const teacherPage = await teacherCtx.newPage();
      const studentPage = await studentCtx.newPage();

      // ── Teacher: compose form ─────────────────────────────────────────────
      await teacherPage.goto('/teacher/focus');
      await expect(teacherPage.getByTestId('teacher-focus-page')).toBeVisible();
      await expect(teacherPage.getByTestId('focus-create-form')).toBeVisible();

      // Activity kind defaults to AI_TUTOR. Fill the topic with a
      // distinctive Cyrillic string so we can match it on the student side.
      const TOPIC = `Физик · Хүчний моментийн ${Math.floor(Math.random() * 9000) + 1000}`;
      await teacherPage.locator('#focus-topic').fill(TOPIC);

      // Submit. The compose form swaps for the hero card on success.
      await teacherPage.getByRole('button', { name: 'Фокус сесс үүсгэх' }).click();

      const codeEl = teacherPage.getByTestId('focus-code');
      await expect(codeEl).toBeVisible();
      const code = (await codeEl.textContent())?.trim() ?? '';
      expect(code, 'hero must render a 6-char join code').toMatch(/^[A-Z0-9]{6}$/);

      // ── Student: join with the code ───────────────────────────────────────
      await studentPage.goto('/student/focus');
      await expect(studentPage.getByTestId('student-focus-empty')).toBeVisible();
      await expect(studentPage.getByTestId('focus-join-form')).toBeVisible();

      await studentPage.locator('#focus-join-code').fill(code);
      await studentPage.getByRole('button', { name: 'Нэгдэх' }).click();

      // Lock screen renders with the AI Tutor topic as the H1.
      await expect(studentPage.getByTestId('student-focus-lock')).toBeVisible();
      await expect(studentPage.getByRole('heading', { name: TOPIC })).toBeVisible();
    } finally {
      await teacherCtx.close();
      await studentCtx.close();
    }
  });
});
