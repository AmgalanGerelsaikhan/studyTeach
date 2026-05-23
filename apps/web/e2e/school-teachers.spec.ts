import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

/**
 * School admin → /school → persona home (with logout chip) → "Багш нар үзэх"
 * → /school/teachers renders.
 *
 * The seeded school-admin user is org KH-04 (see seed/index.ts). The
 * persona home must NOT redirect them to a dead-end PersonaStub — see
 * audit finding B2.
 */
test.describe('school admin persona home', () => {
  test('home renders + navigates into /school/teachers', async ({ page, context }) => {
    await loginAs(context, 'schoolAdmin');

    await page.goto('/school');

    // Hero — "Сургуулийн самбар" comes from school.home.title.
    await expect(page.getByRole('heading', { name: 'Сургуулийн самбар' })).toBeVisible();

    // Logout chip — AuthStatus renders a button with testid when authed.
    // The aria-label is "Гарах (SCHOOL_ADMIN)" (logout key + role).
    await expect(page.getByTestId('auth-logout-button')).toBeVisible();
    await expect(page.getByTestId('auth-logout-button')).toHaveText('Гарах');

    // Click the "Багш нар үзэх" CTA → /school/teachers.
    await page.getByRole('button', { name: 'Багш нар үзэх' }).click();
    await page.waitForURL('**/school/teachers');

    // Page renders with its own heading.
    await expect(page.getByRole('heading', { name: 'Багш нарын CPD' })).toBeVisible();
  });
});
