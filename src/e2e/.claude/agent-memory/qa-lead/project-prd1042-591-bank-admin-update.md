---
name: project-prd1042-591-bank-admin-update
description: 2026-07-08 update to PRD1042-591 Tenant Configuration Override Management adding Bank Admin (bank_admin) coverage per PRD1042-48 (Ivan Mladenovic decision 2026-07-06); 3 new scenarios (1 happy + 2 main-error) reflecting permission matrix `R (own tenant)` split
metadata:
  type: project
---

**Fact:** 2026-07-08 file update — `PRD1042-591 Tenant Configuration Override Management.md` retrofitted for the 7-role Bank Admin split introduced by PRD1042-48. The story's permission matrix explicitly names "Power User (Bank Admin)" with `R (own tenant)` — this maps to the new `bank_admin` role wire value in the PRD1042-48 realignment. Read-only on own tenant, no create/modify, no cross-tenant read.

**Why:** Ivan Mladenovic decision 2026-07-06 introduced `bank_admin` (`user_type: bank_tenant`, tenant-bound and immutable) as the bank-level administrative role, distinct from System Admin (platform-level). Philipp Maute comment 38524 on this story (2026-07-03) explicitly flagged the Bank Power User / System Admin terminology alignment for review. The story's own permission matrix already carries the `R (own tenant)` grant for Power User — updating the tests aligns the fixtures and RBAC assertions with the new wire value, without altering the story's business intent.

**How to apply:** For future stories referencing "Power User" in permission matrices, treat as `bank_admin` and apply the same three-scenario pattern:

1. Happy-path READ on own tenant (if `R` in matrix)
2. Main-error WRITE → 404 on own tenant (if `✗` for Create/Modify in matrix) — RefiNext 404-not-403
3. Main-error cross-tenant READ → 404 (tenant-binding immutability from PRD1042-48)

**Changes to file:**

- Header banner added explaining 2026-07-08 update and permission-matrix source
- ACs with Gherkin scenarios: 8 → 10 of 16
- Three new ACs added to Scope Filter table: AC-13a (happy-path READ own tenant), AC-13b (main-error WRITE→404), AC-13c (main-error cross-tenant READ→404)
- Scenarios summary table: 8 → 11 scenario blocks (added 1 happy + 2 main-error)
- Background extended with Bank Admin fixture user (`bank-admin-alpha@bank.com`, role `bank_admin`, user_type `bank_tenant`, tenant_scope `tenant-alpha`)
- Three new Gherkin scenario blocks added between existing happy-path and existing main-error sections
- All three new scenarios are `⚙️ needs Seed-Harness` / `⚙️ needs D20` (not `@e2e-ready`) — bank_admin fixtures + platform-object fixtures + second-tenant fixture not yet provisioned

**Open questions logged:**

- Whether Bank Admin can view Rate Table overrides once Rate Tables ship post-November — deferred with AC-16 `separate-feature` classification
- Whether Bank Admin READ scope extends to overrides created before their `access_valid_from` — not addressed by story description, assume yes (permission matrix is absolute for own tenant)

**Related:**

- [[project-prd1042-48-bank-admin-update]] — origin of the 7-role model
- [[project-prd1042-49-bank-admin-update]] — same 2026-07-08 retrofit on Tenant Scope Assignment
- [[project-prd1042-591]] — original story processing memory
