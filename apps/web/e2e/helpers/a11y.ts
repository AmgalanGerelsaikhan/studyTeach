import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Run an axe-core audit on the currently-rendered page and assert there
 * are no `serious` or `critical` violations. Lower severities (moderate,
 * minor) are logged but don't fail the build — they're tracked separately
 * per the qa-test-engineer rollup.
 *
 * Per the accessibility checklist in the qa-test-engineer spec we scan
 * for WCAG 2.1 A and AA. Color-contrast is included by default.
 *
 * We `exclude` Next.js's dev-only `<nextjs-portal>` element. It is the
 * framework's own error/refresh overlay, never shipped to prod, and its
 * red toast triggers color-contrast violations that have nothing to do
 * with our design system. Excluding it keeps the dev-run signal honest;
 * prod builds don't render the overlay at all.
 *
 * `KNOWN_ISSUES` is reserved for genuine out-of-scope findings — kept as
 * an empty set so the mechanism stays in place for future use. All three
 * earlier allow-listed rules (aria-allowed-attr on ChildSelector,
 * aria-prohibited-attr on StOfflineBadge, color-contrast on StChip brass)
 * are now fixed in the design system itself.
 */
const KNOWN_ISSUES = new Set<string>([]);

export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('nextjs-portal')
    .analyze();

  const blocking = results.violations.filter(
    (v) => (v.impact === 'serious' || v.impact === 'critical') && !KNOWN_ISSUES.has(v.id),
  );

  if (blocking.length > 0) {
    // Surface the failing rules and the first selector for each so the
    // failure output is actionable without trawling the JSON.
    const summary = blocking
      .map(
        (v) =>
          `[${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node${
            v.nodes.length === 1 ? '' : 's'
          }; first: ${v.nodes[0]?.target.join(' ') ?? '?'})`,
      )
      .join('\n');
    console.error('[a11y] serious+ violations:\n' + summary);
  }

  expect(blocking, 'expected no serious/critical a11y violations').toEqual([]);
}
