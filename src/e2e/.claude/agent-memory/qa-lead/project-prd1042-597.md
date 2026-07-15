---
name: project-prd1042-597
description: US 29.16 Support Access Grant Management pipeline result — 21 ACs, Four-Eyes on post-access review, design-blind
metadata:
  type: project
---

# PRD1042-597 — US 29.16 Support Access Grant Management

**Processed:** 2026-07-07
**Status:** Pipeline complete, .md file written to PRD1042-40 Tenant Management folder
**Jira status:** QA ready

## Pipeline outcome

- **Stage 1 (DoR):** PASS — 21 ACs derived from Functional Requirements + Field Specs + Validation Rules + Edge Cases; description present; stakeholder-reviewed by Philipp Maute + Vesna Plakalovic (2026-06-02)
- **Stage 2 (Figma):** FAILED — no Figma URL in story description, FE subtask PRD1042-696, or attachments; design-blind generation
- **Stage 3:** WARNINGS — no CRITICAL blockers; MAJOR design gaps for Grant Creation Form, Emergency confirmation dialog, Support session banner
- **Stage 4:** 10 scenario blocks generated (4 happy-path, 6 main-error), 3 ACs Blocked, 8 ACs in scope filter only

## Structural highlights

**Four-Eyes waiver + preservation pattern:**

- AC-06 documents the Emergency grant Four-Eyes waiver at creation time (single System Admin, no countersignature)
- AC-09/AC-19 re-establish Four-Eyes at post-access review (reviewer != grant creator) — captured in comment from Philipp Maute 2026-06-02, adopted by Vesna 2026-06-02

**Two absolute security invariants:**

- Support access is ALWAYS read-only regardless of grant state (AC-10, AC-18) — asserted at API layer
- Reviewer must be different System Admin than grant creator (AC-09) — asserted at API layer

**403-not-404 for grant CUD role gate (AC-02):**

- Non-System-Admin roles receive 403 (not 404) on grant creation — this is a role attribute refusal, not tenant scope probing. Confirmed with 5-row Scenario Outline covering Front Office, Back Office, LC User, Auditor, Support User.

## Blocked ACs

- **AC-07** (Emergency grant auto-flag for review within 24h configurable window) — D-Scheduler / clock override
- **AC-08** (All System Admins notified on Emergency creation) — D-Notification event capture harness
- **AC-17** (Session invalidated immediately on expiry mid-session) — D-Session-Signal + D16-analog clock override

## Excluded (edge-case or separate-feature)

- AC-03 (auto-expiry timing internals)
- AC-05 (renewal = new grant business rule; forbidden PATCH)
- AC-16 (multiple concurrent grants allowed — absence of a rule)
- AC-20 (grant record read view field display — implicit in happy-path Then)
- AC-21 (audit event emission — internal observability)

## E2E automation candidates

**4 of 10 scenarios @e2e-ready ✅:**

- AC-02 role-based access (API-only, seeded users only)
- AC-15 Support Access Allowed = false gate (API-only)
- AC-13 Valid Until in past (API-only)
- AC-14 Valid Until > 30 days (API-only)

**6 scenarios need D19 (throwaway user creation for Support User seeding) or D-Session-Signal:**

- All happy-path scenarios (grant CUD, Emergency, banner, revoke)
- AC-10/18 write rejection
- AC-09/19 Four-Eyes review

## Design gaps (Stage 2 FAILED)

- Grant Creation Form field labels/placeholders/error messages unverified
- Emergency confirmation dialog copy unverified
- Persistent read-only banner exact copy + placement unverified
- Post-access review UI unverified

Related: [[project-prd1042-40-epic]], [[feedback-figma-link-not-bubbled]], [[project-prd1042-596]]
