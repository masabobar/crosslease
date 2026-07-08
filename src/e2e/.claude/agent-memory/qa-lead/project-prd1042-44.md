---
name: project-prd1042-44
description: PRD1042-44 US 28.8 Invitation-based Onboarding, 17 ACs, DoR PASS, Figma PARTIAL (activation node still not fetched), Stage 3 WARNINGS, 11 scenario blocks post-2026-07-08 update, 8 ACs blocked by D19/D21/M2, Bank Admin role split from System Admin
metadata:
  type: project
---

PRD1042-44 — US 28.8 | USER MANAGEMENT | Invitation-based Onboarding. Three pipeline runs: 2026-06-02 (node 96:71636), re-run 2026-06-12 (node 396-21006, intended activation screen), and 2026-07-08 update (Bank Admin role split per PRD1042-48).

## Update 2026-07-08 — Bank Admin role split (Ivan Mladenovic decision 2026-07-06)

Per PRD1042-48 update, `bank_admin` (User Type `bank_tenant`) is now the ONLY role authorized to invite bank tenant users. System Admin (`system_admin`) invitations are restricted to platform-level users (System Admin, Support, Auditor). Bank Admin can select any bank tenant role EXCEPT `bank_admin` (assigned at creation only, not via invitation dialog). Jira description (updated 2026-07-07) makes the split explicit: "System Admin (platform) Cannot: administer bank (tenant) user onboarding — that belongs to the Power User (Bank Admin)."

**Scenarios added (5 new blocks, total now 11):**

- HAPPY: System Admin creates invitation for platform-level roles (Outline: Support, Auditor, System Admin)
- HAPPY: Bank Admin creates invitation for bank tenant users within own tenant (Outline: FO, BO, LC User)
- MAIN-ERROR: System Admin role selector excludes bank tenant roles (FO, BO, LC User, Bank Admin)
- MAIN-ERROR: Bank Admin role selector excludes platform-level roles
- MAIN-ERROR: Bank Admin cannot invite users into another tenant → 404 (cross-tenant isolation, RefiNext 404-not-403 rule)
- MAIN-ERROR: Bank Admin role selector excludes `bank_admin` (assigned at creation only)

**Rewritten scenarios:**

- AC-01/AC-11 Bank Admin create Outline (previously generic "Bank Admin" background) now scoped to "Bank Tenant A"
- AC-11 Four-Eyes Outline now specific to System Admin session (privileged platform roles)
- AC-17 promoted from `edge-case` to `main-error` (role-authority split is directly testable via UI role-selector negatives)

**Why:** Story covers the full invitation lifecycle — admin creates invitation, user activates account, admin resends/revokes. 17 ACs. Jira status advanced to Ready for Staging by the 2026-06-12 re-run.

**How to apply:** Activation-side ACs (AC-04–AC-09, AC-13, AC-15) remain blocked by D19 (Throwaway user API) because the activation token is never returned in the API response body (AC-02 forbids it) — design coverage alone cannot unblock them. Only admin-side create (AC-01), role/scope on create (AC-11), unactivated-login-block (AC-10), resend action (AC-14), and the LC RBAC negative (AC-16) are E2E-testable without D19.

## Re-run 2026-06-12 — Stage 2 tooling blocker (IMPORTANT)

- The new node **396-21006** (intended to cover the activation/password-setup screen) could NOT be fetched. No Bash/curl path, no working Jupyter kernel (executeCode returns "No active notebook editor found"), and the claude.ai Figma MCP server exposes no callable design-read function and returns "does not implement resource reads" for resource reads. WebFetch cannot set X-Figma-Token.
- Result: Stage 2 = PARTIAL (degraded). Activation screen STILL unverified. Did not fabricate design data.
- The prior gap (activation ACs lack design coverage) is therefore NOT closed by this re-run — re-run Stage 2 from an environment with curl or working Figma MCP read access.

## Verified design facts (node 96:71636, prior run)

- Admin-side invitation management UI only: User Management table, "Create & invite user" dialog, context menu, profile panel.
- Dialog variants: standard-role (no alert, user created Invited) and privileged-role (amber Four-Eyes alert "This role requires a second authorized admin to approve", user created Pending — Admin, Auditor).
- Success copy: "User created" + "<Name> has been added. An invitation is on its way to <email>."
- Resend invitation: row context menu (ellipsis → "Resend invitation") and profile actions panel.

## Stage 3 mismatches (carried forward — all persist)

- **M2 (MAJOR):** "Revoke invitation" action absent from design; only "Deactivate user" shown. AC-13 blocked.
- **M3 (MAJOR):** Form field labels inside Default Input instances not visible at depth 8 — Confirm Password / policy helper / inline error states unverifiable.
- **M4 (MAJOR):** SUPPORT section shows "Invite user" button, contradicting RBAC (Support cannot create invitations).
- New: MFA enrollment step (mandatory for platform-level roles per security reviewer Philipp Maute) has no verified design coverage.

## Security reviewer notes (Philipp Maute)

- Token TTL = 48h (not 24h).
- MFA enrollment mandatory for platform-level roles (System Admin, Auditor) during activation; platform access blocked until MFA configured. Tenant-level roles follow tenant security policy.

## Blocked ACs (8)

- D19: AC-04, AC-05, AC-06, AC-07, AC-08, AC-09
- M2 + D19: AC-13
- D19 + D21: AC-15

## Scenarios generated (re-run 2026-06-12) — 6 blocks

- AC-01 + AC-11: create Outline (Front Office, Back Office, LC User) → Invited
- AC-11: Four-Eyes Outline (Admin, Auditor) → Pending, amber alert
- AC-01: missing-Email validation error
- AC-10: unactivated-login-block Outline (Invited, Pending)
- AC-14: resend via context menu (action only; old-token invalidation needs D19)
- AC-16: LC User cannot access User Management (RBAC negative)
- All 6 marked @e2e-ready ✅
- File written to existing on-disk folder name: `tests/PRD1042-39-User Management & Authentication/` (NOTE: folder uses `PRD1042-39-` with a hyphen, not a space — match this existing convention)

[[project-prd1042-43]] [[project-prd1042-51]] [[feedback-figma-design-convention]] [[feedback-figma-link-not-bubbled]]
