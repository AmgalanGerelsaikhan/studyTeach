# ADR-0004: PWA at launch; Capacitor wrapper in Phase 2

- **Status:** Accepted
- **Date:** 2026-05-20
- **Deciders:** frontend-architect, offline-pwa-engineer
- **Affects:** `apps/web/`, mobile distribution strategy

## Context

The platform must run on a wide range of devices — feature phones (via SMS/USSD, not the app itself), low-spec Android phones used in herder families, and modern iPhones in UB. Connectivity ranges from no signal to 4G. The PRD mandates ≥7 days of offline functionality.

App store deployments add friction (developer accounts, review cycles, multi-binary maintenance) that a small team can't afford in P0.

## Decision

Ship as a **Progressive Web App** at P0. Add **Capacitor** wrappers for iOS and Android in Phase 2 (P2), reusing the same web codebase.

## Consequences

### Positive

- One codebase across all devices.
- No app store review cycle.
- Updates roll automatically (service worker version bump).
- Offline capability is first-class.
- Install via "Add to Home Screen" works on both platforms.
- Reduces P0 scope dramatically.

### Negative

- iOS Safari PWA install path is unintuitive; needs UX hand-holding.
- iOS PWAs have storage quotas and background-sync limitations relative to native.
- No access to certain native APIs in P0 (e.g., richer push notifications). We rely on SMS for hard pushes.
- Some institutional users expect "an app on the store"; we need to communicate why PWA is the right choice.

### Neutral

- Capacitor wrapper in P2 means our web stack must remain web-compatible (don't depend on anything that breaks under Capacitor).

## Alternatives considered

### Native iOS + Android

- Pros: maximum platform integration, best background sync.
- Cons: two new codebases, app-store overhead, larger team needed.
- Why rejected: P0 scope explosion; PWA covers our use cases.

### React Native

- Pros: shared JS across iOS/Android.
- Cons: still two-binary distribution, divergent web vs. native UX, larger learning curve for a small team.
- Why rejected: PWA is good enough and faster.

### Flutter

- Pros: high performance, beautiful UI.
- Cons: separate language (Dart), no shared web codebase.
- Why rejected: doesn't match our TypeScript-first team.

## References

- PRD §5.1, §7.1, §9 (rollout — Capacitor in P2).
- `docs/OFFLINE_STRATEGY.md`.
- `.claude/agents/offline-pwa-engineer.md`.
