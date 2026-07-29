---
name: project-prd1042-22-framework-agreement
description: Epic 11 Framework Agreement — PRD1042-799/800/801/807 processed 2026-07-23; CR PRD1042-1495 changes applied; Figma quota exhausted; folder PRD1042-22-Framework Agreement
metadata:
  type: project
---

## Epic 11 Framework Agreement — QA Processing Run 2026-07-23

**Epic key:** PRD1042-22 | **Epic folder:** `PRD1042-22-Framework Agreement` (hyphen convention, matches 37/39/40 pattern)
**Stories processed:** PRD1042-799, PRD1042-800, PRD1042-801, PRD1042-807
**CR applied inline:** PRD1042-1495 (PO Sync 2026-07-20; Philipp Maute + Laurence Ahrabian)

**Why:** User requested full 4-story batch with CR update pass in one session (2026-07-23). All four stories are "Dev in progress." CR PRD1042-1495 changes were confirmed and FE-merged (Nevena 2026-07-23) before test generation; incorporated directly into generated files rather than as a separate update pass.

**How to apply:** When re-running or extending Framework Agreement tests, check for the same CR items (A1–A6, B1, B4, B5, B6 are FE-done; B2/VFE is BE-pending as of 2026-07-23). Unblock AC-VFE in PRD1042-799 when VFE BE ships.

---

## Story results

| Story       | Title                        | DoR  | Design  | Scenarios | Blocked ACs                       |
| ----------- | ---------------------------- | ---- | ------- | --------- | --------------------------------- |
| PRD1042-799 | FA Creation (Draft)          | PASS | PARTIAL | 6 blocks  | AC-15/16/17 (OQs), AC-VFE (B2 BE) |
| PRD1042-800 | FA Activation (Draft→Active) | PASS | PARTIAL | 5 blocks  | none                              |
| PRD1042-801 | FA List View & Search        | PASS | PARTIAL | 4 blocks  | none                              |
| PRD1042-807 | FA Document Attachment       | PASS | PARTIAL | 5 blocks  | none                              |

**All 20 scenario blocks: E2E automation candidates ✅ (no D-series blockers)**

---

## CR PRD1042-1495 — applied changes per story

**A1 (801):** Last two columns hidden — Limit Available Flag, Limit Breach Flag. Test asserts NOT present.
**A2 (801):** Bank Entity filter removed from filter bar. Test asserts NOT present.
**A3 (801):** Utilization %, Limit Available Flag, Limit Breach Flag columns hidden. Test asserts NOT present.
**A4 (799, 801):** Bank Entity field hidden from creation form and list column. Test asserts NOT visible.
**A5 (799):** Currency EUR fixed, display-only. Test verifies "EUR" read-only field visible.
**A6 (807):** Document Type optional. Test uploads without selecting type; expects success.
**B1 (799):** Pricing stays on FA; no structural change. Confirmed in happy-path field list.
**B2 (799 — BLOCKED):** VFE optional field; BE-pending per Nevena 2026-07-23. Classified as Blocked AC-VFE.
**B3 (807):** All FA documents optional; mandatory list configurable. Test verifies no mandatory-doc validation blocks upload.
**B5 (800):** Reactivation hidden from UI; code retained. US 11.2 unaffected (covers activation only). US 11.5/11.6/11.7 not in this batch.
**B6 (800):** Optional "Valid Until" field confirmed in activation modal. Included in happy-path activation scenario.

---

## Figma quota + recovery

**Primary REST endpoint quota-exhausted:** `GET /v1/files/{key}?ids=X&depth=N` returned 429 with `Retry-After: 217209` (~60h) and `X-Figma-Rate-Limit-Type: low`. MCP Figma tools also blocked (same Professional-plan seat).

**Recovered via fallback:** `GET /v1/files/{key}/nodes?ids=X&depth=8` returned HTTP 200 immediately on the same token, same file, same nodes. Separate rate-limit bucket. Cache populated: `/tmp/figma-cache-e11/page-1-2-d8.json` (7.2 MB) + `page-10-15285-d8.json` (8.8 MB). Full design walk successful; verbatim copy anchors added to all four .md files. See [[feedback-figma-nodes-fallback]].

**Design conventions (E11 file `aQGn5OLEjEGJO7xGzFikP5`):**

