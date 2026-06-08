---
name: project-prd1042-44
description: PRD1042-44 US 28.8 Invitation-based Onboarding, 17 ACs, DoR PASS, Figma PARTIAL (activation page not in node), Stage 3 WARNINGS, 5 scenario blocks, 9 ACs blocked by D19
metadata:
  type: project
---

PRD1042-44 — US 28.8 | USER MANAGEMENT | Invitation-based Onboarding processed through the full 4-stage pipeline on 2026-06-02.

**Why:** Story covers the full invitation lifecycle — admin creates invitation, user activates account, admin resends/revokes. 17 ACs.

**How to apply:** 9 ACs blocked by D19 (Throwaway user API) because the activation token cannot be extracted from the API response (AC-02 prohibits token in response body). Only the admin-side invitation creation (AC-01) and resend (AC-14) are testable at E2E layer without D19.

## Processing decisions

- **Figma node 96:71636** covers the admin-side invitation management UI only (User Management table + "Create & invite user" dialog + context menu + profile panel). The user-facing activation / password-setup screen is NOT in this frame — needs a separate Figma URL.
- **Design sections in canvas:** SUPPORT, ADMIN, AUDITOR, FRONT OFFICE, BACK OFFICE, LEASING CO USER, EMAIL, RESEND INVITE, BULK IMPORT USERS
- **Dialog variant:** One form variant without role-approval alert (standard roles); one with amber alert "This role requires a second authorized admin to approve" (privileged roles — Admin, Auditor). User created as "Pending" not "Invited" for the privileged path.
- **Success notification copy:** "User created" (title) + "Peter Parker has been added. An invitation is on its way to peter.parket@marvel.com." (description)
- **Resend invitation:** Visible in both row context menu (ellipsis-vertical → "Resend invitation") and user profile actions panel.
- **Role badges in table:** Support=#1347e5, Auditor=#a700b7, Admin=#7008e7, Back Office=#c60035, Leasing Co. User=#61738d, Front Office=#007955
- **Status badges in table:** Active=#22c55e, Invited=#3b82f6, Suspended=#f97316, Pending=#f59e0b, Deactivated=#9ca3af

## Stage 3 mismatches (key)

- **M2 (MAJOR):** "Revoke invitation" action absent from design; only "Deactivate user" shown. AC-13 blocked pending design/BA clarification.
- **M3 (MAJOR):** Form field labels inside Default Input component instances not visible at depth 8 in Figma tree — cannot verify all required fields are present.
- **M4 (MAJOR):** SUPPORT section in Figma shows "Invite user" button, contradicting story visibility rules (Support cannot create invitations).

## Blocked ACs

D19 blocks: AC-04, AC-05, AC-06, AC-07, AC-08, AC-09, AC-10 (all activation-side)
M2 + D19 blocks: AC-13
D19 + D21 blocks: AC-15

## Scenarios generated

- 5 blocks (1 Outline × 3 roles + 4 Scenarios = 7 rows)
- AC-01: 3 scenarios (standard roles Outline, Four-Eyes variant, missing Email field)
- AC-14: 1 scenario (resend via context menu)
- Visibility rules: 1 domain RBAC scenario (LC User cannot access User Management)

[[project-prd1042-43]] [[project-prd1042-71]] [[project-prd1042-72]]
