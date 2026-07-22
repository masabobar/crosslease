---
name: project-prd1042-764
description: US 13.18 Assign Additional Non-Risk-Sensitive Role (Epic 13), DoR PASS, Figma Stage 2 GOOD (real frame node 21:11234, first non-legend node), 3-stage manual flow, 5 scenario blocks, OPEN partner-global-flag vs per-transaction model question
metadata:
  type: project
---

PRD1042-764 — US 13.18 | Partner Management | Assign Additional Non-Risk-Sensitive Role. Tenth story under Epic 13 Partner Management (PRD1042-24), 3-stage manual flow — see [[feedback-manual-3-stage-pipeline]].

**Why:** November 2026 Foundation, CP-5. FO assigns non-risk-sensitive role flags (Lessee / Guarantor / Supplier) to an existing canonical Partner; multiple simultaneous roles on ONE record, no record duplication; append-only. Risk-sensitive roles (LG / Bank Entity / UBO-Related Person) are NOT single-actor assignable — they route to US 13.06 Four-Eyes. API `POST /api/partners/{id}/roles`; RoleAssignmentService.

**How to apply:**

- 10 ACs reconstructed. 6 given Gherkin (happy: AC-01/02 assign→operational immediately over 3 roles, AC-03 multiple roles on one record no dup; main-error: AC-04 idempotent duplicate, AC-05 risk-sensitive routed to Four-Eyes not single-actor, AC-06 role gating FO-only). Excluded edge-case: AC-07 append-only history, AC-08 notification optional, AC-09 RoleAssigned event, AC-10 transactional persistence. 0 blocked. 5 scenario blocks (3 Outlines + 2 Scenarios). 0 of 5 E2E-ready (needs seeded Partner fixtures; greenfield).
- **FIRST Stage 2 GOOD extraction in E13** — Figma node **21:11234 is a REAL design frame** (11399×18917 px), not a scope-legend card. Extracted: "ASSIGN ROLE" action + role-management panel on Partner detail; role badges "Assigned role Lessee/Guarantor/Supplier"; risk-sensitive roles shown "(pending counter-confirmation)" / "Counter-confirmation needed" — visually confirms risk roles route to US 13.06 and do NOT go operational single-actor. Also in the frame: ADD UBO OWNER, ARCHIVE, DRAFT Confirm/Reject identity, DOWNSTREAM IMPACT (Contracts/Financings affected). **Real screen frames live under node 21:xxxxx, NOT the 235:285xx legend cards** — use 21:11234-area nodes for future E13 COMPLETE extractions.
- **OPEN MODEL QUESTION (MAJOR, escalate to BA/PO):** The story models role flags as **partner-global multi-value enums on one canonical Partner**. Philipp Maute + Vesna Plakalović contest this vs **per-transaction role relationships** (a Partner is Lessee in contract A, Supplier in contract B). If flags are partner-global, the risk-sensitive Four-Eyes gate (US 13.06/13.19) fires only once on first flag-set then is unrestricted in future contracts, and audit reconstruction breaks. Vesna (2026-06-11): **"13.18 / 13.6 stay un-approved until we land it"**; leans to partner-level flags = eligibility + operational role on a per-contract/collateral relationship (Four-Eyes hooks on the relationship). Philipp re-raised wording 2026-07-03. Ticket says "Ready for DEV Review" but the core data model is contested — the tested behavior (partner-global flags) is AT RISK of changing to per-transaction. Scenarios written to CURRENT wording.
- **Power User (Bank Admin)** in role-gating negative, still no UserRole enum mapping.

Related: [[project-prd1042-752]] (US 13.06 risk-sensitive path), [[project-prd1042-761]], [[feedback-manual-3-stage-pipeline]].
