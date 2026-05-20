# ADR-0007: HttpOnly + SameSite=Strict + Secure cookie sessions

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** security-compliance, frontend-architect
- **Affects:** Auth, every authenticated endpoint, PWA

## Context

We need to authenticate students, teachers, parents, school admins, and platform admins from a PWA on a wide range of devices. Sessions must survive offline periods (up to 7 days). XSS exposure must not leak session tokens. CSRF protection is required.

## Decision

Sessions are stored in a single cookie:

- Name: `__Host-st-sid`
- `HttpOnly` — not readable by JavaScript.
- `SameSite=Strict` — never sent on cross-site requests.
- `Secure` — only over HTTPS.
- `Path=/` — sent on all paths.

Max-Age 24 hours; sliding refresh up to 7 days total.

CSRF protection via double-submit token: a non-HttpOnly companion cookie `__Host-st-csrf` and a matching `X-CSRF-Token` header on state-changing requests.

**No bearer tokens** in headers exposed to JavaScript.

## Consequences

### Positive

- XSS cannot exfiltrate the session token (HttpOnly).
- CSRF is mitigated by SameSite=Strict + double-submit token.
- `__Host-` prefix prevents subdomain takeover from swapping the cookie.
- Cookie flows cleanly through service worker + fetch — no auth state to synchronize with the SW.

### Negative

- Cross-origin requests from a third-party (e.g., embedded LMS) cannot include the session. We accept this — we have no cross-origin auth use case in v2.0.0.
- 7-day max session means a user offline for 8+ days must re-auth on reconnect. Acceptable for our threat model.

### Neutral

- If we ever add a native app via Capacitor (P2), it shares the cookie with the WebView; no API change needed.

## Alternatives considered

### JWT in localStorage / sessionStorage

- Pros: easy for developers; works across origins.
- Cons: XSS-exfiltration vector; no httpOnly equivalent.
- Why rejected: directly violates PRD §8.1.

### JWT in Authorization header (with refresh token in cookie)

- Pros: stateless, common pattern.
- Cons: access token is client-readable, defeating one purpose of using cookies.
- Why rejected: same XSS risk.

### Session in IndexedDB

- Pros: large storage, programmatic access.
- Cons: still client-readable.
- Why rejected: same XSS risk.

## References

- PRD §8.1.
- `docs/SECURITY_PRIVACY.md`.
- ADR-0008 (idempotency).
