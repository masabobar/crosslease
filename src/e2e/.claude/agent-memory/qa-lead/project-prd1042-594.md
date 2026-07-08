---
name: project-prd1042-594
description: US 29.13 Tenant Governance History View, 14 ACs, DoR PASS, no Figma URL linked, Stage 2 FAILED (design-blind), Stage 3 WARNINGS, 7 scenario blocks, 2 need D21 (AUDITOR_VALIDITY_MINUTES + engagement scope), 404-not-403 confirmed, System Admin + Auditor only viewers
metadata:
  type: project
---

Story PRD1042-594 — US 29.13 | Tenant Management | Tenant Governance History View. Read-only tab inside Tenant Detail view (canvas 52:1806, sibling to [[project-prd1042-585]] US 29.4). Processed 2026-07-07.

**Why:** Governance/audit-trail viewer for System Admin and Auditor roles. Read-only, immutable, append-only event log. Depends on PRD1042-37 (Audit Trail Service — read source) and PRD1042-37 (audit-write for AUDITOR_GOVERNANCE_ACCESS event).

**How to apply:** Reference for future read-only governance/history views in Epic 29 or wider tenant surface. 404-not-403 pattern confirmed by AC-11. Auditor engagement-window enforcement pattern (AC-13) mirrors [[project-prd1042-46]] session-management style.

**Status:** QA ready (2026-07-07). Story remains unblocked at Stage 3 despite Stage 2 FAILED — design-blind is not CRITICAL per pipeline rules.

**Stage 2 result:** FAILED. No Figma URL in story description. Figma REST API quota-exhausted (session context Retry-After ~4.3d). No cached section available; closest sibling analog is Tenant Detail canvas 52:1806 (never fully extracted for governance sub-view). Design gaps unverified.

**Key domain rules embedded:**

- 404-not-403 for Support User, Front Office, Back Office, LC User (AC-11) — Scenario Outline
- Auditor engagement scope drives conditional column visibility (AC-12) — Countersignatory + Governance Justification redacted for out-of-scope events
- Auditor engagement expiry revokes access on next API call — 403, not 404 (AC-13). Distinct from AC-11 tenant-existence enumeration guard.
- Read-only: no edit/delete/modify controls for any role, any state, any tenant status (AC-03)
- Archived tenants retain full governance history and remain accessible read-only (AC-06, AC-14)
- Default sort: Timestamp DESC (AC-02)
- Timestamp column is UTC (AC-07)

**Excluded ACs (scope filter):**

- AC-09 (pagination cap 50/page + cursor) — edge-case, backend contract boundary
- AC-10 (AUDITOR_GOVERNANCE_ACCESS audit-write) — separate-feature owned by PRD1042-37 Audit Trail Service

**E2E readiness:** 5 of 7 scenarios @e2e-ready. AC-12 and AC-13 need D21 (AUDITOR_VALIDITY_MINUTES override + engagement scope fixture) to deterministically test redaction + expiry.

**Open ambiguities (not blockers, flagged for BA):**

- "Excluded where not relevant to their engagement" — assumed events outside engagement window are redacted; needs BA confirmation
- Default date range on filter panel (last 30d? all-time?) — not specified; treated as edge-case
- Sort direction toggle on Timestamp column — only default reverse-chron stated; interaction unverified
- Tab-hide vs 403 semantics on engagement expiry — AC-13 says next API returns 403, but tab-hide timing not specified

**API endpoint:** GET /api/tenants/{id}/governance-history?type=&from=&to=&cursor=

**Related open items:** none surfaced in Jira comments (only Iva Marković review comment on 2026-06-01)

**Children:**

- PRD1042-686 BE
- PRD1042-687 FE
- PRD1042-688 QA

Links: [[project-prd1042-585]] (same Tenant Detail canvas), [[project-prd1042-596]] (adjacent story with same Figma quota failure), [[project-prd1042-46]] (session/engagement expiry pattern), [[feedback-figma-link-not-bubbled]] (missing URL pattern)
