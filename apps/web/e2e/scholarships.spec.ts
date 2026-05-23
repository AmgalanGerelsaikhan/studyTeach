import { expect, request, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:4000';

/**
 * Student scholarship aggregator (PRD §4.10b).
 *
 * Per the qa-test-engineer brief, we never hardcode scholarship IDs or
 * destination codes — the seed re-runs in CI and rows are deterministic
 * per fixture file, but their IDs are not. We discover a destination via
 * the public list endpoint, then apply that filter and assert the result
 * count changes.
 */
test.describe('scholarship aggregator', () => {
  test('apply destination filter, open detail, see watch button', async ({ page, context }) => {
    await loginAs(context, 'student');

    // ── Discover the full catalog + a usable destination code ─────────────
    const api = await request.newContext({ baseURL: API_BASE });
    const cookies = await context.cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const listRes = await api.get('/study-abroad/scholarships', {
      headers: { cookie: cookieHeader },
    });
    expect(listRes.status(), 'scholarship list endpoint reachable').toBe(200);
    const { items } = (await listRes.json()) as {
      items: Array<{ scholarship_id: number; destination_code: string; name_mn: string }>;
    };
    expect(items.length, 'seed must produce at least 2 scholarships').toBeGreaterThan(1);

    // Pick a destination that has at least one but not all of the rows so
    // the filter actually changes the count.
    const totalCount = items.length;
    const destCounts = new Map<string, number>();
    for (const item of items) {
      destCounts.set(item.destination_code, (destCounts.get(item.destination_code) ?? 0) + 1);
    }
    const filterableDest = [...destCounts.entries()].find(([, c]) => c >= 1 && c < totalCount)?.[0];
    expect(
      filterableDest,
      'seed should produce >=2 destinations so the filter actually narrows',
    ).toBeTruthy();
    const expectedFilteredCount = destCounts.get(filterableDest!)!;
    await api.dispose();

    // ── Visit the catalog and verify the unfiltered count ─────────────────
    await page.goto('/student/abroad/scholarships');
    await expect(page.getByTestId('student-abroad-scholarships')).toBeVisible();

    const grid = page.getByTestId('student-abroad-scholarship-grid');
    await expect(grid).toBeVisible();
    await expect(grid.locator('> li')).toHaveCount(totalCount);

    // ── Apply destination filter ──────────────────────────────────────────
    await page.getByTestId('scholarship-filter-destination').selectOption(filterableDest!);

    // After the URL changes, the server component re-renders. Wait until
    // the URL reflects the new param so we don't race the navigation.
    await page.waitForURL((u) => u.searchParams.get('destination_code') === filterableDest);
    await expect(grid.locator('> li')).toHaveCount(expectedFilteredCount);

    // ── Open the first scholarship detail ─────────────────────────────────
    const firstCard = grid.locator('> li').first();
    const detailLink = firstCard.getByRole('link').last();
    await detailLink.click();

    await page.waitForURL(/\/student\/abroad\/scholarships\/\d+/);
    await expect(page.getByTestId('student-abroad-scholarship-detail')).toBeVisible();

    // "Анхааруулах хүсэлт" — the WatchButton label from scholarship.watchCta.
    await expect(page.getByRole('button', { name: 'Анхааруулах хүсэлт' })).toBeVisible();
  });
});
