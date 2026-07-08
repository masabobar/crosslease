---
name: project-prd1042-599-bank-admin-update
description: 2026-07-08 update to PRD1042-599 Tenant Context Propagation.md adding bank_admin to AC-01/AC-03 happy-path Outline (3→4 roles) and converting AC-10 header-injection Scenario to Outline (System Admin + Bank Admin) — tenant-scoped role bound to one tenant, cannot bypass isolation via X-Tenant-Id header
metadata:
  type: project
---

2026-07-08 update to `PRD1042-599 Tenant Context Propagation.md` per PRD1042-48 (Ivan Mladenovic decision 2026-07-06) — Bank Admin role realignment across US 29.18 (Tenant Context Propagation).

**Why:** Bank Admin (`bank_admin`, `bank_tenant`) is bound to one tenant. Tenant context enforcement layer (DAL + query filter + RLS) must apply uniformly to all tenant-scoped roles including Bank Admin. Cross-tenant X-Tenant-Id header injection blocked identically to other tenant-bound roles.

**How to apply:** When retrofitting Bank Admin into tenant-isolation stories:

1. **Header update:** Added "Updated 2026-07-08" line under title with PRD1042-48 reference and pattern statement (bound to one tenant; cross-tenant context injection blocked at DAL + query + RLS layers).
2. **AC-01/AC-03 happy-path Outline:** 3 roles → 4 roles. Added `Bank Admin | bank-admin@acme-bank | /api/users` row between System Admin and Front Office. Own-tenant retrieval succeeds without explicit tenant selection.
3. **AC-10 header-injection scenario:** Converted from single Scenario to Scenario Outline with 2 rows (System Admin + Bank Admin). Comment block extended to explain Bank Admin has NO cross-tenant authorization claim (unlike System Admin's CROSS_TENANT_ADMIN_OPERATION path) — header injection must be ignored just the same.
4. **Scenarios summary table:** Updated 2 rows — AC-01/AC-03 row shows "4 roles inc. Bank Admin" and AC-10 row shows "Outline — 2 roles inc. Bank Admin".
5. **Active scenario blocks line:** Was "5 (2 Outlines + 3 Scenarios)" → now "5 (3 Outlines + 2 Scenarios)" (AC-10 converted to Outline).

**Scenarios NOT touched:**

- AC-16/AC-19 cross-tenant resource fetch Outline: Uses System Admin from Tenant A. Bank Admin from Tenant A would exhibit identical 404 behaviour (backend enforcement is role-agnostic beyond System Admin's cross-tenant capability). Not added to avoid Outline bloat — existing System Admin case is the strongest test (System Admin has the most legitimate cross-tenant path AND still gets 404 without proper claim).
- AC-16/AC-01 list scope isolation: Same reasoning — System Admin is sufficient to prove the DAL enforcement.
- AC-16/AC-19 direct URL manipulation: Uses Front Office already. Bank Admin behaviour would be identical.

**Role count final:** AC-01/AC-03 Outline = 4 roles (SA, BA, FO, BO). AC-10 Outline = 2 roles (SA, BA). No changes to blocked ACs (AC-08/09/11/15/18 all remain blocked on D17/D20/TM-17/audit-log API).

**Open questions:** None — Bank Admin role behaviour on tenant context propagation is a straightforward application of the uniform enforcement model established by Philipp Maute 2026-06-02 404-alignment pass. Sibling US 29.17 (PRD1042-598, governance) also affected but is a separate memory entry.

Related: [[project-prd1042-599]], [[project-prd1042-48-bank-admin-update]], [[project-prd1042-49-bank-admin-update]]
