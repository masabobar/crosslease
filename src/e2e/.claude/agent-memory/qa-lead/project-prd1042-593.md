---
name: project-prd1042-593
description: US 29.12 Tenant Access Policy Management, 8 ACs, DoR PASS, Figma FAILED (no URL in story or child tickets — FE PRD1042-684 Done but not bubbled), Stage 3 WARNINGS with 3 MAJOR design gaps + 2 MINOR flow-unverified, 8 scenario blocks, 404-not-403 confirmed, single-actor (no Four-Eyes), audit event ACCESS_POLICY_MODIFIED one-per-flag, min 20-char justification, Archived tenant 422
metadata:
  type: project
---

**Story:** PRD1042-593 — US 29.12 Tenant Access Policy Management
**Epic:** PRD1042-40 (Epic 29: Tenant Management)
**Processed:** 2026-07-07
**Updated:** 2026-07-08 — Bank Admin role (`bank_admin`) added to AC-08 404 Outline per PRD1042-48 (Ivan Mladenovic 2026-07-06). Bank Admin is NOT an authorized actor for Access Policy (Permission Matrix explicitly denies Power User/Bank Admin both view + modify). Story remains System-Admin-only. AC-08 Outline now covers Bank Admin, Front Office, Back Office, LC User, Support User, Auditor (6 roles) with both GET and PUT returning 404.
**Status:** UAT ready (Jira, 2026-07-08); FE PRD1042-684 Done, BE PRD1042-683 Done, QA PRD1042-685 QA in progress

**Pipeline outcome:**

- Stage 1: DoR PASS — 8 ACs (functional + validation + audit + security)
- Stage 2: FAILED — no Figma URL in parent or child tickets; recurring bubble-up gap ([[feedback-figma-link-not-bubbled]])
- Stage 3: WARNINGS — 3 MAJOR design gaps (AC-01 tab UI, AC-05 20-char inline validation, AC-06 Archived read-only state), 2 MINOR (AC-02 grant-warning banner, AC-07 Last Modified per-flag display)
- Stage 4: 8 scenario blocks (2 happy + 6 error), 3 @e2e-ready, target met

**Key domain contract signals:**

- **404-not-403 explicit in story** — AC-08 states "Access Policy endpoint returns HTTP 404 to all non-System Admin roles" — no ambiguity, ready to codify
- **Single-actor mutation** — permission matrix: only System Admin. No Four-Eyes gate applies (unlike suspension/reactivation stories in same epic)
- **Audit event granularity** — "one event per flag changed" — implies batch save is possible but audit is per-flag
- **Governance Justification is required on every flag change, min 20 chars** — validation gate at PUT
- **Archived tenant lifecycle contract** — matches TM-11 terminal state (parity with PRD1042-590)
- **Cross-service enforcement** — Support flag (TM-16), Auditor flag (User Management), LC Portal flag (LC Portal) — three separate downstream call sites need contract tests

**Fixture dependencies for E2E execution:**

- PRD1042-1100 Archived tenant seed (shared with 588, 590)
- D-Audit — audit-log query fixture (shared with 588, 590, 587)
- TM-16 grant-creation endpoint accessible in test env
- D19 throwaway Auditor user + User Management provisioning API
- LC Portal fixture (D-LCPortal)

**Ambiguities to resolve with BA:**

- Q1: per-flag save vs batch save on the Access Policy tab UI (impacts UX + audit granularity semantics)
- Q2: is Governance Justification stored per-flag or per-change-event only? Field spec says "Read-only per flag" for Last Modified By/At but not for justification
- Q3: Archived tenant tab render — read-only vs hidden

**File written:** `src/e2e/tests/PRD1042-40 Tenant Management/PRD1042-593 Tenant Access Policy Management.md`

**Related:** [[project-prd1042-585]] (Tenant Detail — parent screen host), [[project-prd1042-590]] (Archiving/Decommissioning — Archived terminal state contract), [[project-prd1042-582]] (Tenant Creation — same 404-not-403 pattern)
