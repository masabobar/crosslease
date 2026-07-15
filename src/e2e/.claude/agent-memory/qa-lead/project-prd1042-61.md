---
name: project-prd1042-61
description: US 28.17 User Suspension — full pipeline + 2026-07-08 Bank Admin retrofit (bank_admin wire value, dual-tier last-admin guard)
metadata:
  type: project
---

PRD1042-61 US 28.17 User Suspension — original processing 2026-06-05 with 15 ACs, DoR PASS (stakeholder-reviewed by Philipp Maute 2026-05-13, UAT ready). No Figma (backend security story, sibling pattern to PRD1042-46/47/69). Stage 3 SKIPPED design-blind. 7 initial scenario blocks (2 Outlines + 5 Scenarios).

**Retrofit 2026-07-08 — Bank Admin role added:**

- Story description was corrected 6 July 2026: System Admin suspends platform-level users; Power User (Bank Admin) suspends users within its own bank tenant only.
- Wire value `power_user` replaced with `bank_admin` throughout Outlines per PRD1042-48 (Ivan Mladenovic decision 2026-07-06).
- Happy-path Outline now covers 3 admin/target combinations: system_admin→support_user (platform), bank_admin→front_office (tenant), bank_admin→back_office (tenant).
- Four-Eyes Outline (AC-04) updated: bank_admin + back_office as target roles.
- AC-15 last-admin guard **split into two scenarios** to reflect dual-tier wording ("platform must always retain at least one active System Admin, and each bank tenant at least one active Power User (Bank Admin)"):
  - Platform-level guard: last System Admin self-suspension rejected.
  - Tenant-level guard: last Bank Admin within a tenant self-suspension rejected (scoped to tenant `bank-a`).
- File now has 8 scenario blocks (2 Outlines + 6 Scenarios); 4 of 8 @e2e-ready.

**Why:** PRD1042-48 (Role Assignment & Management) moved bank-tenant admin authority from System Admin to a new dedicated `bank_admin` role. User Suspension is one of the operations impacted — Bank Admin now performs tenant-scoped suspensions.

**How to apply:** When reviewing/updating User Management stories that reference "Power User" wire value, always use `bank_admin`. Last-admin guards for user-lifecycle actions (suspend / deactivate / restore) apply symmetrically at both platform (System Admin) and tenant (Bank Admin) levels — write them as sibling scenarios, not a single generic one.

Related: [[project-prd1042-48]] role assignment source of truth, [[project-prd1042-63]] deactivation likely needs same retrofit, [[feedback-epic-folder-naming]].
