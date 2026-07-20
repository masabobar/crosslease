---
name: project-prd1042-788
description: US 26.11 Entity-Scoped Audit Tab in Operational Cockpits, 7 derived ACs, DoR PASS, Figma FAILED (quota exhausted node 1:11090), Stage 3 WARNINGS, 6 scenario blocks, AC-05 Blocked on Epic 30 scope fixture, first story processed in Audit Trail epic PRD1042-37
metadata:
  type: project
---

Story PRD1042-788 (US 26.11 | AUDIT TRAIL | Entity-Scoped Audit Tab in Operational Cockpits) processed 2026-07-10.

**Epic:** PRD1042-37 (Epic 26: Audit Trail) — first story processed in this epic. Folder `PRD1042-37-Audit Trail/` already existed.

**ACs (7 derived):**

- AC-01 read-only audit tab embedded in Contract/Financing/Partner/Document cockpits (happy-path)
- AC-02 FO/BO scope-positive visibility (happy-path)
- AC-03 role-aware field masking per US 26.05 (main-error — masking exposure risk)
- AC-04 tab never visible to LC users (main-error — absolute invariant)
- AC-05 cross-scope enumeration blocked at API (Blocked — needs D-Scope-Fixture from Epic 30)
- AC-06 LC tokens receive no audit data from any endpoint (main-error — API-layer denial)
- AC-07 tab read-only, no mutation affordance (main-error — INSERT-only invariant at entity surface)

**Stage 2:** FAILED — Figma Professional plan quota exhausted (MCP tool limit reached), no Bash in this session for REST fallback. Design-blind proceed per Epic 29 precedent (US 29.7, 29.9, 29.13, 29.16-19).

**Stage 3:** WARNINGS — no CRITICAL mismatches from AC text; MAJOR design gaps logged (empty state, loading state, mask visual treatment, LC-cockpit variant confirmation).

**Stage 4:** 6 active scenario blocks (all Scenario Outlines) covering 6 of 7 ACs. E2E-ready: 4 of 6 (masking + FO/BO scope-positive tagged non-e2e pending fixtures).

**Permission Matrix (verbatim from story):**
| Role | View own-scope tab | View out-of-scope | Mutation |
|--------------------------|--------------------|----------------- |----------|
| System / Power User | ✓ | ✓ (tenant) | ✗ |
| Auditor | ✓ | ✓ (tenant) | ✗ |
| Front Office | scoped | ✗ | ✗ |
| Back Office / Risk | scoped | ✗ | ✗ |
| Support | ✓ | ✓ (tenant) | ✗ |
| LC User | ✗ | ✗ | ✗ |

**Key dependencies:**

- US 26.05 (masking) — masking behavior inherited
- US 26.10 (query service) — AuditQueryService scope-aware
- Epic 30 (Security/Access Control) — operational scope resolution (owns AC-05 fixture)
- US 26.09 — audit-of-audit for cockpit tab access where governed

**Story children:** BE PRD1042-1014, FE PRD1042-1015 (QA ready), QA PRD1042-1016 (Open).

**Bank Admin retrofit note:** Story pre-dates PRD1042-48 role split (Ivan Mladenovic 2026-07-06). Permission Matrix as written uses "System / Power User" combined. Bank Admin role NOT listed in matrix. Since this is a read-only surface with no bank-tenant-specific mutation, Bank Admin retrofit likely maps to "own-tenant limited viewer" pattern similar to PRD1042-585. Deferred pending Bank Admin sweep of Epic 26.

Links: [[project-prd1042-37]] (would be created), [[project-prd1042-48-bank-admin-update]] for retrofit precedent.
