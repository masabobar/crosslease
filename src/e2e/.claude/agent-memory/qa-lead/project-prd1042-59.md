---
name: project-prd1042-59
description: US 28.15 User Provisioning — 14 ACs, DoR PASS, updated 2026-07-08 for Bank Admin role (bank_admin), 12 scenario blocks
metadata:
  type: project
---

**Status:** UAT ready (Jira status confirmed 2026-07-08)

**Story overview:**

- US 28.15 | User Management | User Provisioning
- 14 ACs — DoR PASS (description present, stakeholder-reviewed by Philipp Maute)
- Epic PRD1042-39 (Epic 28 User Management & Authentication)
- Figma Stage 2 PARTIAL — PRD1042-521 UI/UX subtask Done but URL not linked

**Bank Admin update (2026-07-08):**

- Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), Bank Admin role (`bank_admin`) added.
- Provisioning actor for bank tenant users moved from System Admin → Bank Admin.
- System Admin now provisions platform-level users only (System Admin, Support User, Auditor).
- Bank Admin provisions bank tenant users within own tenant only (Front Office, Back Office, LC User).
- Bank Admin cannot provision another Bank Admin — assigned only at tenant creation via System Admin (US 29.x).
- Bank Admin cannot provision cross-tenant (404 per RefiNext tenant-isolation domain rule).
- Bank Admin cannot provision platform-level users (403 boundary).

**RBAC role matrix — 7 roles:**

1. `system_admin` (platform) — platform users only
2. `support_user` (platform) — no provisioning
3. `auditor` (platform) — no provisioning
4. `bank_admin` (bank_tenant) — bank tenant users within own tenant
5. `front_office` (bank_tenant) — no provisioning
6. `back_office` (bank_tenant) — no provisioning
7. `leasing_company_user` (leasing_company) — no provisioning

**Scenario blocks after update:** 12 (3 Outlines + 9 Scenarios)

- 2 happy-path Outlines (System Admin platform, Bank Admin bank tenant)
- 10 main-error scenarios covering AC-01/02/04/05/06/07/11 (5 variants)/12

**AC-11 expanded coverage (5 scenarios):**

1. Unauthorized role cannot provision (@e2e-ready, 4 role Outline: Support, Auditor, FO, LC User)
2. System Admin cannot provision bank tenant users (4 role Outline)
3. Bank Admin cannot provision another Bank Admin (single scenario, tenant creation boundary)
4. Bank Admin cannot provision platform-level users (3 role Outline)
5. Bank Admin cannot provision cross-tenant (404-not-403 per tenant-isolation domain rule)

**How to apply:** When updating any User Management story that references provisioning capability, use the 7-role RBAC matrix. Bank Admin is the sole authority for bank tenant user provisioning. System Admin platform-only scope is a hard boundary. Cross-tenant attempts by Bank Admin surface as 404, not 403.

Related: [[project-prd1042-48]] (Role Assignment story where the Bank Admin decision originates)
