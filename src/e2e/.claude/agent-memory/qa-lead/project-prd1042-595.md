---
name: project-prd1042-595
description: US 29.14 Seed Configuration Package Assignment — Step 3 of TM-01 tenant creation wizard; 15 ACs, DoR PASS, Figma FAILED (MCP rate-limited), Stage 3 WARNINGS, 5 scenario blocks, immutability guard + 404-not-403 role gating
metadata:
  type: project
---

# PRD1042-595 — US 29.14 | Seed Configuration Package Assignment

**Processed:** 2026-07-06
**Epic:** PRD1042-40 Epic 29 Tenant Management (fourth story processed in this epic after PRD1042-582)
**Story status at processing:** QA in progress
**DoR:** PASS — 15 ACs derived from functional requirements + validation rules + system behavior + security requirements + edge-cases sections, description present, stakeholder-reviewed by Iva Marković 2026-06-01
**Stage 2:** FAILED — Figma MCP rate-limited on View seat (Professional plan), same session tooling class as PRD1042-77, PRD1042-48, PRD1042-582; wizard step name "SEED PACKAGES" verified via prior PRD1042-582 processing on same file (7pygkopuqyeEhUTMVp9lrP)
**Stage 3:** WARNINGS — no CRITICAL blockers; design gaps flagged (error/empty/loading states unverified)
**Stage 4:** 5 active scenario blocks (1 Outline + 4 Scenarios), 1 `@e2e-ready`, 4 needing fixtures

**Why:** Step-3 slice of the TM-01 tenant creation wizard (parent story PRD1042-582 covers wizard shell). This story governs the seed configuration binding — a governance/backend-heavy area with a small UI surface, where most ACs are about backend behavior (atomic binding, immutability, deprecated-package 422, 404 role-gating).

**How to apply:**

- **Follow-on to PRD1042-582 wizard shape** — reuses "SEED PACKAGES" step name; wizard step names (IDENTITY → MODULES → SEED PACKAGES → INTEGRATION → Review & Submit) verified in PRD1042-582
- **404-not-403 pattern reused** — AC-14 endpoint access uses same enumeration-prevention pattern; auto-applied Scenario Outline covers 5 non-admin roles
- **Immutability guard collapse** — AC-08 (stored+read-only), AC-11 (immutable after creation), AC-15 (no reassignment endpoint or UI) collapsed into 1 combined main-error scenario (API PATCH + UI absence in same block)
- **Rate Tables display caveat** — Rate Table wiring in Package Description panel may be blank pre-launch per Vesna Plakalovic 2026-06-12 comment on epic PRD1042-40 ("Rate Tables part is left for after November")
- **Mid-flight deprecation fixture required** — AC-10 requires a fixture that flips a seed package active→deprecated between Step 3 and Step 5; not yet confirmed available

**Fixture gaps observed:**

- Deprecated seed package fixture (mid-flight deprecation between wizard steps) — shared with PRD1042-582 AC-08
- Throwaway tenant creation/deletion API (D19-analogue for tenants) — happy-path and immutability scenarios
- Admin-session API access for PATCH testing — immutability guard

**File written:** `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-595 Seed Package Assignment.md` (reused existing epic folder created for PRD1042-582)

Related: [[project-prd1042-582]] (parent tenant creation wizard), [[project-prd1042-77]] (Four-Eyes governance dependency), [[feedback-figma-design-convention]]
