import { expect, test } from '@playwright/test';

import { expectNoSeriousA11yViolations } from './helpers/a11y';
import { loginAs } from './helpers/auth';

/**
 * Parent → /parent → pre-linked child → "PSR харах" → child PSR.
 *
 * The dev seed pre-verifies parent #3 ↔ student #47 (see
 * apps/api/src/db/seed/index.ts), so the parent hub should render at
 * least one child tab on first navigation — no link-flow needed.
 */
test.describe('parent link & PSR view', () => {
  test('pre-linked child renders + child PSR page renders identity', async ({ page, context }) => {
    await loginAs(context, 'parent');
    await page.goto('/parent');

    // Hub shell.
    await expect(page.getByTestId('parent-home')).toBeVisible();

    // The pre-linked child renders. We don't assert the exact name string
    // because the seed only writes the student row, not a display name
    // (display name comes from `users.email` via PSR.identity). The
    // child selector wraps every linked child in a Link with the
    // `data-child-id` attribute, which is the stable contract.
    const childChip = page.getByTestId('parent-child-selector').locator('[data-child-id]');
    await expect(childChip.first()).toBeVisible();
    const studentId = await childChip.first().getAttribute('data-child-id');
    expect(studentId, 'child link must expose data-child-id').toBeTruthy();
    expect(studentId).toBe('47');

    // Summary card with the "PSR харах" link to /parent/children/47/psr.
    const psrLink = page.getByRole('link', { name: 'PSR харах' });
    await expect(psrLink).toBeVisible();

    // Run a11y on the hub BEFORE navigating away. WCAG 2.1 AA, serious+.
    await expectNoSeriousA11yViolations(page);

    await psrLink.click();
    await page.waitForURL(`**/parent/children/${studentId}/psr`);

    // Identity + sections render. Section titles come from
    // parent.childPsr.{identity,grades,olympiads}.title in messages.
    await expect(page.getByRole('heading', { name: 'Хүүхдийн зөөврийн бүртгэл' })).toBeVisible();
    await expect(page.getByText('Хувийн мэдээлэл', { exact: false })).toBeVisible();
    await expect(page.getByText('Дүн ба үнэлгээ', { exact: false })).toBeVisible();
    await expect(page.getByText('Олимпиад', { exact: false }).first()).toBeVisible();
  });
});
