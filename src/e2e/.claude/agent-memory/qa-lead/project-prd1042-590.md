---
name: project-prd1042-590
description: PRD1042-590 US 29.9 Tenant Archiving/Decommissioning — Stage 2 FAILED Figma quota, 7 scenario blocks, 6 ACs Blocked, terminal-state semantics contrast with Reactivation
metadata:
  type: project
---

# PRD1042-590 — US 29.9 Tenant Archiving / Decommissioning

**Epic:** PRD1042-40 (Epic 29 Tenant Management)
**Status:** QA in progress · DoR PASS · 18 ACs
**Sub-stories:** PRD1042-674 (BE), PRD1042-675 (FE), PRD1042-676 (QA)
**Processed:** 2026-07-07

## Pipeline Result

- **Stage 1:** PASS (18 ACs) — provided verbatim by user
- **Stage 2:** FAILED — Figma Professional plan quota exhausted (Retry-After ~4.3 days on batched `/v1/files/7pygkopuqyeEhUTMVp9lrP?ids=84:5370,84:5371&depth=8`). ARCHIVE section (84:5370), ARCHIVED VIEW (84:5371), ERROR (84:5372) not fetchable. REACTIVATE sibling section (84:5369) from [[project-prd1042-589]] used as closest design reference.
- **Stage 3:** WARNINGS — 5 MAJOR design gaps logged (ARCHIVE modal copy inferred from REACTIVATE sibling), 1 currently un-testable AC (AC-06 read-only mode blocked by bug PRD1042-1105). No CRITICAL.
- **Stage 4:** 7 scenario blocks in Feature file (2 happy-path, 4 main-error, 1 pending)

## Coverage Breakdown

- **Gherkin generated (5 ACs):** AC-01, AC-03, AC-10, AC-11, AC-15
- **Blocked (6 ACs, no Gherkin):** AC-02 (PRD1042-77 countersign), AC-04 (TM-11 integration decommission), AC-05 (D-Integration inbound-event fixture), AC-06 (PRD1042-1105 bug — edit actions remain enabled), AC-13 (PRD1042-77 Four-Eyes actor independence), AC-17 (D-Audit), AC-18 (D-EventBus)
- **Excluded (6 ACs):** AC-07 (terminal state — separate), AC-08 (data preservation — BE), AC-09 (deletion NOT triggered — separate), AC-12 (Active User Acknowledgement conditional — edge-case), AC-14 (Support-role ambiguous → @pending), AC-16 (Legal Hold — separate feature)

## Domain Rules Applied

- **404-not-403** — AC-15 RBAC Outline covers FO/BO/LC/Support/Auditor → @e2e-ready
- **Four-Eyes** — happy-path Outline sets up Two-Actor flow; AC-13 (self-countersign block) Blocked pending PRD1042-77
- **Terminal state** — contrast with [[project-prd1042-589]] (Reactivation reverses Suspended; Archive is one-way)
- **Longest justification threshold** — 50 chars (Suspension = 30, Reactivation = 20, Archive = 50)

## Key Notes

- **Bug PRD1042-1105** makes AC-06 (read-only mode) currently un-testable at UI level — edit controls remain enabled on Archived tenants; happy-path E2E asserts state transition only, not absence of edit
- **AC-14 Support-role ambiguity** — Vesna Plakalovic 2026-06-10 & 2026-06-12 (comment 36743) confirmed pending product decision → @pending tag, no execution until resolved
- **Design blindness** — ARCHIVE modal copy (title, Irreversibility checkbox text, Active User Acknowledgement conditional, ARCHIVED VIEW, ERROR section) UNVERIFIED; scenarios use pattern-based assertions with explicit note in Feature file header

## E2E Automation

- **@e2e-ready (3 scenarios):** AC-10 empty/short justification, AC-01 non-Suspended state Outline, AC-15 RBAC 404 Outline
- **⚙️ Needs infra (3 scenarios):** happy-path Outline (needs PRD1042-77 + PRD1042-1105 fix), Submit disabled until checkbox (needs ARCHIVE modal design verification), Support @pending

## Output

`/Users/admin/Desktop/HolyCode Business Process Refinext/refinext-app/src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-590 Tenant Archiving.md`
