---
name: project-prd1042-599
description: PRD1042-599 US 29.18 Tenant Context Propagation — DoR PASS, no Figma (backend/security enforcement), Stage 3 WARNINGS, 5 scenario blocks, 5 ACs Blocked (D17/D20/TM-17/audit-inspection)
metadata:
  type: project
---

**PRD1042-599 — US 29.18 | TENANT MANAGEMENT | Tenant Context Propagation**

Processed 2026-07-07. Epic PRD1042-40 (Epic 29). Jira status "QA ready". Description stakeholder-reviewed by Iva Marković + Philipp Maute (2026-06-02 alignment pass confirmed 404-uniformity mirroring US 29.17).

**Why:** Cross-cutting backend/security enforcement story. No Figma URL, no UI surface — tenant context propagation is enforced in inter-service auth tokens + DAL middleware + PostgreSQL RLS. Consistent with prior backend stories [[project-prd1042-46]], [[project-prd1042-47]], [[project-prd1042-50]], [[project-prd1042-51]].

**How to apply:**

- 21 ACs total → 5 with Gherkin (AC-01, AC-03, AC-10, AC-16, AC-19), 5 Blocked (AC-08/09/11/15/18), 11 excluded as edge-case/separate-feature
- Stage 2 SKIPPED design-blind (backend-only pattern)
- Stage 3 WARNINGS not BLOCKED — 404-not-403 uniformity fully anchored in ACs, tenant isolation triple-layered (DAL + query abort + RLS), audit events (TENANT_CONTEXT_VALIDATION_FAILED, CROSS_TENANT_ADMIN_OPERATION) fully specified
- Blocking dependencies: D17 (JWT forge for AC-08/09), D20 (second seeded tenant for AC-11/16), TM-17 (cross-tenant allow-list for AC-15), PRD1042-37 (audit-log inspection API for AC-18)
- E2E automation: only AC-10 (X-Tenant-Id header injection) is `@e2e-ready` — 4 cross-tenant scenarios need D20
- Scenario coverage: 2 Outlines (roles × endpoints for happy path, resource types for cross-tenant fetch) + 3 focused Scenarios (header injection, list scoping, IDOR URL manipulation)
- Children: PRD1042-701 (BE), PRD1042-702 (FE — note frontend must NOT inject tenant_id per architectural note), PRD1042-703 (QA)
- Open question OQ-10: subdomain vs API-key vs JWT-claim routing not decided; story requirements hold regardless of choice
- Ambiguity flagged: AC-16 integration test ownership (E2E QA vs BE unit/integration) — story text implies BE ownership at DB layer; E2E complements via API assertions
