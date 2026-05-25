---
name: project-refinext-overview
description: RefiNext project context — SaaS lease refinancing for DACH banks/LCs, confirmed stack, QA pipeline stages
metadata:
  type: project
---

RefiNext is a lease financing refinancing SaaS platform targeting German/Austrian/Swiss banks and leasing companies.

**Stack (confirmed):** FastAPI (Python) backend, React (TypeScript) frontend, PostgreSQL, Redis, Docker Compose for local dev, GitLab CI/CD. E2E via Playwright at `src/e2e/`.

**Five User Roles:** Bank Processor, Bank Approver, Bank Support User, Bank Power User/System Admin, Auditor, Leasing Company User.

**Financing lifecycle:** 12 statuses — Draft → Calculating → Calculated → Pending Approval → {Approved | Conditionally Approved | Rework Required | Rejected} → Conditions Pending → Disbursing → Active → Completed.

**Dual Audience:** Bank employees (full write) vs. LC users (proposal-only). Binding decisions are bank-only.

**Four-Eyes Enforcement:** submittedBy !== approvedBy — must be tested with a specific negative case.

**Tenant Isolation:** Cross-tenant access must return 404 not 403.

**Why:** MaRisk BTO 1.1, BAIT AT 9, GDPR, DORA compliance. Any story touching roles/permissions/audit/tenant must get compliance-category test cases automatically.

**How to apply:** When reviewing any story, proactively add Four-Eyes, tenant isolation, and audit-log test cases when domain context applies — do not wait for the story to name them explicitly.

Related memories: [[user-dejan-nikolic]], [[reference-jira]]
