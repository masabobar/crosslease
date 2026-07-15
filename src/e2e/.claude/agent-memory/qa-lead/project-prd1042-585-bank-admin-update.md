---
name: project-prd1042-585-bank-admin-update
description: 2026-07-08 retrofit of PRD1042-585 Tenant Detail View — added Bank Admin (`bank_admin`) role as own-tenant viewer with limited tab subset, cross-tenant → 404 per PRD1042-48 (Ivan Mladenovic decision 2026-07-06)
metadata:
  type: project
---

# PRD1042-585 Bank Admin Retrofit — 2026-07-08

**Story:** US 29.4 | Tenant Detail View
**File updated:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-585 Tenant Detail View.md`
**Trigger:** PRD1042-48 (Ivan Mladenovic 2026-07-06) added `bank_admin` role wire value + `bank_tenant` user type

**Why:** Bank Admin is tenant-scoped and needs own-tenant configuration visibility (Bank Product Templates, Framework Agreements, etc — per PRD1042-48 scope). Jira permission matrix on PRD1042-585 confirms: `View Identity & Status + Module Profile: R (own tenant)` + `View Integration Active Flag: R (own tenant)`. All other tabs blocked. No lifecycle buttons.

**How to apply:** Bank Admin on this story = "own-tenant limited viewer, no lifecycle actions". When retrofitting sibling tenant-management stories (PRD1042-582/583/584/586/587/588/589/590/591/592/593/594/595/596/597/598/599/737) check the Jira permission matrix — Bank Admin's row may differ per story.

## Changes made

1. Header block: added `**Updated 2026-07-08:**` note under `Generated:` line explaining the retrofit
2. Figma section: added note that no Bank Admin variant frame observed in prior extraction; assumed similar to Support-restricted view with own-tenant scoping
3. Scenarios summary table: 8 → 10 rows; added Bank Admin own-tenant scenario (`@happy-path` AC-01/AC-02) and Bank Admin cross-tenant scenario (`@main-error` AC-12); updated AC-04 Outline count 4 → 5 role variants; updated AC-12 Outline count 3 → 4 (in table header only; Bank Admin cross-tenant is its own separate scenario, not an Outline row)
4. Active scenario blocks: 8 → 10; E2E candidates: 6/8 → 7/10
5. AC-04 Outline (Lifecycle buttons visibility): added `| Bank Admin | not be visible |` row; comment block explains Bank Admin is a tenant-scoped bank tenant role and tenant lifecycle actions remain platform-level System Admin actions
6. NEW scenario after AC-04 Outline: `Bank Admin views own tenant detail — limited tab subset visible (AC-01, AC-02)` — shows Identity & Status + Module Profile only; explicitly asserts other 5 tabs are NOT visible; explicitly asserts lifecycle buttons not visible
7. AC-12 Outline: comment block updated to explain Bank Admin has its own scenario (own-tenant works, other-tenant 404s); no new row in the 3-role Outline (Front Office / Back Office / LC User remain)
8. NEW scenario after AC-12 Outline: `Bank Admin attempts to view another tenant's detail — 404 returned (AC-12)` — Bank Admin bound to TENANT-001 attempting TENANT-002 → 404, no data exposed

## Open questions logged in-file

- Whether Module Profile tab exposes Integration Active Flag inline (per permission matrix `View Integration Active Flag: R (own tenant)`) or in a separate tab is not stated in the story. Assumed inline; noted in scenario comment block. **Confirm with design/BE before test run.**

## E2E readiness

- Bank Admin own-tenant view scenario: `@e2e-ready` (assumes seeded Bank Admin user bound to TENANT-001 exists)
- Bank Admin cross-tenant 404 scenario: `⚙️ needs D20 (second seeded tenant)` — requires TENANT-002 to be provisioned; parallel to existing Support-user scenarios that also need D20

Related retrofit memories:

- [[project-prd1042-48-bank-admin-update]] — origin decision (Role Assignment story)
- [[project-prd1042-59-bank-admin-update]] — sibling retrofit pattern (User Provisioning)
- [[project-prd1042-61-bank-admin-update]] — sibling retrofit pattern (User Suspension)
- [[feedback-bank-admin-role-realignment]] — general Bank Admin retrofit playbook
