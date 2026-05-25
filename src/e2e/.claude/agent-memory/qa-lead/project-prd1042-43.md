---
name: project-prd1042-43
description: PRD1042-43 US 28.1 User Login — DoR PASS, 17 ACs, pipeline complete (Stage 1–4), BDD suite scope-filtered to 10 scenarios (5–10 target), 4 pending stubs for D16/D17/D18
metadata:
  type: project
---

**Story:** PRD1042-43 — "US 28.1 | USER MANAGEMENT | User Login"
**Status:** Approved by Client (2026-05-21)
**Epic:** PRD1042-39 (Epic 28: User Management & Authentication)
**DoR:** PASS — title present, 17 ACs found, status Approved by Client
**Figma link:** NONE — [GAP] Stage 2 visual/UI test cases will be incomplete until design link is added

**Key implementation decisions from comment thread (non-obvious, load-bearing for test authoring):**

1. **JWT validation flags were explicitly added after a security review** (Philipp Maute, 2026-05-07). Prior Refinext build had JWT validation left at framework defaults — tokens effectively trusted regardless of signature or expiry. AC-15 and AC-16 are specifically hardening corrections from that incident. Tests for expired/tampered/wrong-issuer/wrong-audience tokens are mandatory (not optional hardening).

2. **"Signing key per service" re-calibrated for Modular Monolith** (Philipp, 2026-05-15): One centralised JWT issuing function, one signing key, externally managed (vault/secret manager), rotatable without redeployment. All modules validate against same key. Do NOT interpret as microservice-per-service key pattern.

3. **"Exactly one valid role" — primary role only for Sprint 1.** FO/BO separation is MaRisk-hard and cannot be relaxed. Overlay concept (delegated/temporary/engagement-windowed access) is deferred to PRD1042-341 (Four-Eyes Governance Workflow Engine). AC-11 is strict for Sprint 1: hybrid or unsupported role combinations must be rejected.

4. **Session timeout default is a dev/QA call.** AC-17 states 30-minute idle / 8-hour absolute, but 15-min idle default was discussed. Banking standard is 20–30 min idle. Tenant policy can loosen. The 30-minute value in the AC is the mandated behaviour to test against — any tenant-configurable value is a separate concern.

5. **AC numbering quirk:** Philipp noted in final approval comment (2026-05-19) that both "JWT Validation Enforcement" and "Session Timeout Enforcement" were originally labelled AC-15, with latter renumbered to AC-17 during implementation write-up. The story as fetched from Jira already has them as AC-15 and AC-17 respectively.

6. **Redundancy between AC-13 and AC-15** noted: the "JWT signing key externally managed" bullet in AC-13 overlaps with AC-15. Developer is expected to fold into AC-15. For test traceability, trace JWT key management tests to AC-15, not AC-13.

7. **Blocking E2E dependencies:** AC-14 requires automated tests for expired/tampered/wrong-issuer tokens — this maps directly to **D17** (TEST_JWT_SECRET or test-forge endpoint). AC-16 maps to same dependency. These E2E tests are `test.fixme` until D17 is resolved.

**Why this matters:** This story carries the highest security surface area in Sprint 1. Any test gap on JWT validation, audit logging, or role enforcement has direct MaRisk/regulatory exposure.

**How to apply:** When generating test cases for PRD1042-43, always include: (1) JWT-specific negative cases for all 5 token failure modes, (2) audit log assertions on every login path, (3) role boundary enforcement with exactly-one-role negative cases, (4) tenant/LC scope validation, (5) flag D17 and D16 as blockers on the relevant E2E specs.

**Pipeline completion (2026-05-22):**
- Stage 1: COMPLETE — 17 ACs, DoR PASS
- Stage 2: SKIPPED — no Figma link (GAP logged)
- Stage 3: SKIPPED (no design data) — all 17 ACs cannot be compared; design gap is an ongoing MAJOR flag for UI ACs
- Stage 4: COMPLETE (2026-05-22) — scope filter applied, 10 scenarios (6 active + 4 pending stubs), all 17 ACs traced
- Test suite file: `src/e2e/tests/PRD1042-43 User Login.md`

**Stage 4 scope filter outcome (definitive — 2026-05-22 run):**
- happy-path: AC-03, AC-04, AC-06, AC-07 — all collapsed into 1 Scenario Outline (6 roles × redirect assertion)
- main-error: AC-05 (unauthenticated + partial-MFA access), AC-08 (wrong credentials), AC-09 (account status Outline)
- auto-applied RefiNext domain negatives: AC-11 (no-role blocks session), AC-12 (tenant isolation 404), AC-13 (LC user scope restriction + 403 on bank API)
- edge-case (active assertion in happy-path): AC-02 (same error as AC-08 — no separate scenario), AC-01 (form render — exploratory only), AC-14 (audit log assertion inside Outline)
- separate-feature pending stubs: AC-10 (@d18), AC-15 (@d17), AC-16 (@d17), AC-17 (@d16)

**E2E blockers — only affect pending stubs; all 6 active scenarios are unblocked:**
- D16: TEST_TOKEN_TTL_SECONDS → AC-17 session timeout stub
- D17: TEST_JWT_SECRET / test-forge endpoint → AC-15 (expired JWT) + AC-16 (tampered JWT) stubs
- D18: Admin API to reset lockout counter → AC-10 lockout stub

**Patterns observed — applicable to future stories in Epic 28:**
- Every auth/login story will need: tenant isolation 404 tests, FO/BO disjunct negative case, audit log coverage on every failure path, role-scope boundary negative cases.
- MFA scenarios should always be tagged as test.fixme until auth provider (R1) is resolved.
- Scope filter is mandatory before writing scenarios: happy-path + main-error only. Timing/lockout/implementation details go to separate files. Target 5–10 scenarios per story.

Related memories: [[project-refinext-overview]], [[reference-jira]]