- 5 pages: cover (0:1) / FA list + Create agreement (1:2) / FA details page (10:15285) / Suspension, Reactivation, Termination (29:3780) / LC Portal summary (100:10990)
- Each page groups related workflow states inside SECTION nodes: CREATE AGREEMENT (9:13370), CREATE - documents optional (9:13722), ACTIVATE agreement (28:4119), DETAIL PAGE (24:948), ATTACH DOCUMENT (33:8324), EDIT AGREEMENT (100:6629), Edit agreement - LIMIT BREACH (100:10496), RECONSTRUCT (24:6579)
- Persona in all frames: "Vincent Brooke" (VB) — treat as Power User (Bank Admin) test persona
- Sample FA data used across frames: `RV-SSKM-2026-001` (Active/Draft), `FA-2026-00041` (internal ID), LC "New Group Trade" with bank entity "Sparkasse"
- Create wizard: 6 steps — Identity | Envelope & pricing | Validity & templates | Conditions | Review & save
- FA list columns visible: Agreement | Leasing company | Status | Valid from. Status badges verbatim: Active, Suspended, Draft, Terminated
- Post-activation sidebar: Edit | Suspend | Terminate (no Reactivate — matches CR B5)

**Design gaps found (terminal-only, NOT in .md):**

1. **CR B6 Valid Until in activation dialog** (node 27:5706): Optional "Valid Until" field alongside "Effective from (optional)" is confirmed by CR B6 but NOT yet present in current design. FE needs to add it. Test scenario asserts field presence to catch when it lands.
2. **CR A4 Bank Entity in detail sidebar** (node 27:5706, 96:3072, 33:7727): FA detail sidebar still shows "Bank entity: Sparkasse" label. CR A4 hides Bank Entity from FA broadly (list + Partner Management + creation form). Whether sidebar should also hide it is ambiguous — flag for PM clarification.

---

## Open questions blocking tests

- **OQ-11.01-A** (AC-15 in 799): Bank Entity enum values for tenant-1 — subsumed by v10 [CR-PENDING B1] asset-type / uniqueness decision (Bank Entity itself hidden per v10 §8.2)
- **~~OQ-11.01-B~~** (AC-16 in 799): **RESOLVED by CR PRD1042-22 v10 A2** — Effective Rate is user-entered, stored-as-entered, no derivation. AC-16 unblocked and bundled into AC-01 happy path
- **~~OQ-11.01-C~~** (AC-17 in 799): **SUPERSEDED by v10 A1 + [CR-PENDING B8]** — the five pricing fields (base_rate/spread/rate_type/rate_lock_period/lg_coverage) are REMOVED per A1/A4; term location becomes OQ-11-02 pending Philipp
- **B2/VFE** (AC-VFE in 799): BE build gap; unblock when BE implements VFE calculation

## CR Amendments — PRD1042-22 Reconciliation v10

**Effective:** 2026-07-22 (Scope Reconciliation v2). **QA merge:** 2026-07-27.

**Deltas per suite covered by this memory:**

- **799 FA Creation Draft** — A1/A2/A4/A5 pricing narrowed to single `effective_rate` (+ `vfe_rate` BE-pending). Happy-path input table stripped of `Base Rate`, `Spread`, `Rate Type`, `Rate Lock Period`. AC-09/AC-10 marked `[CR-REMOVED per v10 A1]`. AC-16 unblocked (A2 resolves). AC-15 `[CR-PENDING B1]`, AC-17 `[CR-PENDING B8]`. AC-CR-A5 added asserting `rate_table_ref` / `predecessor_fa_id` / `countersignatory_id` null. AC-11 5-role Outline `[CR-PENDING B5]`.
- **800 FA Activation** — B7 single-admin activation reinforced (CLAUDE.md correction upstream). State model 4 stored values reinforced. AC-08 5-role Outline `[CR-PENDING B5]`.
- **801 FA List View** — B2 new `AC-CR-B2` derived-Expired assertion (past `valid_until` reads as "not active"). B3 new `AC-CR-B3` filterable inventory CSV export (viewer-scoped, audit-logged) — role Outline over Power User + BO/Risk. Bank Entity hidden state re-confirmed per v10 §8.2.
- **807 Framework Document Attachment** — B6 tenant-configurable required-document set (default non-blocking) formally recognised; AC-CR-B3 rationale updated to reference v10 B6. AC-08 `[CR-PENDING B5]`.

**New dependencies:** none new — v10 uses existing D-\* IDs.

**`[CR-REMOVED — coordinate spec deletion]` items:** 799 AC-09 + AC-10 — both were `edge-case`-classified with no active Gherkin scenarios; no coordination needed beyond this memory-log entry.

**Governance flags:** [CR-PENDING B5] on 799/800/807 role Outlines pending Philipp Maute's decision on 4 contested permission-matrix cells (FO create/enrich, SA least-privilege, BO review-on-activation, FO pricing view). Do NOT pre-emptively add FO-authoring scenarios — MaRisk BTO 1.1 front/back-office separation concern.

See also [[project-cr-prd1042-22-reconciliation-v10]] for the full CR context and cross-suite deltas.
