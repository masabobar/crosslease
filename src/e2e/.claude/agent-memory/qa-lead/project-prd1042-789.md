---
name: project-prd1042-789
description: US 26.12 Cross-Tenant Audit Access Governance — 19 synthesized ACs, DoR PASS, Stage 2 FAILED (Figma MCP quota exhausted + Bash disabled), Stage 3 WARNINGS, 6 scenario blocks (3 happy + 3 error), 8 Blocked (TM-17 + D20 + D-Time-Bound-Expiry + D-Session-Revalidation-Signal + D-Audit-Read-API + D-EventBus-Inspection), 404-not-403 uniform across 5 non-platform roles, Bank Admin excluded (no audit read per Permission Matrix)
metadata:
  type: project
---

**Story:** PRD1042-789 — US 26.12 | AUDIT TRAIL | Cross-Tenant Audit Access Governance
**Epic:** PRD1042-37 — Epic 26: Audit Trail (parent)
**Jira status:** Ready for DEV Review (children FE PRD1042-1018 + BE PRD1042-1017 both QA ready; QA subtask PRD1042-1019 Open)
**Date processed:** 2026-07-10
**Reporter comment:** Iva Marković 2026-06-10 — "check open questions and assumptions at end"
**Approval:** Philipp Maute 2026-06-16 comment 37245 moved all 12 ready Audit Trail stories to Client Approved per Vesna email of 15 June

**Story shape**

- Backend governance/enforcement story — parallel to US 29.17 (Cross-Tenant Allow-List Governance) but on the enforcement side (Audit Trail is enforcement-only, not allow-list owner)
- TM-17 owns allow-list CUD (blocking upstream); Audit Trail enforces at query time
- Sibling stories: US 26.09 (access logging), US 26.10 (Investigation surface — UI owner)
- Single-actor (platform-level Auditor); no Four-Eyes
- 404-not-403 uniform mask (per RefiNext tenant isolation rule confirmed by Philipp Maute 2026-06-02 alignment)

**DoR:** PASS — 19 ACs synthesized from Functional / Validation Rules / System Behavior / Security / NFR / Edge Cases / Architectural Notes / Audit Requirements sections; description present; Client Approved

**Stage 2:** FAILED

- MCP Figma tool: quota exhausted on Professional View seat (per session)
- Bash tool: not enabled in this session → `figma_fetch` REST helper unavailable
- WebFetch: cannot inject `X-Figma-Token` → unauthorized
- Precedent-aligned decision: proceed design-blind (matches PRD1042-46/47/69/592/598/599 backend-governance pattern)

**Stage 3:** WARNINGS

- MAJOR gap: no Figma frame for AC-17 tenant-scope selector — but selector lives on US 26.10 Investigation surface (which owns primary UI); enforcement-side testing here
- 404-not-403 uniform pattern applied to AC-04/05/06/12/14 (RefiNext tenant isolation domain rule)
- Bank Admin excluded from role-list (Permission Matrix does not grant BA any audit-trail read access)

**Blocked ACs (8):**

- AC-02 (allow-list CUD) → TM-17 owns
- AC-07 (per-query re-validation) → D-Session-Revalidation-Signal (parallel to D-Session-Signal from PRD1042-597 AC-17)
- AC-08 (dual-log emission) → D20 + D-Audit-Read-API
- AC-10 (time-bound expiry) → D-Time-Bound-Expiry
- AC-11 (NFR latency) → perf harness (separate-feature-ish)
- AC-13 (mid-session expiry) → D-Time-Bound-Expiry + D-Session-Revalidation-Signal
- AC-18 (event emission) → D-EventBus-Inspection
- AC-19 (audit record types) → D-Audit-Read-API + PRD1042-37 audit-log API

**Scenario blocks (6):**

1. `@happy-path` AC-01/03/09/15 — Platform Auditor with allow-list reads target-tenant records (dual-log assertion) — needs D20 + D-Audit-Read-API
2. `@happy-path @e2e-ready` AC-09/15 — No tenantScope → own-tenant only (only fully e2e-ready scenario)
3. `@happy-path` AC-17 — tenant-scope selector visible for platform-Auditor with allow-list — needs D20 + TM-17 seed
4. `@main-error` AC-04/05/12 — Platform Auditor without allow-list → 404 + `CROSS_TENANT_ACCESS_BLOCKED` audit event — needs D20 + D-Audit-Read-API
5. `@main-error` AC-06/14 Outline × 5 roles — non-platform roles → uniform 404 (System Admin, Support, FO, BO, LC User; Bank Admin excluded)
6. `@main-error` AC-17 Outline × 6 role-states — tenant-scope selector hidden

**Open Questions logged (terminal only):**

- OQ-AT-03 — storage model affects cross-tenant query enforcement (upstream)

**Assumption:** Cross-tenant allow-list governed in Tenant Management; Audit Trail enforcement-only

**File written:** `src/e2e/tests/PRD1042-37-Audit Trail/PRD1042-789 Cross-Tenant Audit Access Governance.md`

Related memories: [[project-prd1042-598]] (cross-tenant governance sibling), [[project-prd1042-597]] (Support Access Grant Four-Eyes waiver pattern + D-Session-Signal precedent), [[feedback-bank-admin-role-realignment]] (Bank Admin per Ivan Mladenovic 2026-07-06)
