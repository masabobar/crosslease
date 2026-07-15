---
name: project-prd1042-591
description: PRD1042-591 US 29.10 Tenant Configuration Override Management — Stage 2 FAILED (no Figma), Stage 3 WARNINGS, 8 scenario blocks, 3 Blocked (D-Audit, Seed-Harness, delegation to child epics), immutability + tenant isolation + RBAC-404
metadata:
  type: project
---

# PRD1042-591 — US 29.10 Tenant Configuration Override Management

**Epic:** PRD1042-40 (Epic 29 Tenant Management)
**Status:** Dev in progress · DoR PASS · 16 synthesized ACs (from FR/Field/VR/SB/SEC/EC sections — description had no numbered AC list)
**Sub-stories:** PRD1042-677 (BE), PRD1042-678 (FE), PRD1042-679 (QA)
**Processed:** 2026-07-07

## Pipeline Result

- **Stage 1:** PASS — description grouped by section (Functional Requirements, Field Spec, Validation Rules, System Behavior, Security, Edge Cases); synthesized 16 discrete ACs. Philipp Maute comment 38524 (2026-07-03) flags: (a) inheritance phrasing clarification needed, (b) external dependencies on Product Templates / Workflow Definitions / Document Policy Sets not yet built — intentional deferred, (c) Bank Power User vs. System Admin terminology alignment pending.
- **Stage 2:** FAILED — no Figma URL on story or any child (677/678/679). Backend-heavy configuration story, UI likely deferred.
- **Stage 3:** WARNINGS — 3 MAJOR gaps: design-blind, stale-reference warning UX unspecified, Four-Eyes applicability on override modification ambiguous (Epic 29 §5.13 mentions Four-Eyes on privileged cross-tenant ops but story silent). No CRITICAL.
- **Stage 4:** 8 scenario blocks in Feature file (2 happy-path Scenarios, 6 error blocks — 4 Scenarios + 2 Outlines)

## Coverage Breakdown

- **Gherkin generated (8 ACs):** AC-01 (create happy), AC-02 (modify happy), AC-07 (invalid ref), AC-08 (short justification), AC-09 (immutable type), AC-11+AC-12 (Suspended/Archived Outline), AC-13 (5-role 404 Outline), AC-14 (cross-tenant 404 + AC-04 dual)
- **Blocked (3 ACs, no Gherkin):** AC-05 (delegation to Product Template / Workflow Definition child epics), AC-10 (Seed-Harness for platform-object version bump), AC-15 (D-Audit fixture)
- **Excluded (5 ACs):** AC-03 (storage shape — edge-case), AC-04 (rolled into AC-14 as dual), AC-06 (enum Zod validation — edge-case), AC-16 (Rate Table — separate-feature deferred post-November per Vesna comment 37034)

## Domain Rules Applied

- **404-not-403**: AC-13 RBAC Outline (FO/BO/LC/Support/Auditor) — @e2e-ready; AC-14 cross-tenant 404
- **Tenant isolation**: AC-14 covers AC-04 as its dual — one-tenant-scope-cannot-modify-another
- **Immutability**: AC-09 Override Type immutable — pattern parity with US 29.14 Seed Package Assignment (project-prd1042-595)
- **Four-Eyes**: ambiguous — Epic 29 §5.13 mentions cross-tenant/privileged, story description silent; flagged for BA
- **Rate Tables deferred**: AC-16 excluded from sprint per parent-epic comment 37034 (2026-06-12)

## Key Notes

- **Design blindness**: no Figma URL on parent or any child; no attachments hint at design deliverable — assertions target HTTP contract only; copy of validation/error/stale messages UNVERIFIED
- **AC synthesis**: description used narrative section format (Functional Requirements / Field Spec / Validation Rules / System Behavior / Security / Edge Cases) instead of numbered AC list — 16 ACs synthesized from parseable rules; if BA later publishes numbered ACs, re-map
- **Child epic delegation**: Override Parameters schema is delegated per override type to Product Template epic, Rate Table epic, Workflow Task Catalog epic, Document Requirement Catalog epic — TM-10 only implements storage/validation trigger/audit; parameter-shape scenarios belong in those epics' specs
- **Bank Power User vs. System Admin**: Philipp Maute flagged consistency check for Bank Power User (bank-level admin) vs. System Admin (platform-level) — story uses "System Admin" throughout; treat as authoritative until BA re-clarifies. If terminology changes, AC-13 role list may need update

## E2E Automation

- **@e2e-ready (1 scenario):** AC-13 RBAC 5-role 404 Outline (seeded users only)
- **⚙️ Needs infra (7 scenarios):**
  - Happy-path AC-01, AC-02 → Seed-Harness (platform Product Template, Workflow Definition fixtures + existing override fixture)
  - AC-07 invalid ref → Seed-Harness
  - AC-08 short justification → Seed-Harness (existing override)
  - AC-09 immutable type → Seed-Harness (existing override)
  - AC-11+AC-12 non-Active lifecycle → Seed-Harness (Suspended + Archived tenant fixtures)
  - AC-14 cross-tenant 404 → D20 (second seeded tenant) + Seed-Harness (override on tenant-alpha)

## Output

`/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-591 Tenant Configuration Override Management.md`
