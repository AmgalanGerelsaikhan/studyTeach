import { expect, test } from '@playwright/test';

import { expectNoSeriousA11yViolations } from './helpers/a11y';
import { loginAs } from './helpers/auth';

/**
 * Student → /student/psr → identity card + the standard PSR sections.
 *
 * Seed fixture (apps/api/src/db/seed/index.ts) places the dev student at
 * UB-23, grade 11, with display name derived from email = student@dev.local.
 */
test.describe('student PSR', () => {
  test('renders identity, school, grade, sections', async ({ page, context }) => {
    await loginAs(context, 'student');
    await page.goto('/student/psr');

    await expect(page.getByTestId('student-psr')).toBeVisible();

    // Hero title.
    await expect(page.getByRole('heading', { name: 'Зөөврийн сурагчийн бүртгэл' })).toBeVisible();

    // Identity card — display name is the email per PsrService.identity.
    await expect(page.getByText('student@dev.local')).toBeVisible();

    // School chip — code is rendered as-is (UB-23) inside a brass chip.
    await expect(page.getByText('UB-23', { exact: true })).toBeVisible();

    // Grade chip — i18n template: "{n}-р анги" → "11-р анги".
    await expect(page.getByText('11-р анги', { exact: false })).toBeVisible();

    // Section headers visible (mn-Cyrl).
    await expect(page.getByText('Хувийн мэдээлэл', { exact: false })).toBeVisible();
    await expect(page.getByText('Дүнгийн түүх', { exact: false })).toBeVisible();
    await expect(page.getByText('Олимпиадын оролцоо', { exact: false })).toBeVisible();

    await expectNoSeriousA11yViolations(page);
  });
});
