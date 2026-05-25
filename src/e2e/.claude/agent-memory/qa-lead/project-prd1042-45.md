---
name: project-prd1042-45
description: PRD1042-45 US 28.3 Password Reset — DoR PASS, 15 ACs, no Figma link, strong security story evolved through 5 comment rounds with critical security incident backstory
metadata:
  type: project
---

**Story:** PRD1042-45 — "US 28.3 | USER MANAGEMENT | Password Reset"
**Status:** Approved by Client (2026-05-19)
**Epic:** PRD1042-39 (Epic 28: User Management & Authentication)
**DoR:** PASS — title present, 15 ACs found, status Approved by Client
**Figma link:** NONE — [GAP] Stage 2 visual/UI test cases will be incomplete until design link is added

**AC Summary (15 total):**
- AC-01: Reset request returns generic success regardless of email existence (account enumeration prevention)
- AC-02: HTTP response status + body identical regardless of email existence; token never in response body; timing-attack mitigation noted
- AC-03: Rate limiting — max 3 requests/email/hour, IP-based throttle, distributed enforcement, rate-limited responses still generic success
- AC-04: Cryptographically secure single-use token, hashed storage, never exposed via UI/API/logs/traces/monitoring
- AC-05: Reset link delivered via email only; configurable expiry; tenant/LC context-aware; delivery failures audit-logged
- AC-06: Token expiry enforced server-side; expired tokens immediately invalid; reuse after expiry prevented
- AC-07: Valid token grants access to password reset page; validation server-side; no platform access until password replaced
- AC-08: Invalid/expired/used token blocked; generic error message (no token state details exposed); validation failures audit-logged
- AC-09: Password policy validation server-side; weak passwords rejected; confirmation mismatch blocks submission
- AC-10: Password update invalidates old password immediately; old password becomes invalid; token permanently invalid post-reset; MFA gate required for security-sensitive roles (Power User, Auditor, Back Office/Risk) before password committed; MFA via registered authenticator; MFA recovery via separate admin process
- AC-11: Old password invalid after reset; previously issued tokens invalidated; MFA state from invalidated sessions unusable; re-auth requires new password only
- AC-12: All active sessions terminated on password change; cross-device invalidation; propagates across all services/auth layers; revoked tokens not trusted downstream
- AC-13: Used token permanently invalid; replay attempts prevented; reuse attempts audit-logged
- AC-14: Post-reset login uses new password only; old password fails; MFA and tenant policy enforced; role-specific auth assurance not weakened
- AC-15: Audit logging — reset request event, completion event, actor/user ref, timestamp, IP/device metadata, tenant/LG context, rate-limit events, token validation failures; immutable records; tokens/passwords never in logs

**Key implementation decisions from comment thread (non-obvious, load-bearing for test authoring):**

1. **Token-in-response-body is a prior incident, not theoretical** (Philipp Maute, 2026-05-07): Prior Refinext build returned the reset token in the HTTP response body without authentication — anyone who could call the endpoint could mint reset tokens for arbitrary users. AC-02 and AC-04 close this explicitly. Tests must assert the token is NOT present in the HTTP response body. This is a mandatory negative test, not optional hardening.

2. **Rate limiting anchored after that same incident** (Philipp, 2026-05-07): Without rate limit the endpoint is an authentication discovery API and notification-spam vector. AC-03 specifics (3/email/hour + IP-based cap) are not arbitrary — they were the negotiated remediation boundary. Test against both the per-email limit and the IP-based limit separately.

3. **MFA gate inside the reset flow** (Philipp, 2026-05-11 + Vesna orange edits confirmed): The *standard* concern (MFA enforced post-reset at login) was already covered by AC-11/AC-14. Philipp identified the gap: email-account-takeover (SIM-swap, compromised mailbox) can bypass MFA entirely if only the reset token is required. AC-10 adds MFA verification as a gate *before* the new password is committed, scoped to security-sensitive roles (Power User, Auditor, Back Office/Risk). Lower-risk roles (Front Office, Leasing Company User) use the standard token-only flow. This is a per-role bifurcation in the reset flow — test both paths explicitly.

