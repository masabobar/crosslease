---
name: project-prd1042-45
description: PRD1042-45 US 28.3 Password Reset — DoR PASS, 15 ACs, full pipeline complete (Figma PARTIAL), Stage 3 WARNINGS, 10 scenarios
metadata:
  type: project
---

**Story:** PRD1042-45 — "US 28.3 | USER MANAGEMENT | Password Reset"
**Status:** Dev in progress (was Approved by Client; progressed during 2026-05-25 re-run)
**Epic:** PRD1042-39 (Epic 28: User Management & Authentication)
**DoR:** PASS — title present, 15 ACs found
**Figma link:** https://www.figma.com/design/18XTZEeaxrGDhi4DzZ2QnJ/Design?node-id=167-18629
**Figma extraction_status:** PARTIAL — only the "Set a new password" dialog (node 167:18629) is present. Missing: Forgot Password screen, email confirmation screen, invalid token error screen, MFA verification step, success/completion screen.

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
- AC-10: Password update invalidates old password immediately; old password becomes invalid; token permanently invalid post-reset; MFA gate required for security-sensitive roles (Power User, Auditor, Back Office/Risk) before password committed; MFA via registered authenticator; MFA recovery via separate admin process; MFA freshness window ≤5 min for immediate post-reset session (no second MFA prompt within window)
- AC-11: Old password invalid after reset; previously issued tokens invalidated; MFA state from invalidated sessions unusable; re-auth requires new password only
- AC-12: All active sessions terminated on password change; cross-device invalidation; propagates across all services/auth layers; revoked tokens not trusted downstream
- AC-13: Used token permanently invalid; replay attempts prevented; reuse attempts audit-logged
- AC-14: Post-reset login uses new password only; old password fails; MFA and tenant policy enforced; role-specific auth assurance not weakened
- AC-15: Audit logging — reset request event, completion event, actor/user ref, timestamp, IP/device metadata, tenant/LG context, rate-limit events, token validation failures; immutable records; tokens/passwords never in logs

**Key implementation decisions from comment thread (non-obvious, load-bearing for test authoring):**

1. **Token-in-response-body is a prior incident, not theoretical** (Philipp Maute, 2026-05-07): Prior Refinext build returned the reset token in the HTTP response body without authentication — anyone who could call the endpoint could mint reset tokens for arbitrary users. AC-02 and AC-04 close this explicitly. Tests must assert the token is NOT present in the HTTP response body. This is a mandatory negative test, not optional hardening.

2. **Rate limiting anchored after that same incident** (Philipp, 2026-05-07): Without rate limit the endpoint is an authentication discovery API and notification-spam vector. AC-03 specifics (3/email/hour + IP-based cap) are not arbitrary — they were the negotiated remediation boundary. Test against both the per-email limit and the IP-based limit separately.

3. **MFA gate inside the reset flow** (Philipp, 2026-05-11 + Vesna orange edits confirmed): The _standard_ concern (MFA enforced post-reset at login) was already covered by AC-11/AC-14. Philipp identified the gap: email-account-takeover (SIM-swap, compromised mailbox) can bypass MFA entirely if only the reset token is required. AC-10 adds MFA verification as a gate _before_ the new password is committed, scoped to security-sensitive roles (Power User, Auditor, Back Office/Risk). Lower-risk roles (Front Office, Leasing Company User) use the standard token-only flow. This is a per-role bifurcation in the reset flow — test both paths explicitly.

