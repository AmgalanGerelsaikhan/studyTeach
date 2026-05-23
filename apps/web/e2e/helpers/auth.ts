import { expect, request } from '@playwright/test';
import type { APIRequestContext, BrowserContext } from '@playwright/test';

/**
 * Dev login helper. Bypasses the UI and posts straight to /auth/login on the
 * NestJS server (default :4000). The HttpOnly `st-sid` cookie returned by
 * the API is then re-pinned onto the playwright BrowserContext for the
 * web origin (default :3000) so subsequent page.goto() requests are
 * already authenticated.
 *
 * Rationale:
 *   - faster: skips re-rendering the login screen for every spec
 *   - more reliable: the form has next-intl + RSC roundtrips and was the
 *     #1 source of flake in early smoke runs (qa-test-engineer hard
 *     constraint #1: no flake retries)
 *
 * NOTE: All seeded fixture users have two_factor_enabled = FALSE so the
 * /auth/login endpoint returns the Me payload directly. If 2FA is ever
 * re-enabled for these phone numbers this helper must be updated.
 */
export type DevRole = 'student' | 'teacher' | 'parent' | 'schoolAdmin' | 'platformAdmin';

interface DevCredential {
  phone: string;
  password: string;
}

const CREDENTIALS: Record<DevRole, DevCredential> = {
  student: { phone: '+97688110001', password: 'dev-password' },
  teacher: { phone: '+97688110002', password: 'dev-password' },
  parent: { phone: '+97688110003', password: 'dev-password' },
  schoolAdmin: { phone: '+97688110004', password: 'dev-password' },
  platformAdmin: { phone: '+97688110005', password: 'dev-password' },
};

const API_BASE = process.env.PLAYWRIGHT_API_BASE ?? 'http://localhost:4000';
const WEB_BASE = process.env.PLAYWRIGHT_WEB_BASE ?? 'http://localhost:3000';

// Cookie name comes from SessionService.cookieName() — `st-sid` in dev.
// In production the API switches to `__Host-st-sid`, but the CI workflow
// runs API with NODE_ENV !== 'production'.
const SESSION_COOKIE_NAME = 'st-sid';

interface LoginSuccess {
  user_id: number;
  primary_role: string;
  organization_code: string | null;
  locale: string;
}

interface Login2faChallenge {
  requires_2fa: true;
  challenge: string;
}

/**
 * Log a dev user in by API and install the session cookie on the given
 * playwright BrowserContext. After this returns, any page.goto in that
 * context is authenticated as the chosen role.
 */
export async function loginAs(context: BrowserContext, role: DevRole): Promise<LoginSuccess> {
  const creds = CREDENTIALS[role];

  // Use a *fresh* APIRequestContext so the cookie jar is isolated from
  // the browser context — we want to capture the Set-Cookie header
  // ourselves and re-pin, not piggyback playwright's own jar.
  const api = await request.newContext({ baseURL: API_BASE });
  try {
    const sessionId = await postLogin(api, creds);
    const webUrl = new URL(WEB_BASE);
    await context.addCookies([
      {
        name: SESSION_COOKIE_NAME,
        value: sessionId,
        domain: webUrl.hostname,
        path: '/',
        httpOnly: true,
        secure: false, // dev cookies are not Secure (no HTTPS on localhost)
        sameSite: 'Strict',
      },
    ]);
    return await fetchMe(api, sessionId);
  } finally {
    await api.dispose();
  }
}

async function postLogin(api: APIRequestContext, creds: DevCredential): Promise<string> {
  const res = await api.post('/auth/login', {
    data: { phone_number: creds.phone, password: creds.password },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status(), `login for ${creds.phone} should succeed`).toBe(201);

  const body = (await res.json()) as LoginSuccess | Login2faChallenge;
  if ('requires_2fa' in body && body.requires_2fa) {
    throw new Error(
      `loginAs: dev user ${creds.phone} requires 2FA — the seed must keep two_factor_enabled FALSE`,
    );
  }

  // Playwright's APIRequestContext exposes Set-Cookie via headersArray.
  const cookieHeaders = res.headersArray().filter((h) => h.name.toLowerCase() === 'set-cookie');
  const sidLine = cookieHeaders
    .map((h) => h.value)
    .find((v) => v.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (!sidLine) {
    throw new Error(
      `loginAs: API did not return a ${SESSION_COOKIE_NAME} cookie. Got: ${cookieHeaders
        .map((h) => h.value)
        .join('; ')}`,
    );
  }
  const value = sidLine.split(';', 1)[0]!.slice(SESSION_COOKIE_NAME.length + 1);
  if (!value) throw new Error('loginAs: session cookie value was empty');
  return value;
}

async function fetchMe(api: APIRequestContext, sessionId: string): Promise<LoginSuccess> {
  const res = await api.get('/me', {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${sessionId}` },
  });
  expect(res.status(), '/me should be 200 after login').toBe(200);
  return (await res.json()) as LoginSuccess;
}
