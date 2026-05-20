---
name: Security disclosure (internal)
about: For non-public security issues. Do NOT use for public-visible CVE-style disclosures.
title: "security: "
labels: security, do-not-disclose
assignees: ""
---

> ⚠️ **Do not include exploit details, PoC payloads, or affected user identifiers in public comments.**
> Use a private channel (see `docs/SECURITY_PRIVACY.md`).

## Summary

<!-- One sentence, no exploit details. -->

## Severity (proposed)

- [ ] SEV-1 — data exposure, payment compromise, key compromise, crisis-flag path failure
- [ ] SEV-2 — auth or session weakness, RBAC bypass without data loss
- [ ] SEV-3 — hardening opportunity

## Affected area

- [ ] Auth / sessions
- [ ] Multi-tenant scoping
- [ ] Audit log
- [ ] Payments / signing
- [ ] Wellbeing data path
- [ ] AI Tutor refusals / classifier
- [ ] PII storage / encryption
- [ ] CSRF / rate limiting
- [ ] Other

## What I observed

<!-- Behavior, not exploit. -->

## What concerns me

<!-- Threat model framing. -->

## Suggested next step

- [ ] `security-compliance` triage
- [ ] External disclosure (CVE-style)
- [ ] Internal hotfix
- [ ] Discussion with AIAA leadership

## Visibility

- [ ] Information already public / already disclosed
- [ ] Confidential — restrict access

---

For coordinated disclosure or external reports, see [`docs/SECURITY_PRIVACY.md`](../docs/SECURITY_PRIVACY.md).
