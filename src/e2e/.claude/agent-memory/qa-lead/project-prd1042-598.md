---
name: project-prd1042-598
description: US 29.17 Cross-Tenant Allow-List Governance & Audit — 16 ACs, DoR PASS, no Figma (backend governance/enforcement + TM-04 UI), Stage 3 WARNINGS, 6 scenario blocks, 2 ACs Blocked on TM-04 UI
metadata:
  type: project
---

# PRD1042-598 — US 29.17 Cross-Tenant Allow-List Governance & Audit

Processed 2026-07-07. Epic PRD1042-40 Tenant Management. Backend governance + audit story writing CROSS_TENANT_ACCESS_PERMITTED/BLOCKED events; TM-04 owns Governance History UI rendering.

**Stage 1:** DoR PASS. 16 ACs derived from Functional Requirements + Security Requirements + Edge Cases + Tenant Context Propagation. Stakeholder-reviewed: Philipp Maute comment 36037 flagged US 29.18 asymmetry (403 for Archived leaks existence); Vesna Plakalovic comment 36042 confirmed alignment to 404-everywhere. Story is QA ready.

**Stage 2:** FAILED — no Figma URL on story or FE subtask PRD1042-699 (backend enforcement story; UI is TM-04's concern).

**Stage 3:** WARNINGS. All ACs match spec but design-blind on Governance History UI (TM-04 dependency). OQ-10 RESOLVED per parent epic comment 36119: JWT-claim-with-tenant-context, RBAC middleware validates tenant_id per request.

**Stage 4:** 6 scenario blocks (2 Outlines + 4 Scenarios):

- 3 happy-path: SysAdmin platform-admin op (AC-01, AC-05), Support diagnostic read with grant (AC-06), Auditor read on assigned tenant (AC-07)
- 3 main-error: cross-tenant write blocked all roles (AC-02, AC-03), 404 for all invalid contexts (AC-02, AC-09), tampered JWT rejected (AC-15)
- Blocked: AC-10, AC-13 (TM-04 Governance History UI)
- Excluded: AC-04 (governance workflow future), AC-08 (Reporting epic), AC-11/12 (audit schema), AC-14/16 (architecture)
- E2E: 0 of 6 ready — all need infra fixtures (D17 JWT-forge, D20 second tenant, D-Enforcement, PRD1042-77, TM-16, Auditor engagement)

**Key domain rules confirmed:**

- 404-not-403 uniform across US 29.17 and US 29.18 (Philipp/Vesna alignment)
- OQ-10 as-built: JWT-claim-with-tenant-context (comment 36119 on PRD1042-40)
- OQ-09 as-built: shared-key + tenant_id logical separation for November launch, per-tenant KMS deferred

**Cross-refs:** Related to [[project-prd1042-582]] Tenant Creation (Epic 29 first story), TM-04 (Governance History rendering), TM-16 (Support Access Grant), PRD1042-37 (Audit Trail), PRD1042-77 (Four-Eyes Approval).

**Numbering note:** ACs 01–16 are derived by QA from prose Functional/Security/Edge sections; story description uses categorized headings rather than numbered ACs. Coverage traceability is by concept, not by verbatim AC number in Jira.
