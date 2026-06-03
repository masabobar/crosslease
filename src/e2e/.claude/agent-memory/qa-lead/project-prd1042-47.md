---
name: project-prd1042-47
description: PRD1042-47 US 28.10 Session Management — 13 ACs, DoR PASS, no Figma (backend security story), Stage 3 WARNINGS, 5 scenario blocks, 2 MAJOR design gaps
metadata:
  type: project
---

US 28.10 Session Management processed via full QA pipeline on 2026-06-03. No Figma URL provided or linked in story.

**Why:** Backend session security story ("as a system" actor) — third consecutive backend security story after PRD1042-46 (Account Lockout) and PRD1042-43 (Login). Minimal UI surface.

**How to apply:** When other stories reference session timeout or session expiry as a side-effect, classify as separate-feature pointing to PRD1042-47. Admin deactivation (AC-08) and password reset (AC-07) session invalidation are tested in their respective specs.

## Story facts

- 13 ACs, DoR PASS, Dev in progress, assigned Vesna Plakalovic
- No Figma design linked
- UI surface: expired session redirect to /login (AC-04), logout action (AC-05)
- Configurable: session timeout 15 min default, max 8h absolute, concurrent sessions boolean
- Tenant isolation rule applies: cross-tenant access returns 404 not 403 (AC-02)

## AC classification

- happy-path: AC-04 (expired session redirect), AC-05 (manual logout)
- main-error: AC-02 (tenant isolation auto-negative), AC-06 (post-logout access + token replay, 2 scenarios)
- separate-feature: AC-01, AC-03, AC-07, AC-08, AC-09, AC-10, AC-11, AC-13
- edge-case: AC-12 (cookie security properties)
- Total: 5 scenario blocks (0 Outlines + 5 Scenarios)

## MAJOR design gaps

1. No session-expired redirect state designed — no toast, banner, or redirect flow
2. Logout button placement not confirmed — profile area in navbar but no explicit button captured at depth-8

## Pattern: Backend security story cluster (US 28.x)

PRD1042-46, PRD1042-47, PRD1042-43 are all backend-heavy. Consistent approach:
- Use story AC text as authoritative source for any message copy
- Apply tenant isolation auto-negative (404 not 403) where AC references tenant scope
- Time-based ACs → always separate-feature; their HANDLING ACs → happy-path with fixture

See also: [[project-prd1042-46]] (Account Lockout), [[project-prd1042-43]] (User Login)
