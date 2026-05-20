<!-- Use a Conventional Commits title: feat(scope): description -->

## What & why

<!-- One paragraph. What does this PR do, and why is it needed? -->

## Links

- PRD section: PRD §
- Epic: EPIC-
- Sprint: S
- Module spec (if applicable): `docs/modules/`
- Related ADRs:

## Type of change

- [ ] `feat:` new feature
- [ ] `fix:` bug fix
- [ ] `chore:` tooling, deps, build
- [ ] `docs:` documentation only
- [ ] `refactor:` no behavioral change
- [ ] `perf:` performance
- [ ] `test:` tests only
- [ ] `ci:` CI/CD
- [ ] `revert:` revert prior commit

## Which agent territory does this touch?

<!-- Tag the relevant owner(s) — see AGENTS.md -->

- [ ] frontend-architect
- [ ] backend-architect
- [ ] database-schema
- [ ] ai-tutor-engineer
- [ ] ger-design-system
- [ ] mongolian-localization
- [ ] offline-pwa-engineer
- [ ] payments-integration
- [ ] security-compliance
- [ ] qa-test-engineer

## Hard-constraint checks (CLAUDE.md)

- [ ] Mongolian Cyrillic strings via i18n catalog (no inline `.tsx`/`.ts` strings)
- [ ] Multi-tenant scoping enforced for any new authenticated route
- [ ] Idempotency-Key supported on any new state-changing endpoint
- [ ] Audit log row written for any sensitive action
- [ ] No PII or wellbeing free-text in logs
- [ ] No client-side secrets
- [ ] No emoji in product UI
- [ ] WCAG 2.1 AA verified on changed routes
- [ ] 3G performance budget verified on changed routes

## Equity / non-functional impact

<!-- If this PR moves a metric (PRD §10) or risks a target (§8.4), note it. -->

- Equity metric affected: <!-- none / share outside UB / mock-EGSh gap / etc. -->
- Non-functional target affected: <!-- p95 latency / offline / surge / etc. -->

## Test plan

### Automated

- [ ] Unit tests added/updated
- [ ] Integration tests (real Postgres)
- [ ] E2E (if user flow changed)
- [ ] Offline E2E (if offline-capable feature)
- [ ] A11y axe-core sweep
- [ ] Visual snapshot updated (if UI changed)
- [ ] Refusal regression (if AI Tutor prompts changed)

### Manual

<!-- Describe what you did, on what device, in what locale. -->

- Tested on: <!-- macOS Chrome / iPhone Safari / Android Chrome -->
- Locale tested: <!-- mn-Cyrl / mn-Latn / en -->
- Network: <!-- 3G throttled / online / offline -->

### Runtime verification

- [ ] Dev server started locally (`pnpm dev`)
- [ ] Affected route `curl`ed; response is real rendered HTML, not a loading shell or 500
- [ ] For backend: JSON shape validated, not just a 200
- [ ] Required env vars confirmed loaded inside the running process (not just present in the shell)

<!-- Paste the curl command + a snippet of the rendered response (e.g., a Mongolian Cyrillic string the page should show): -->

```
$ curl -s http://localhost:3000/...
...
```

## Localization

- [ ] No new user-visible strings
- [ ] New `mn-Cyrl` strings added; reviewed by `mongolian-localization`
- [ ] Latin transliteration regenerated
- [ ] English translation added (if Study Abroad / Teacher Academy)

## Security / privacy

- [ ] No new third-party integration (or DPIA filed in `docs/compliance/`)
- [ ] No new PII storage (or encryption-at-rest verified)
- [ ] No change to refusal text (or canonical text updated in `i18n/ai-refusals.json`)
- [ ] No change to wellbeing handling (or clinical reviewer notified)

## Docs

- [ ] Schema change → `docs/DATABASE_SCHEMA.md` updated
- [ ] API change → `docs/API_CONVENTIONS.md` + contract file updated
- [ ] Token change → `docs/DESIGN_SYSTEM.md` updated
- [ ] Trust boundary change → `docs/SECURITY_PRIVACY.md` updated
- [ ] New decision → ADR filed in `docs/adr/`
- [ ] `CHANGELOG.md` `[Unreleased]` updated

## Screenshots / video

<!-- For UI changes, attach screenshots from the target device profile. -->

## Rollout

- [ ] No flag needed — safe to ship on merge
- [ ] Behind a feature flag: `<flag_name>`
- [ ] Requires migration; backwards-compatible
- [ ] Requires migration; non-backwards-compatible (paired deprecation explained below)

<!-- Migration notes: -->

## Risk

<!-- One sentence: what's the worst that happens if this is wrong? -->