4. **Tenant/LC context isolation throughout the reset flow** (AC-03, AC-04, AC-05 bullets): Reset tokens must be isolated to the originating tenant/LG context. A token generated in Tenant A must not work in Tenant B. This is the same 404-not-403 cross-tenant isolation principle as everywhere else in Epic 28.

5. **Timing-attack note in AC-02**: "response timing should not expose user existence where technically feasible." This is a should-test, not a must-test, given it is implementation-dependent. Mark as exploratory / P3 — do not block release on this.

6. **Password policy is centrally governed and configurable** (AC-09, AC-10 security rules): Tests must not hardcode a specific password policy (min length, complexity). Test the enforcement mechanism (weak password rejected, policy-compliant password accepted) — do not assert on specific values that could change with policy config.

7. **MFA for lost-device recovery** (AC-10): Recovery flow for lost MFA devices is explicitly out of scope of this story — it requires a separate authorized admin process. Tests for lost-MFA-device recovery must NOT be written against this story; flag as deferred to a separate recovery story.

**Domain flags triggered (for test generation):**
- SECURITY_NEGATIVE (AC-02, AC-04): Token must not appear in response body — mandatory negative assertion
- RATE_LIMITING (AC-03): Per-email and per-IP limits, distributed enforcement
- TOKEN_LIFECYCLE (AC-04, AC-06, AC-07, AC-08, AC-13): Cryptographic generation, expiry, single-use, reuse prevention
- TENANT_ISOLATION (AC-03, AC-04, AC-05): Token scoped to originating tenant; cross-tenant token reuse must fail
- MFA_GATE_IN_FLOW (AC-10, AC-14): MFA required *before* password commit for security-sensitive roles (NOT only post-reset at login)
- ROLE_BIFURCATION (AC-10): Two distinct reset flows by role — MFA-gated path vs. token-only path
- SESSION_INVALIDATION (AC-11, AC-12): Old tokens, MFA state, cross-device sessions, downstream services — all must be invalidated
- AUDIT_TRAIL_BAIT (AC-15): Immutable audit records for every reset event, including rate-limit events and token validation failures
- ASYNC_SESSION_PROPAGATION (AC-12): Session invalidation must propagate across all services/auth layers — async pattern same as Epic 28 baseline

**E2E blockers:**
- D17 (TEST_JWT_SECRET / test-forge endpoint): Needed for AC-08 expired/tampered token test cases — same as PRD1042-43 AC-14/AC-16
- D19 (Throwaway user API): Needed for reset-flow E2E tests (create test user, trigger reset, validate new auth)
- D21 (AUDITOR_VALIDITY_MINUTES): MFA-gated path for Auditor role needs time-manipulation; impacts AC-10 Auditor variant
- R1 (auth provider unconfirmed): MFA-gate tests (AC-10) require auth provider to be known — mark as test.fixme

**Open alignment items:**
- MFA for security-sensitive roles during reset (AC-10): auth provider (R1) must be resolved before MFA-gate can be implemented or tested in E2E
- MFA lost-device recovery: deferred to separate admin recovery story (not in scope here)
- Timing-attack mitigation (AC-02 "should"): implementation-dependent, cannot be tested at E2E layer without backend instrumentation

**Stage 1 completion:** 2026-05-21
**Stage 2:** SKIPPED — no Figma link (GAP logged)
**Stage 3:** WARNINGS — no Figma link; not a blocker
**Stage 4 completion:** 2026-05-21
**Stage 4 output:** /Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-45 Password Reset.md
**Stage 4 scope:** 10 scenarios across AC-01, AC-02, AC-05, AC-08 (x2), AC-09, AC-10 (x2), AC-14 (x2)
**Stage 4 excluded (separate-feature):** AC-03 (rate limiting), AC-06 (token expiry), AC-12 (session invalidation)
**Stage 4 excluded (edge-case):** AC-04, AC-07, AC-11, AC-13, AC-15 — recommended as backend integration tests

Related memories: [[project-prd1042-39]], [[project-prd1042-43]], [[project-refinext-overview]], [[reference-jira]]
