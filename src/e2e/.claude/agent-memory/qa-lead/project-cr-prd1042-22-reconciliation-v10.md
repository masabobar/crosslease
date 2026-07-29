---
name: project-cr-prd1042-22-reconciliation-v10
description: CR PRD1042-22 Reconciliation v10 processed 2026-07-27 — Framework Agreement Epic 11 reconciliation applied against sold scope (Scope-Abgleich 2026-07-22). Applied inline to all 12 test suites; A1/A2/A3/A4/A5/A6/B2/B3/B6/B7 fully applied; B1/B4/B5/B8 marked [CR-PENDING] pending Philipp Maute decisions; state model corrected 5→4 stored values; single-admin activation confirmed
metadata:
  type: project
---

## Summary

CR PRD1042-22 Reconciliation v10 collects the PRD1042 reconciliation of the v9 November Scope Epic Specification against the built code and the sold scope (Scope Reconciliation v2 / _Scope-Abgleich_, 2026-07-22). It supersedes v9 where they overlap and corrects downward to sold scope with the BPS excluded from the ticket baseline. Applied by qa-lead on 2026-07-27 across all 12 Framework Agreement test suites in `src/e2e/tests/PRD1042-22-Framework Agreement/`.

**Effective date:** 2026-07-22 (Scope Reconciliation v2). **QA merge (this session):** 2026-07-27. **Precedence:** CR PRD1042-1495 governs where they overlap; sold scope governs where v9 disagrees; platform Decision Log entries set cross-cutting patterns.

**Label caution:** this CR's A1–A6 / B1–B8 are NOT the same as PRD1042-1495's A1–A6 / B1–B6. Every reference in the amended suites is qualified `CR PRD1042-22 A1` vs `CR PRD1042-1495 A1`.

## Complete CR item map

### Part A — switch off (all Applied)

| CR item | Affects US (PRD-ID)                                          | Nature                                                                                                                                                                                                                          | Applied in test suites           |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| A1      | 11.1 (799), 11.4 (803), 11.10 (809), 11.11+11.12 (no suites) | Remove `base_rate`, `spread`, `rate_type`, `rate_lock_period_months` from create/edit contracts and detail response; columns kept nullable & unwritten. `effective_rate` (single rate) and `vfe_rate` retained                  | ✅ 799, 803, 809                 |
| A2      | 11.1 (799), 11.11+11.12                                      | Stop deriving the rate (base+spread); store the value the user enters. `effective_rate` is captured, not calculated. Resolves prior OQ-11.01-B on AC-16                                                                         | ✅ 799 (AC-16 unblocked)         |
| A3      | 11.4 (803), 11.11+11.12                                      | Trim `/pricing-snapshot` to the single rate; keep `edit_version_counter` (Epic 3 audit anchor)                                                                                                                                  | ✅ 803                           |
| A4      | 11.1 (799), 11.4 (803), 11.10 (809)                          | Remove `lg_coverage_rate_override` from create/edit/detail; column kept                                                                                                                                                         | ✅ 799, 803, 809                 |
| A5      | (cross-cutting verify)                                       | `rate_table_ref`, `predecessor_fa_id`, `countersignatory_id` remain null/unwritten; verify no code path sets them                                                                                                               | ✅ 799 (verify note in AC-CR-A5) |
| A6      | 11.14 (813), cross-cutting                                   | **SECURITY:** map `FA_SUSPEND`, `FA_REACTIVATE`, `FA_TERMINATE`, `FA_AUDIT_READ`, `FA_VFE_MANAGE` to `PlatformModule.FRAMEWORK_AGREEMENT`. Fix the mapping, not the endpoints. Systemic variant (other epics) raised separately | ✅ 813 (audit-read module-gate)  |

### Part B — finish (mixed status)

