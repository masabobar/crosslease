---
name: project-prd1042-589
description: US 29.8 Tenant Reactivation Flow — 12 ACs, DoR PASS, re-run 2026-07-07 Figma SUCCESS via REST API (node 84:5369, REACTIVATE section on canvas 78:7403), Stage 3 WARNINGS with copy-verbatim design evidence + Justification field MAJOR gap, 6 scenario blocks, standard Four-Eyes (not single-admin) confirmed by design
metadata:
  type: project
---

# PRD1042-589 — US 29.8 Tenant Reactivation Flow

**Epic:** PRD1042-40 (Epic 29: Tenant Management)
**Processed:** 2026-07-07 (initial design-blind run same day) → **re-run 2026-07-07 design-verified**
**Test file:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-589 Tenant Reactivation.md` (overwritten with design-verified v2)

## Pipeline Results — v2 Design-Verified Re-run

- **Stage 1 (Jira):** DoR PASS — 12 ACs synthesised from description (no numbered AC block; extracted from Functional Requirements + Field Spec + Validation Rules + Security + Architectural Notes)
- **Stage 2 (Figma):** SUCCESS via REST API — node 84:5369 (REACTIVATE section) on canvas 78:7403 "Tenant Suspend, Reactivate, Archive", file 7pygkopuqyeEhUTMVp9lrP
- **Stage 3 (Comparison):** WARNINGS — copy-verbatim design evidence embedded in comment blocks; Justification field MAJOR gap logged (not in extracted modal frame); post-approval success state MAJOR gap logged (only pending state captured)
- **Stage 4 (Gherkin):** 6 scenario blocks generated (1 happy-path Scenario + 5 main-error, of which 2 are Scenario Outlines)

## Design-Verified Copy (Figma node 84:5369)

**Reactivation Modal:**

- Modal title: "Reactivate tenant"
- Field label: "Tenant" (read-only, value populated — design shows "New Group Trade")
- Field label: "Current status" (shows current lifecycle badge)
- Cancel button: "Cancel" (outline)
- Submit button: "Submit for reactivation" (solid)

**Post-submission Success State:**

- Title: "Reactivation submitted for approval"
- Body: "New Group Trade's reactivation has been submitted. **A second admin must approve before it takes effect.**"
- Secondary link: "View profile"

## AC Classification (unchanged from v1)

- `happy-path`: AC-01, AC-02, AC-03 (all covered in single happy-path scenario)
- `main-error`: AC-06 (min 20 chars justification), AC-07 (invalid state transition), AC-08 (Four-Eyes), AC-11 (role gating 404-not-403)
- `Blocked`: AC-04 (module re-confirmation — TM-05), AC-05 (fail-closed revert — D-Enforcement)
- `edge-case`: AC-09 (event republish), AC-10 (audit event), AC-12 (endpoint contract)

## CRITICAL CORRECTION from v1: Actor Model

**v1 (WRONG):** "System Admin only for BOTH initiate and countersign — unique in Tenant Management, one admin doing both"

**v2 (CORRECT, per design copy):** Standard Four-Eyes — TWO DIFFERENT System Admins. Design copy "A second admin must approve before it takes effect" explicitly confirms actor-independence. Both must hold System Admin role, but must be different users. Matches PRD1042-77 pattern and Vesna 2026-06-05 activation pattern.

The v1 characterization was misleading — the Permission Matrix says System Admin is the only ROLE that can initiate AND the only role that can countersign, but that does NOT mean the same PERSON does both. This is standard Four-Eyes with actor-independence enforced server-side per AC-08.

## Blocking Dependencies (unchanged)

- **TM-05** (module enforcement synchronization) — blocks AC-04
- **D-Enforcement** (module enforcement failure injection fixture) — blocks AC-05
- **PRD1042-1104** (open bug — Reactivate action does not work from Tenant Management list page) — blocks happy-path list-page path and AC-08 automation
- **PRD1042-77** (Two-Actor countersign fixture) — required for happy-path automation

## Design Gaps Still MAJOR After Re-run

- **Governance Justification field** (AC-06, min 20 chars, mandatory) — NOT visible in extracted modal frame. Only "Tenant" + "Current status" captured. Design team to confirm: (a) Justification on subsequent step, or (b) missing from current design.
- **Post-approval success state** — after countersign completes and tenant → Active. Only pending "submitted for approval" state extracted; final success copy not captured.
- **Module re-confirmation UI** (AC-04) — not shown; async backend, consistent with expectations
- **Fail-closed revert-to-Pending-Enforcement UI** (AC-05) — not shown; async backend, consistent

## Key Domain Rules Applied

- **20-char justification minimum** — consistent with PRD1042-587 (Module Deactivation)
- **404-not-403** for non-System-Admin roles on reactivation endpoint (RefiNext convention)
- **Four-Eyes / actor independence** — server-side via PRD1042-77, VISUALLY REINFORCED by design copy "A second admin must approve"
- **Fail-closed** — modules revert to Pending Enforcement if re-confirmation fails
- **Suspended-only** — Active/Archived tenants cannot be reactivated (422); UI shows "Current status" badge

## Notes

- E2E automation: 4 of 6 scenarios `@e2e-ready` — happy-path and Four-Eyes both need bug fix PRD1042-1104 + Two-Actor countersign fixture
- Design-verified re-run demonstrates value of REST API fallback when MCP is rate-limited; same pattern used successfully for PRD1042-583 on 2026-07-06
- Tenant name in test fixtures updated from "Acme Bank Tenant" (v1 placeholder) to "New Group Trade" (matches design)

Links: [[project-prd1042-587]] (20-char precedent), [[project-prd1042-583]] (Tenant Activation counterpart + REST API pattern), [[project-prd1042-77]] (Four-Eyes engine)
