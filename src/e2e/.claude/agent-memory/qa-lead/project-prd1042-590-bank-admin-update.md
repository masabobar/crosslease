---
name: project-prd1042-590-bank-admin-update
description: 2026-07-08 update to PRD1042-590 Tenant Archiving.md — added Bank Admin role (bank_admin) per PRD1042-48 (Ivan Mladenovic 2026-07-06). Bank Admin cannot archive (platform-only). AC-15 Outline now 6 rows; new @pending scenario for own-tenant archived read (parallel to Support AC-14 ambiguity).
metadata:
  type: project
---

2026-07-08 retrofit of `src/e2e/tests/PRD1042-40-Tenant Management/PRD1042-590 Tenant Archiving.md` for the Bank Admin role split introduced by PRD1042-48 (Ivan Mladenovic 2026-07-06 decision).

**Why:** Bank Admin (`bank_admin`, user_type `bank_tenant`) is the tenant-level administrator role, distinct from System Admin (platform-level). Tenant archiving is a platform-level lifecycle operation — the Jira Permission Matrix explicitly lists "Power User (Bank Admin)" with ✗ for Initiate archiving, Countersign archiving, and Read archived data. Bank Admin cannot archive any tenant, own or other.

**How to apply:**

- AC-15 (RBAC + 404-not-403) Scenario Outline now has 6 unauthorized roles: Bank Admin added at top of list. Same 404 enumeration-prevention rule as other roles — Bank Admin gets 404 on archive endpoint, no leak of own-tenant identifier.
- AC-14 (read access to archived data) has parallel ambiguity for Bank Admin: spec allow-list names only System Admin + Auditor; Support role is ambiguous (Vesna Plakalovic 2026-06-10 comment 36743); Bank Admin own-tenant read is a parallel unresolved question. New `@pending` scenario added — awaiting product decision.
- Scope filter AC-14 row updated to reference both Support ambiguity AND Bank Admin own-tenant ambiguity.
- Scope filter AC-15 row updated with note "including Bank Admin (platform-only)".
- Scenarios summary: AC-15 row description now says "Non-System-Admin roles (incl. Bank Admin)"; new AC-14 Bank Admin `@pending` row added.
- Active scenario blocks: 7 → 8 (one new @pending). E2E automation candidates unchanged (3 of 6 active — @pending scenarios are not counted).
- Header carries "**Updated 2026-07-08:**" note per user instruction pattern.

**Files changed:** 1 (only this test file).

**Ambiguity flag:** Bank Admin own-tenant archived-data read access — same status as Support role AC-14. Product owner decision needed. Recorded in scope filter AC-14 rationale.

Related: [[project-prd1042-48-bank-admin-update]] establishes the 7-role model. [[project-prd1042-590]] is the original story-processed memory.