| CR item | Affects US (PRD-ID)                                                        | Nature                                                                                                                                                                                                                    | Status                    | Applied in test suites                                                            |
| ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| B1      | 11.1 (799)                                                                 | Asset type: default = no code change; correct v9 prose to match its field table + sold scope. Per-asset-class handled via multiple agreements per LC (US 11.19 substitute). Uniqueness = tenant + bank entity + LC + name | **⚠️ PENDING Philipp**    | 799 marked [CR-PENDING B1] on AC-15                                               |
| B2      | 11.1 (799), 11.3 (801), 11.13 (812)                                        | Derive expiry from `valid_until`; apply everywhere activeness is asserted. `FALifecycleStatus` stays four values — `EXPIRED` not added                                                                                    | ✅ Applied                | 801 (list derived), 812 (LC list Active/Suspended only), 799 (state model note)   |
| B3      | 11.3 (801)                                                                 | Build filterable inventory CSV export of the FA list, scoped to viewer, every export audit-logged. Distinct from audit-trail CSV                                                                                          | ✅ Applied                | 801 (new AC-CR-B3)                                                                |
| B4      | 11.5 (804), 11.7 (806), 11.9 (808), 11.10 (809)                            | Compute used-against-approved figure; wire suspend/terminate dependency checks to real financings (not Limit Management, not empty lists). Display must NOT block/gate                                                    | **⚠️ PENDING ref figure** | 804/806/808 marked [CR-PENDING B4] on dependency-check + utilization scenarios    |
| B5      | 11.1/11.2/11.5/11.6/11.7 (all lifecycle stories); 11.4 detail; 11.14 audit | Reconcile permission matrix to agreed model + one test per role. 4 v9-vs-code differences require confirmation before code moves                                                                                          | **⚠️ PENDING Philipp**    | 799/800/803/804/806/809/813 marked [CR-PENDING B5] on 5-role 404 Outlines         |
| B6      | 11.8 (807)                                                                 | Replace hard-coded `FANoDocumentsError` with configurable required-document set defaulting to non-blocking. Correct v9 field table (governs: 1495 B3)                                                                     | ✅ Applied                | 807 (already covered via AC-CR-A6 from 1495 + tenant-config configurability note) |
| B7      | 11.2 (800), CLAUDE.md                                                      | Correct `framework_agreements/CLAUDE.md`: single-admin activation, not two-admin four-eyes; remove stale exception names                                                                                                  | ✅ Applied                | 800 (confirmed single-admin reinforced), 804/805/806 (single-admin reinforced)    |
| B8      | 11.1 (799), Epic 3                                                         | Decide where the term lives (rate+term sold unit). Do NOT reuse `rate_lock_period_months`. OQ-11-02                                                                                                                       | **⚠️ PENDING OQ-11-02**   | 799 marked [CR-PENDING B8] (rate_lock_period removed but term location undecided) |

## State model correction (§4)

The stored lifecycle has FOUR values — Draft, Active, Suspended, Terminated. "Expired" is NOT a stored state; it is derived from a past `valid_until` (Decision Log 2026-06-10: Expired is a state of a governance request, not of the entity). "Deprecated" remains post-November / backend-only. **This supersedes golden Epic 11 §9**, which listed Expired and Deprecated as stored states.

- Draft → Active: Single Bank Admin (activate + review). No four-eyes.
- Active → Suspended: Single admin, append-only audit.
- Suspended → Active: retained in model; hidden from MVP UI (D-CR-B5-Rollback tracks re-enablement).
- Active/Suspended → Terminated: Single admin two-step; terminal.
- Draft → Hard deleted: Author. Pre-activation only; audit record retained.
- (any) → Expired: DERIVED from `valid_until` — NOT a stored transition.

**FALifecycleStatus enum ∈ {Draft, Active, Suspended, Terminated}.** Any test scenario referencing `Expired` or `Deprecated` as a stored lifecycle enum value must move `Expired` to a _derived_ read.

## Permission matrix reconciliation (§5) — contested cells

Four differences between v9 and the code require Philipp's confirmation before code changes:

1. **Front Office create/enrich:** v9 grants FO create/enrich rights; code 403s FO. **Contested.**
2. **Back Office review on activation:** v9 gives BO review authority on activation; code = Bank Admin only. **Contested.**
3. **System Admin permissions:** v9 says SA = No on all incl. view; code grants SA every permission (over-privilege defect — least-privilege correction required). **Contested.**
4. **Front Office sees pricing:** v9 lets FO see pricing; code blanks it. **Contested.**

