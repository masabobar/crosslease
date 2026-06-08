---
name: project-prd1042-46
description: PRD1042-46 US 28.9 Account Lockout & Failed Login Handling — 13 ACs, DoR PASS, no Figma (backend security story), Stage 3 WARNINGS, 5 scenario blocks, 3 MAJOR design gaps
metadata:
  type: project
---

US 28.9 Account Lockout & Failed Login Handling processed via full QA pipeline on 2026-06-03. No Figma URL provided or linked in story.

**Why:** Security-layer story with "as a system" actor. Primarily backend behavior with minimal UI surface (lockout message on login page, admin manual unlock in User Management).

**How to apply:** When referencing lockout in other User Management stories, classify it as `separate-feature` pointing to this spec (PRD1042-46). When extending this spec, check design gaps below first.

## Story facts

- 13 ACs, DoR PASS, Dev in progress, assigned Vesna Plakalovic
- No Figma design linked — backend/security story
- Only 2 UI elements: lockout message on login page (text in AC-05) + admin manual unlock in User Detail View
- Lockout message verbatim from AC-05: "Your account is temporarily locked. Please try again later or contact support."
- Configurable params: max failed attempts (e.g. 5), lockout duration (e.g. 15 min), IP threshold, escalation threshold

## AC classification

- happy-path: AC-03 (lockout trigger + enforcement + message), AC-13 (admin unlock)
- main-error: AC-02 (counter reset), AC-07 (generic error, no credential exposure), AC-13 RBAC negative
- edge-case: AC-04, AC-05, AC-09
- separate-feature: AC-01, AC-06, AC-08, AC-10, AC-11, AC-12
- Total: 5 scenario blocks (0 Outlines + 5 Scenarios)

## MAJOR design gaps

1. Locked account state not designed on login page — no banner/error component for lockout message
2. Pre-lockout generic error and lockout message not differentiated in design
3. Admin manual unlock action not designed in User Detail View (PRD1042-73)

## Recurring pattern note

This is the second backend-heavy security story (after any auth stories) with no Figma URL. For future security-layer stories in US 28.x, expect PARTIAL design status and derive UI element copy from story AC text. The admin unlock action overlaps with PRD1042-73 (User Detail View) — confirm with designer that unlock button will appear there.

See also: [[project-prd1042-43]] (User Login — references lockout as separate-feature), [[project-prd1042-73]] (User Detail View — expected location of admin unlock button)