4. **MFA freshness window** (Philipp, 2026-05-22 — Katarina's double-MFA concern): MFA completed during reset counts as freshly verified for the immediately following session (≤5 min freshness window). No second MFA prompt at login within that window. After 5 min, standard Login + MFA applies. AC-10 and AC-14 both reference this. Test: within the window, post-reset login should not re-prompt for MFA; after the window, it should.

5. **Tenant/LC context isolation throughout the reset flow** (AC-03, AC-04, AC-05 bullets): Reset tokens must be isolated to the originating tenant/LG context. A token generated in Tenant A must not work in Tenant B. Same 404-not-403 cross-tenant isolation principle as elsewhere in Epic 28.

6. **Timing-attack note in AC-02**: "response timing should not expose user existence where technically feasible." This is a should-test, not a must-test. Mark as exploratory / P3 — do not block release on this.

7. **Password policy is centrally governed and configurable** (AC-09, AC-10 security rules): Tests must not hardcode a specific password policy. Test the enforcement mechanism only. IMPORTANT: The Figma design (node 167:18629) hardcodes 5 specific policy rules in the UI checklist — this contradicts AC-09 configurability requirement. Flagged as MAJOR in Stage 3. Tests must not assert against those hardcoded values.

8. **MFA for lost-device recovery** (AC-10): Recovery flow for lost MFA devices is explicitly out of scope — requires separate authorized admin process. Do not write tests for this against PRD1042-45.

**Figma design observations (from 2026-05-25 extraction):**

- Only frame present: "Set a new password" dialog (node 167:18629) — 480px centered modal
- Components: single password input with eye icon, 5-item policy checklist (all same check-circle icon — no met/unmet state), "Update password" button (blue #2d62ef)
- Missing from design: Confirm Password field (required by AC-09), error states on input, disabled/loading button states, MFA step, all other flow screens
- Confirmed labels: heading "Set a new password", field label "Create new password", subtitle "Your new password must be different from your previous one.", button "Update password"
- Password policy checklist items hardcoded (MAJOR gap vs AC-09 configurability): min 8 chars, lowercase, uppercase, number, symbol

**Domain flags triggered (for test generation):**

- SECURITY_NEGATIVE (AC-02, AC-04): Token must not appear in response body — mandatory negative assertion
- RATE_LIMITING (AC-03): Per-email and per-IP limits, distributed enforcement
- TOKEN_LIFECYCLE (AC-04, AC-06, AC-07, AC-08, AC-13): Cryptographic generation, expiry, single-use, reuse prevention
- TENANT_ISOLATION (AC-03, AC-04, AC-05): Token scoped to originating tenant; cross-tenant token reuse must fail
- MFA_GATE_IN_FLOW (AC-10, AC-14): MFA required _before_ password commit for security-sensitive roles (NOT only post-reset at login)
- MFA_FRESHNESS_WINDOW (AC-10, AC-14): ≤5 min freshness; no second MFA prompt within window; standard MFA after window
- ROLE_BIFURCATION (AC-10): Two distinct reset flows by role — MFA-gated path vs. token-only path
- SESSION_INVALIDATION (AC-11, AC-12): Old tokens, MFA state, cross-device sessions, downstream services — all must be invalidated
- AUDIT_TRAIL_BAIT (AC-15): Immutable audit records for every reset event, including rate-limit events and token validation failures
- ASYNC_SESSION_PROPAGATION (AC-12): Session invalidation must propagate across all services/auth layers

**E2E blockers:**

- D17 (TEST_JWT_SECRET / test-forge endpoint): Needed for AC-08 expired/tampered token test cases — same as PRD1042-43 AC-14/AC-16
- D19 (Throwaway user API): Needed for reset-flow E2E tests (create test user, trigger reset, validate new auth)
- D21 (AUDITOR_VALIDITY_MINUTES): MFA-gated path for Auditor role needs time-manipulation; impacts AC-10 Auditor variant
- R1 (auth provider unconfirmed): MFA-gate tests (AC-10) require auth provider to be known — mark as test.fixme

**Open alignment items:**

- MFA for security-sensitive roles during reset (AC-10): auth provider (R1) must be resolved before MFA-gate can be implemented or tested in E2E
- MFA lost-device recovery: deferred to separate admin recovery story (not in scope here)
- Timing-attack mitigation (AC-02 "should"): implementation-dependent, cannot be tested at E2E layer without backend instrumentation
- Figma missing Confirm Password field (DG-02): design team to add before Playwright POM generation
- Figma missing token error screen (DG-08): needed for AC-08 copy assertions
- Figma hardcoded policy checklist (MAJOR): architecture review needed — should be API/config driven

**Stage 1 completion:** 2026-05-21 (initial), re-confirmed 2026-05-25
**Stage 2 completion:** 2026-05-25 — PARTIAL (Set a new password dialog only; 10 design gaps logged)
**Stage 3 completion:** 2026-05-25 — WARNINGS (7 MAJOR mismatches, 3 ambiguities, 0 CRITICAL blockers)
**Stage 4 completion:** 2026-05-25 (full re-run with Figma data)
**Stage 4 output:** /Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-45 Reset Password.md
**Stage 4 scope:** 10 scenarios across AC-01 (1), AC-05 (1), AC-07 (1), AC-08 (1 outline, 3 examples), AC-09 (2), AC-10 (2), AC-14 (2)
**Stage 4 excluded (separate-feature):** AC-02 (D17 blocked), AC-03 (rate limiting), AC-06 (token expiry), AC-12 (session invalidation)
**Stage 4 excluded (edge-case):** AC-04, AC-11, AC-13, AC-15 — recommended as backend integration tests

**2026-07-08 Bank Admin update (per PRD1042-48 Ivan Mladenovic decision 2026-07-06):**

- Bank Admin role added — wire value `bank_admin`, user type `bank_tenant`
- Classification: security-sensitive role under AC-10 (falls under "Power User, Auditor, Back Office / Risk, and other security-sensitive roles defined by tenant security policy")
- Reset flow behavior for Bank Admin is IDENTICAL to Auditor: MFA-gated path (MFA verification required before password commit); MFA freshness window ≤5 min applies
- Change applied: AC-10 MFA scenario converted from single-role Scenario (Auditor only) to Scenario Outline with 2 rows (Auditor auditor@bank.com, Bank Admin bank.admin@bank.com)
- All other ACs remain role-agnostic — no other change needed
- File updated in place; header note preserves change provenance
- Scenario count unchanged (10 blocks); active examples count within outlines increased by 1 (2 privileged roles vs. 1 previously)

Related memories: [[project-prd1042-39]], [[project-prd1042-43]], [[project-prd1042-48]], [[project-refinext-overview]], [[reference-jira]], [[feedback-figma-design-convention]]