**Test-suite treatment:** current 5-role 404 Outlines (`Front Office | Back Office | LC User | Support | Auditor` → 404) are marked `[CR-PENDING B5]` and retained as-is until Philipp confirms. **Do NOT pre-emptively write FO-authoring scenarios** — granting Front Office authoring touches MaRisk BTO 1.1 front/back-office separation.

## Impact set (12 test suites)

**Batch 1 — Applied, no dependencies (7 suites):**

- **PRD1042-799 FA Creation Draft** — A1/A2/A4/A5 pricing narrowed to `effective_rate` only; `base_rate`, `spread`, `rate_type`, `rate_lock_period_months`, `lg_coverage_rate_override` removed from creation payload table + AC-09/AC-10 marked [CR-REMOVED — obsolete pricing fields]; AC-16 unblocked (A2 resolves OQ-11.01-B: store as entered); AC-15 marked [CR-PENDING B1]; AC-17 marked [CR-PENDING B8] term location.
- **PRD1042-800 FA Activation** — B7 single-admin confirmed as reinforcement; AC-08 5-role Outline marked [CR-PENDING B5].
- **PRD1042-801 FA List View** — B2 derived Expired assertion added (past `valid_until` renders "not active"); B3 new AC-CR-B3 filterable CSV export (audit-logged, viewer-scoped).
- **PRD1042-803 FA Detail View** — A1/A3/A4 pricing narrowed; Background stripped of `Base rate`, `Spread`, `Rate type`, `Rate lock period` (keeps `Effective rate`); AC-03 Outline `lg_override_visible` column removed; PRICING section = single effective_rate + edit_version_counter only.
- **PRD1042-807 Framework Document Attachment** — B6 already covered via AC-CR-A6 from CR PRD1042-1495; added CR v10 reference on AC-CR-B3 confirming tenant-configurability of required-document set.
- **PRD1042-809 FA Edit Active/Suspended** — A1/A4 EDITABLE FIELDS narrowed; removed `Base rate`, `Spread`, `Rate type`, `Rate lock period`, `LG-specific coverage rate override`; AC-01 happy-path multi-field edit rewritten to change `Effective rate` + `Max volume` + `Valid until` only.
- **PRD1042-813 FA Audit Trail Read** — A6 module-gate assertion added on FA_AUDIT_READ (`PlatformModule.FRAMEWORK_AGREEMENT` mapping); state model 4-values already ✅.

**Batch 2 — Pending markers (3 suites):**

- **PRD1042-804 FA Suspension** — [CR-PENDING B4] on dependency-check reference figure; [CR-PENDING B5] on AC-14/AC-16 5-role Outline; single-admin confirmed via B7.
- **PRD1042-806 FA Termination** — [CR-PENDING B4] on AC-03/AC-10 dependency check; [CR-PENDING B5] on AC-07/AC-08 role Outline.
- **PRD1042-808 FA Utilization** — [CR-PENDING B4] on entire utilization surface (source-of-truth Limit Management vs real financings contested); non-gating invariant confirmed per §6 US 11.9.

**Batch 3 — Minimal touch (2 suites):**

- **PRD1042-805 FA Reactivation** — B5 UI-hidden already captured as `D-CR-B5-Rollback` from CR PRD1042-1495. §4.3 note added confirming "retained in model; hidden from MVP UI".
- **PRD1042-812 FA LC Portal Summary** — B2 note only (LC list already Active/Suspended only, no Draft/Terminated); bank-internal hidden field inventory already excludes `Base Rate`, `Spread`, `LG-Specific Coverage Rate Override`.

## D-\* dependencies introduced / reused

**No new D-IDs.** All amendments use existing dependencies:

