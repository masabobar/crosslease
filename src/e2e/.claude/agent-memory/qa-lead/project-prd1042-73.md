---
name: project-prd1042-73
description: PRD1042-73 US 28.6 User Detail View — 16 ACs, DoR PASS, Figma PARTIAL (Authentication & Security + Governance sections absent), Stage 3 WARNINGS, 6 scenario blocks
metadata:
  type: project
---

US 28.6 User Detail View processed via full QA pipeline on 2026-06-03. Figma node 9:113, file j5hq5cQgHWdOtzLvSX0jvj, canvas "User list & user DETAILS".

**Why:** Complex governance/security story with 16 ACs covering 6 role-based views.

**How to apply:** When revisiting or extending this story's test suite, note the two MAJOR design gaps and three open ambiguities before adding new scenarios.

## Story facts

- 16 ACs, DoR PASS, Dev in progress, assigned Vesna Plakalovic
- Figma: 11 role-based sections (ADMIN, SUPPORT, AUDITOR, FRONT OFFICE, BACK OFFICE + 6 SELF PROFILE variants)
- Full User Detail page layout: USER IDENTITY section, ROLE & SCOPE section, tabbed lifecycle/status section
- Admin view: Edit buttons on IDENTITY + ROLE & SCOPE; Suspend user + Deactivate user action buttons
- Support / Auditor view: same sections, all Edit buttons and lifecycle actions hidden (read-only enforced in design)
- Self-profile (all roles): same 3-section layout with own data; LC User self-profile frame exists in design

## AC classification summary

- happy-path: AC-01 (6 scenarios via 1 Outline + self-profile)
- main-error: AC-02, AC-07, AC-16 (4 scenarios)
- edge-case: AC-03, AC-04, AC-05, AC-06, AC-08, AC-09, AC-13, AC-15
- separate-feature: AC-10, AC-11, AC-12, AC-14
- Total: 6 scenario blocks (1 Outline + 5 Scenarios)

## MAJOR design gaps

1. Authentication & Security section absent from all User Detail design frames. Story requires MFA method, failed login attempts, account lockout, SSO/IdP, Privileged Access Flag, Authentication Policy Applied. Only binary MFA On/Off badge in list column.
2. Governance Approval Reference, Approved By, Invited By, Last Role/Permission Change Timestamps absent from design. Story requires these visible to Admin/Auditor.

## Open ambiguities

1. AC-16: SELF PROFILE - Leasing Company User frame exists in design. Does AC-16 prohibition cover self-profile or only viewing OTHER users? BA/PO to clarify.
2. AC-07: Email change re-verification flow not designed — modal or inline edit? Designer to provide.
3. AC-08: Tabbed section in Admin view has 4 tabs; Auditor self-profile has 3. Tab labels not captured at depth-8. Designer to confirm.

## Recurring User Management pattern confirmed

User Management stories consistently show:
- Role-based section variants in Figma (ADMIN / SUPPORT / AUDITOR / FRONT OFFICE / BACK OFFICE sections per canvas)
- MAJOR design gaps in authentication/security and governance audit sections
- LC User always excluded from admin modules; self-profile separate from admin User Detail View

See also: [[project-prd1042-71]] (User List View), [[project-prd1042-72]] (User Search & Filtering)
