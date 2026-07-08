---
name: project-prd1042-592-bank-admin-update
description: 2026-07-08 update to PRD1042-592 US 29.11 Tenant Integration Binding — added bank_admin to AC-09 RBAC 404 Outline (5→6 roles); platform-level resource, System Admin only
metadata:
  type: project
---

# PRD1042-592 Bank Admin Retrofit — 2026-07-08

## Context

Per PRD1042-48 (Ivan Mladenovic decision 2026-07-06), added `bank_admin` (wire value: `bank_admin`, User Type: `bank_tenant`) coverage to US 29.11 Tenant Integration Binding Management.

## Authoritative rule (Jira permission matrix)

The story description permission matrix Power User (Bank Admin) row explicitly says:

- View binding: ✗
- Create / modify binding: ✗

Integration binding is **platform-level infrastructure** (core banking endpoint URL, credential scope, integration active flag). It is owned by System Admin only. Bank Admin governs bank tenant users per PRD1042-48 role split — not tenant integration configuration.

## File changes to `PRD1042-592 Tenant Integration Binding Management.md`

1. **Header line 4** — added "Updated 2026-07-08" note anchoring the retrofit + PRD1042-48 authority.
2. **Scope Filter AC-09 row** — description now reads "Only System Admin can create/modify binding; other roles rejected (including Bank Admin — platform-level resource)"; rationale extended: "Bank Admin (`bank_admin`) explicitly excluded per Jira permission matrix (Power User row: View ✗ Create/modify ✗)".
3. **Scenarios summary row for AC-09** — scenario name updated to "Non-System-Admin roles cannot create/modify binding (Outline — 6 roles incl. Bank Admin)".
4. **AC-09 group comment block** — extended with Bank Admin exclusion rationale (platform-level infrastructure; PRD1042-48 role split; Bank Admin governs bank tenant users, not integration config).
5. **AC-09 Examples table** — added `| Bank Admin | 404 |` as the top row (before Front Office).

## What did NOT change

- Header total scenario counts unchanged (7 scenario blocks — Outline row addition, not new scenario).
- AC-10 view Outline (System Admin + Support) NOT extended — Jira matrix says Bank Admin View ✗.
- AC-11 cross-tenant isolation NOT modified — existing "System Admin scoped to Tenant B" test remains canonical isolation vector; Bank Admin cross-tenant vector is implicit in AC-09 role gate (Bank Admin from any tenant → 404 anywhere).
- No new Gherkin scenario blocks added.

## Open question

User directive stated Bank Admin "**might** have VIEW access to own tenant's integration binding status" (uncertain wording). Jira permission matrix is authoritative and says NO view access. Followed Jira matrix.

**Follow-up if View is later confirmed:**

- Add positive view scenario in AC-10 Outline (System Admin, Support User, Bank Admin — own-tenant only)
- Update AC-09 Bank Admin row: no change (Bank Admin still cannot create/modify — 404)
- Cross-tenant Bank Admin: 404 (same as System Admin cross-tenant per AC-11)

## Related

- [[project-bank-admin-role]] — canonical Bank Admin role definition
- [[project-prd1042-48]] — role split authority
- [[project-prd1042-592]] — original story processing
- [[feedback-bank-admin-role-realignment]] — retrofit pattern