- `D-CR-B5-Rollback` (introduced by CR PRD1042-1495) — reused for §4 UI dead-end note on 805.
- `D-Concurrency-Forge`, `D-MFA-StepUp`, `D-EventBus-Inspection`, `D20`, `D-LimitMgmt-Degraded`, `D-DocMgmt-FileMissing`, `D-VirusScan-Force`, `D-DocMgmt-Down` — pre-existing.

## `[CR-REMOVED — coordinate spec deletion]` items

- **PRD1042-799 AC-09** `Pricing field ranges: Base Rate 0–25%, Spread -5%–15%, Rate Lock 1–360 months` — [CR-REMOVED — obsolete per v10 A1: base_rate, spread, rate_lock_period removed from API contract]
- **PRD1042-799 AC-10** `Effective Rate consistency (Fixed/Floating); EURIBOR+Spread indicative` — [CR-REMOVED — obsolete per v10 A1/A2: Effective Rate is now the sole rate, stored as entered; no derivation, no Fixed/Floating consistency check, no EURIBOR+Spread indicative warning]

Neither AC had a `@e2e-ready` Gherkin scenario — both were classified `edge-case` and had no active scenarios. No spec deletion coordination needed beyond a memory-log entry.

## Pending decisions (route to Philipp)

Per §7 of the CR:

| #   | Decision                                                                                                                          | Blocks                                                | Marked in          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------ |
| 1   | B5 permission matrix: FO create/enrich? SA least-privilege? BO review-on-activation? FO sees pricing? (highest governance impact) | Role gate Outlines across 799/800/803/804/806/809/813 | [CR-PENDING B5]    |
| 2   | B4 reference figure: active-financings volume vs current outstanding residual debt                                                | 804/806/808 dependency check + utilization surface    | [CR-PENDING B4]    |
| 3   | B8 / OQ-11-02: where the term lives — deal-only vs prefilled FA default field                                                     | 799 term-location scenario                            | [CR-PENDING B8]    |
| 4   | B1 asset type: multiple-agreements mechanism vs dedicated field + uniqueness change                                               | 799 uniqueness rule (AC-15)                           | [CR-PENDING B1]    |
| 5   | Forthcoming pricing update: confirm it does not change November field set before treating as final                                | Pricing contract finality across 799/803/809          | Recorded here only |

## Governance flags for the audit file

- **No four-eyes on FA setup (this B5/B7) —** diverges from BPS / MaRisk BTO 1.1 and golden Epic 11 FA-6. Compliant carry: machinery retained in model, disabled in UI, re-enabled before production. Audit logging is NOT part of the deferral. Decision record required on PRD1042-816.
- **A6 module-gate bypass —** fail-closed violation; per-tenant deactivation is the descoping mechanism, so the unmapped permissions defect must be closed for SSKM Tenant-1. Systemic variant raised separately. Test coverage in 813.
- **Downward reconciliation —** several items correct v9 to sold scope with the BPS excluded from baseline; golden Epic 11 §5/§9 must be amended so the golden reference and the November build do not drift.

## Comparison to related sessions

- **[[project-cr-prd1042-1495-framework-agreement-cr]]** — precedes this CR; v10 governs over 1495 where they overlap. Both applied atomically to the same 12 suites.
- **[[project-prd1042-22-framework-agreement]]** — Epic 11 batch memory covering 799/800/801/807.
- **[[project-prd1042-803-807-809-framework-agreement]]** — 803/807/809 batch (now dual-amended per 1495 + v10).
- **[[project-prd1042-804-framework-agreement-suspension]]**, **[[project-prd1042-805-framework-agreement-reactivation]]**, **[[project-prd1042-806-framework-agreement-termination]]**, **[[project-prd1042-808-framework-agreement-utilization]]**, **[[project-prd1042-812]]**, **[[project-prd1042-813-framework-agreement-audit-trail-read]]** — individual story memories updated with a `## CR Amendments — PRD1042-22 Reconciliation v10` section.

Epic folder: `PRD1042-22-Framework Agreement`. CR "ticket": PRD1042-22 Reconciliation v10 (applied as inline CR against the epic, not a separate Jira child — treat this memory file as the artefact).
