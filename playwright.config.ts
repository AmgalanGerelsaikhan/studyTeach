import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for MozaTeach E2E smoke pass.
 *
 * The web app runs on :3000 and the NestJS API on :4000 (both per
 * apps/{web,api}/package.json defaults). Locally we expect both servers to
 * be already up — `reuseExistingServer: true` keeps a hot dev loop. In CI
 * the workflow boots them before invoking `pnpm test:e2e`, so the same
 * `reuseExistingServer` branch wins there too: playwright sees :3000 alive
 * and does not try to re-spawn.
 *
 * `slowMo: 0` is intentional: we are NOT using slowMo to simulate 3G. The
 * 3G/throttle profile lives in dedicated specs (deferred to the next pass)
 * via a CDP `Network.emulateNetworkConditions` call. These smokes run at
 * full speed to keep the CI budget under 15 min (qa-test-engineer hard
 * constraint: total CI ≤15m).
 */

const PORT = Number(process.env.WEB_PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'apps/web/e2e',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false, // surfaces sharing the focus session must not race
  forbidOnly: !!process.env.CI,
  retries: 0, // qa-test-engineer constraint: fix flakes, don't mask
  workers: 1, // single worker — the dev DB has shared state
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      // 390×844 matches iPhone 13/14 portrait and the design-system
      // mobile-first breakpoint (apps/web/components/student/* uses 390 as
      // the floor for mobile-nav layout).
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
