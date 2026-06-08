---
name: project-prd1042-39
description: PRD1042-39 Epic 28 User Management & Authentication — DoR PASS, 42 ACs across 9 categories, no Figma link, key design decisions and open alignment items noted
metadata:
  type: project
---

**Story:** PRD1042-39 — "Epic 28: User Management & Authentication"
**Story Type:** Epic (parent for PRD1042-43 and at least 8 confirmed child stories)
**Status:** Approved by Client (2026-05-19)
**DoR:** PASS — title present, 42 ACs found (9 categories), status Approved by Client
**Figma link:** NONE — [GAP] Stage 2 will be skipped; all test cases will be requirements-driven only

**AC Summary (42 total across 9 categories):**
- A (User Model): AC-A1 to AC-A5 — unique identity, exactly-one-role, platform/tenant/LC distinction
- B (Authentication): AC-B1 to AC-B13 — invitation, login, password, session timeout (15min/8h), MFA, SSO, JWT validation flags, external key management, secret scanning
- C (Role Management): AC-C1 to AC-C3 — 6 roles supported, hybrid roles blocked, one-role-per-user
- D (Tenant & Scope): AC-D1 to AC-D4 — tenant scoping, LC scoping, Auditor time-limited, Support cross-tenant read-only+logged
- E (Separation of Duties): AC-E1 to AC-E4 — FO/BO disjunct (MaRisk-hard), FO cannot approve own work, Four-Eyes role+actor separation, rework preserves separation
- F (Permissions): AC-F1 to AC-F6 — 8 permission verbs (create/view/edit/approve/waive/export/trigger/administer), BAIT/MaRisk/DORA alignment, no route/API bypass, config-derived fields read-only, partner creation restricted to bank-side
- G (LC Restrictions): AC-G1 to AC-G4 — no internal data (risk/KYC/AML/Financing/audit/margin/discount), all state-affecting LC actions via proposal model, LC positive view of own portfolio (server-authoritative, LG-scoped)
- H (User Lifecycle): AC-H1 to AC-H3 — 5 states (invited/active/suspended/deactivated/expired), deactivated lose access but preserved in history, lifecycle changes audit-logged
- I (Audit): AC-I1 to AC-I3 — all provisioning/auth/role/access/scope events logged, Support+Auditor sessions always logged, actor/tenant/resource/timestamp/role/scope at time of action preserved

**15 derived error scenarios** (ES-01 through ES-15): deactivated login, lockout, expired Auditor session, cross-tenant 404, URL/API bypass, role escalation, hybrid role assignment, FO self-approval, LC internal data access, LC state-action without proposal, expired/tampered JWT, CI secret detection, session timeout without re-auth, Support modifying business data, Power User creating business transactions.

**Domain flags triggered (for test generation):**
- FOUR_EYES_ENFORCEMENT (AC-E2, AC-E3) — negative case mandatory
- TENANT_ISOLATION (AC-D1 to AC-D4, ES-04) — cross-tenant must return 404 not 403
- ROLE_BASED_ACCESS (all of Category C and F) — negative cases for each wrong-role scenario
- JWT_VALIDATION (AC-B8, AC-B9) — mandatory hardening; same pattern as PRD1042-43
- AUDIT_TRAIL_BAIT (AC-I1 to AC-I3) — assert on every state-changing path
- LC_PROPOSAL_MODEL (AC-G2, AC-G3) — proposal wrapper required for all LC state actions
- ASYNC_EXPIRY (AC-D3, AC-B13) — Auditor session expiry, session timeout handled async

**Key design decisions from comment thread (non-obvious, load-bearing for test authoring):**

1. **JWT flags** (Philipp, 2026-05-07): AC-B8/B9 added after security review of prior Refinext build where JWT validation left at framework defaults. Same pattern as PRD1042-43. Tests for expired/tampered/wrong-issuer/wrong-audience tokens are non-negotiable.

2. **Session timeout value** (Philipp, 2026-05-07): 15 min inactivity / 8h absolute was anchored to prevent recurrence of prior build where token lifetimes drifted to multi-week windows. 15 min is the test baseline; tenant policy loosening is a separate concern.

3. **Four-Eyes for platform-role changes** (Philipp, 2026-05-11): Currently "may require" not "must require" for Power User / Auditor / BO/Risk role changes. Open alignment point affecting PRD1042-48, -49, -59. Test as SHOULD-test with note that hardening to MUST is pending.

4. **DSGVO retention vs. audit** (Philipp, 2026-05-11): No hard-delete currently; user records preserved. Right-to-erasure path (pseudonymisation vs. anonymisation) is Pkg.2. Tests for deactivation must NOT test hard-delete.

5. **Audit event implementation pattern** (Philipp, 2026-05-11): Denormalised snapshot per audit-event vs. separate role-history table is an open question parked for PRD1042-37. Tests must assert observable outcome (role-at-time reconstructible) without assuming storage pattern.

6. **LC portfolio positive scope** (Vesna orange edits, 2026-05-11): Historical lifecycle progression, Proposal states, bank responses added to AC-G4. Implementation story not yet created (flagged for PRD1042-11 or PRD1042-20). Tests for AC-G4 are requirements-level only.

7. **8 child stories confirmed clean** (Philipp, 2026-05-11): PRD1042-49, -50, -51, -60, -62, -63, -65, -70 confirmed ready. PRD1042-51 (LC Access Restrictions) is the gold standard for LC isolation in this set.

**Open alignment items:**
- Four-Eyes for platform-role changes: pending PRD1042-48/-49/-59 pass
- LC portfolio implementation story: not yet created in PRD1042-11 or PRD1042-20
- PRD1042-16 (Redemption) alignment with proposal-confirmation model: Vesna to handle
- PRD1042-37 (Audit Trail) implementation pattern: denormalised vs. normalised audit record

**Stage 1 completion:** 2026-05-21
**Stage 2:** SKIPPED — no Figma link (GAP logged)
**Stage 3:** SKIPPED (no design data)
**Stage 4:** NOT YET RUN

**Confirmed child stories under this epic:**
PRD1042-43 (US 28.1 Login — pipeline complete), PRD1042-49 (US 28.11 Tenant & Scope), PRD1042-50 (US 28.12 RBAC), PRD1042-51 (US 28.13 LC Access Restrictions), PRD1042-60 (US 28.16 Account Activation), PRD1042-62 (US 28.18 User Reactivation), PRD1042-63 (US 28.19 User Deactivation), PRD1042-65 (US 28.21 Access Scope Validation), PRD1042-70 (US 28.26 Auditor Time-Limited Access)

Related memories: [[project-prd1042-43]], [[project-refinext-overview]], [[reference-jira]]
