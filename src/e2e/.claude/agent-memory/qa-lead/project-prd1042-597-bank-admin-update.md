---
name: project-prd1042-597-bank-admin-update
description: 2026-07-08 update to PRD1042-597 Support Access Grant Management — added bank_admin to AC-02 RBAC Outline (5 roles → 6); Bank Admin cannot manage Support Access Grants (platform-level authority)
metadata:
  type: project
---

# PRD1042-597 — Bank Admin Retrofit (2026-07-08)

Updated `PRD1042-597 Support Access Grant Management.md` per Ivan Mladenovic's Bank Admin decision (2026-07-06 via PRD1042-48).

## Changes applied

- **Header note added:** "Updated 2026-07-08: Added Bank Admin role (`bank_admin`) support per PRD1042-48. Bank Admin cannot manage Support Access Grants (platform-level authority)."
- **AC-02 Scenario Outline:** added `Bank Admin` row to the Examples table (was 5 roles: Front Office, Back Office, Leasing Company User, Auditor, Support User → now 6 with Bank Admin first). Endpoint: `POST /api/tenants/{id}/grants` → 403.

## No changes needed

- No new scenario blocks — Bank Admin behaves identically to other non-System-Admin roles for grant CUD.
- Blocked ACs table unchanged (AC-07, AC-08, AC-17 still blocked on D-Scheduler, D-Notification, D-Session-Signal).
- Scope filter table unchanged.
- Scenarios summary unchanged (still 10 blocks, 4 e2e-ready).
- Feature-level Background unchanged.

## Rationale

- Bank Admin is tenant-scoped (`bank_tenant` user_type) — cannot perform platform governance actions.
- Support Access Grants are platform-level authority — only System Admin creates/manages.
- Bank Admin also cannot be the grant subject (Support is a distinct platform role).
- Story uses 403-not-404 for grant CUD role gate (confirmed by prior memory [[project-prd1042-597]]).

## Related

- [[project-prd1042-597]] — original story processing (21 ACs, DoR PASS, Stage 2 FAILED, 10 scenario blocks)
- [[project-bank-admin-role]] — canonical Bank Admin role spec
- [[project-prd1042-48-bank-admin-update]] — decision anchor
