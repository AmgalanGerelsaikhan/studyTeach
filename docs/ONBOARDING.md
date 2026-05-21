# Engineer Onboarding

> First two weeks for a new engineer. Complements [`SETUP.md`](./SETUP.md) (which is the technical install).

Welcome. This document is your week-1 and week-2 plan.

## Day 1 — orient

- [ ] Read [`PRD.md`](../PRD.md) §1, §2, §3, §10 (objectives, non-goals, roles, success metrics). Skip the schema for now.
- [ ] Read [`CLAUDE.md`](../CLAUDE.md) end to end. **Hard constraints are not optional.**
- [ ] Read [`AGENTS.md`](../AGENTS.md). Understand who owns what.
- [ ] Skim [`FEATURE_DEVELOPMENT_PLAN.md`](../FEATURE_DEVELOPMENT_PLAN.md) for current sprint.
- [ ] Open the design prototype: `python3 -m http.server 8080` inside `studyTeach (2)/`, browse [`studyTeach.html`](../studyTeach%20%282%29/studyTeach.html).

## Day 2 — install

- [ ] Follow [`SETUP.md`](./SETUP.md). Get `pnpm dev` running.
- [ ] Install **Noto Serif Mongolian** font system-wide.
- [ ] Install Mongolian Cyrillic keyboard layout in your OS.
- [ ] Verify Storybook renders the Ger Interior design system.
- [ ] Verify a migration applies + seed data loads.

## Day 3 — read the prototype

- [ ] Read [`docs/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).
- [ ] Walk through every persona screen in `studyTeach (2)/`. Goal: be able to describe the Ger Interior aesthetic in one sentence.
- [ ] Identify five design tokens you'd most like to memorize (cream, ember, brass, soot, ink).
- [ ] Pair with `ger-design-system` for 30 minutes on motifs.

## Day 4 — read the data model

- [ ] Read [`docs/DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) end to end.
- [ ] Sketch the data flow for a single Olympiad registration on paper.
- [ ] Run a few queries against your local Postgres to confirm understanding.

## Day 5 — read the trust model

- [ ] Read [`docs/SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md).
- [ ] Read [`docs/API_CONVENTIONS.md`](./API_CONVENTIONS.md).
- [ ] Pair with `security-compliance` for 30 minutes on the RBAC matrix.

## Day 6 — read the offline model

- [ ] Read [`docs/OFFLINE_STRATEGY.md`](./OFFLINE_STRATEGY.md).
- [ ] Trigger the offline E2E test: `pnpm test:e2e:offline`. Watch a queued write replay.
- [ ] Disable network in DevTools, take an action, re-enable, see the replay.

## Day 7 — read the localization model

- [ ] Read [`docs/LOCALIZATION.md`](./LOCALIZATION.md).
- [ ] Open `mn-Cyrl/common.json`. Read 10 strings; try to mentally translate them.
- [ ] Pair with `mongolian-localization` for 30 minutes on the curriculum glossary.

## Day 8-10 — first PR

- [ ] Pick a "good first issue" labeled `onboarding`.
- [ ] Follow [`CONTRIBUTING.md`](./CONTRIBUTING.md) flow end to end.
- [ ] Get one PR merged. Aim for a small, real change — not a documentation-only PR.

## Day 11-14 — first epic

- [ ] Owner agent assigns you a small slice of the current sprint.
- [ ] Pair-program the first hour.
- [ ] Open a PR by end of week 2.
- [ ] Demo at the Friday sprint demo.

## Tools

Make sure you have:

| Tool                        | Why                        |
| --------------------------- | -------------------------- |
| VS Code or Cursor           | IDE                        |
| Docker Desktop              | Postgres + Redis           |
| Mongolian Cyrillic keyboard | Translation work           |
| Noto Serif Mongolian font   | Rendering Mongolian script |
| Playwright                  | E2E debugging              |
| Postman or similar          | Hitting the API directly   |
| Chrome with 3G throttling   | Mobile perf testing        |
| A real Android phone        | PWA install testing        |
| A real iPhone               | PWA install testing        |

## Channels

| Channel         | Use                             |
| --------------- | ------------------------------- |
| `#general`      | Team-wide chatter               |
| `#engineering`  | Engineering questions           |
| `#ops`          | On-call, deploys, incidents     |
| `#design`       | Ger Interior design discussions |
| `#localization` | Mongolian translation review    |
| `#post-mortems` | Read-only stream of learnings   |
| `#onboarding`   | Help for new engineers          |

## Things that may surprise you

- We default to Mongolian Cyrillic everywhere. English copy is the exception, not the rule.
- We use no emojis in product UI. (Still allowed in commits and docs.)
- Integration tests hit a real Postgres, never mocks. (Past incident.)
- The PWA is mandatory; we don't have a native app yet.
- We don't deploy on Sunday evenings or during Olympiad registration windows.
- Wellbeing is firewalled — even most engineers can't read free-text responses.
- Audit logs are append-only. Even DBAs can't UPDATE them.

## Reading list (optional, ranked)

1. [`PRD.md`](../PRD.md) — fully, when you have time.
2. [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md).
3. [`docs/CODING_STANDARDS.md`](./CODING_STANDARDS.md).
4. [`docs/TESTING_STRATEGY.md`](./TESTING_STRATEGY.md).
5. ADRs in `docs/adr/` chronologically.
6. Module specs in `docs/modules/` — read the one(s) you're working on.

## Mentor

You'll be paired with a mentor for the first two weeks. They are not your manager; they are your "what does this mean" person. Bother them generously.

## End of week 2 self-check

By the end of week 2, you should be able to:

- [ ] Explain the four asymmetries the platform addresses.
- [ ] Name the five user roles.
- [ ] Describe the Ger Interior aesthetic in one sentence.
- [ ] Identify which agent owns a given file.
- [ ] Locate the canonical refusal text.
- [ ] Trigger the offline E2E suite.
- [ ] Open a PR following all conventions.
- [ ] Know who to escalate to for a SEV-1.

If you can't tick a box, that's fine — ask your mentor or the relevant agent owner.

Welcome aboard.
