---
name: project-prd1042-737
description: US 29.19 Tenant License Limit Management processed 2026-07-07 — 24 ACs, DoR PASS, Figma FAILED (no URL linked, quota exhausted anyway), Stage 3 WARNINGS, 8 scenario blocks, 3 Blocked (D-Audit / D-EnvOverride / D-Concurrency), 404-not-403 covers AC-11/AC-16/AC-18 in single Outline, three verbatim spec-copy error messages for LC / Bank User / LC User limit-reached
metadata:
  type: project
---

PRD1042-737 — US 29.19 | Tenant Management | Tenant License Limit Management processed on 2026-07-07.

**Fact:** 24 ACs, DoR PASS. Parent epic PRD1042-40. Sub-tasks: PRD1042-738 (BE Done), PRD1042-739 (FE Done), PRD1042-740 (QA in progress). No UI/UX subtask, no Figma URL linked at any level. Story revised twice by Vesna Plakalovic per Philipp Maute review — max_users_per_lc added (originally only 2 fields), env-var defaults formalized (REFINEXT_DEFAULT_MAX_LC=25, REFINEXT_DEFAULT_MAX_BANK_USERS=10, REFINEXT_DEFAULT_MAX_USERS_PER_LC=2).

**Stage 2 status:** FAILED — no Figma URL to fetch. Even if one existed, Figma plan quota exhausted (Retry-After ~4d rolling window). Design-blind mode WARNINGS-only.

**Stage 3 findings:**

- 404-not-403 explicitly mandated in AC-16 for non-System-Admin write endpoints — spec-aligned with tenant isolation domain rule
- Support role can VIEW limits + utilisation but not write — AC-05/AC-16 combined
- No Four-Eyes: single-actor System Admin action per spec
- Enforcement is synchronous — no async indicator needed
- Design gaps: License Limits UI location (standalone tab? inline card? modal?), utilisation display copy, Support-view layout — all unverified

**Stage 4 output:** 8 scenario blocks in `src/e2e/tests/PRD1042-40 Tenant Management/PRD1042-737 Tenant License Limit Management.md`

- 2 happy-path (Config PATCH Outline × 3 fields, View GET Outline × 2 roles)
- 6 main-error (Limit-reached Outline × 3 entities, Reduction<current Outline × 2 fields, per-LC reduction, 404-not-403 Outline × 5 roles, exact-boundary allow+reject, min-value=0 Outline × 3 fields)
- 3 Blocked ACs: AC-14 (D-Audit — no PRD1042-37 audit query harness), AC-15 (D-EnvOverride — no mid-suite env swap), AC-22 (D-Concurrency — no parallel-request fixture)
- Verbatim spec copy for three limit-reached messages baked into scenario outlines — divergence detection
- 3 of 8 scenarios `@e2e-ready` (Config PATCH, View GET, 404-not-403, min-value=0 all rely only on seeded fixtures)

**Why:** First lifecycle story in Epic 29 to combine role-gating (AC-16 404-not-403), boundary allow-not-below (AC-19), and env-var-seeded defaults (AC-15). AC-19 exact-boundary rule is the tightest legal state and warranted its own scenario. AC-11/AC-16/AC-18 collapsed into one 404-not-403 Outline covering 5 non-admin roles to avoid role×error explosion.

**How to apply:** For future backend-enforcement stories with UI touchpoints but no linked Figma URL, treat as design-blind WARNINGS, extract copy verbatim from Jira description into scenario outlines, and collapse role×error combos into single Outlines. Merge AC clusters explicitly (e.g. AC-11/16/18 all address same 404-not-403 gate — one scenario covers all three).

Links: [[project-prd1042-40]] (epic), [[project-prd1042-585]] (Tenant Detail sibling), [[feedback-figma-link-not-bubbled]] (UI/UX subtask done-but-not-linked pattern).
