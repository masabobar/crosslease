---
name: project-cr-prd1042-1495-framework-agreement-cr
description: CR PRD1042-1495 processed 2026-07-24 — Framework Agreement scope changes from 20/07 PO Sync (Philipp Maute + Laurence Ahrabian). Applied surgically to 4 test suites (803/807/808/809) in-place; 5 already CR-applied (799/800/801/805/812); 3 unaffected (804/806/813). FE merged for A1-A6+B1+B4+B5+B6 (Nevena 2026-07-23); B2/VFE BE-pending
metadata:
  type: project
---

## Summary

CR PRD1042-1495 "Framework Agreement scope changes from 20/07 PO Sync (design walkthrough)" collects the decisions from Philipp Maute (PO) and Laurence Ahrabian on 20 July 2026 for Epic 11 (Framework Agreement). Goal: align FA with Sparkasse's November MVP needs — build only what's asked, keep it simple, hide (don't delete) built-but-not-needed features so they can be reused for later clients.

**Effective date:** 2026-07-20 (PO Sync). **FE merge:** 2026-07-23 (Nevena Milivojevic — A1-A6, B1, B4, B5, B6 merged to develop). **BE-pending:** B2 (VFE / Vorfälligkeitsentschädigung — early-repayment penalty field, feeds early-redemption calculation, held per-tenant flat rate).

## Complete CR item map

| CR item | Affects US (PRD-ID)                                | Nature                                                                                                                                  | Applied in test suites                                                                                        |
| ------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| A1      | 11.3 (801)                                         | Hide last two columns on FA list                                                                                                        | ✅ 801 (pre-existing 2026-07-23)                                                                              |
| A2      | 11.3 (801)                                         | Remove Bank Entity filter from list                                                                                                     | ✅ 801 (pre-existing 2026-07-23)                                                                              |
| A3      | 11.3 (801) + 11.9 (808)                            | Hide utilization / limit column from list; underlying tracking stays                                                                    | ✅ 801 + ✅ 808 (updated 2026-07-24)                                                                          |
| A4      | 11.1 (799) + 11.3 (801) + Partner Mgmt cross-epic  | Hide Bank Entity from FA and Partner Mgmt (list column + filter + chip + IDENTITY section); default `OTHER` on create; no schema change | ✅ 799 (pre-existing) + ✅ 801 (pre-existing) + ✅ 803 (updated 2026-07-24) + 812 already excluded via LC DTO |
| A5      | 11.1 (799)                                         | Currency fixed to EUR for MVP                                                                                                           | ✅ 799 (pre-existing 2026-07-23)                                                                              |
| A6      | 11.8 (807)                                         | Document type optional; uncategorized allowed                                                                                           | ✅ 807 (updated 2026-07-24)                                                                                   |
| B1      | 11.1 (799) + 11.11 + 11.12 + Epic 3                | Pricing stays on FA; prefilled from FA, per-deal override retained                                                                      | ✅ 799 (pre-existing 2026-07-23); 810/811 no test files yet                                                   |
| B2      | 11.1 (799)                                         | VFE optional field, per-LC flat rate table, feeds early-redemption calc                                                                 | ✅ 799 (pre-existing 2026-07-23) AC-VFE Blocked on B2-VFE-BE-pending                                          |
| B3      | 11.8 (807)                                         | All FA documents optional first; mandatory list configurable per-tenant                                                                 | ✅ 807 (updated 2026-07-24) — AC-CR-B3 bundled/config-level                                                   |
| B4      | 11.10 (809)                                        | FA edit flow aligned with 6-step creation flow (incl. Special Conditions); versioning preserved                                         | ✅ 809 (updated 2026-07-24)                                                                                   |
| B5      | 11.5 (804) + 11.6 (805) + 11.7 (806) + 11.17 (816) | Reduce lifecycle to CRUD + review; hide Reactivation + Four-Eyes UI, retain model                                                       | ✅ 805 (pre-existing 2026-07-24 via D-CR-B5-Rollback); 804/806 unaffected (kept in UI); 816 Backlog unstarted |
| B6      | 11.2 (800)                                         | Optional Valid Until on FA activation                                                                                                   | ✅ 800 (pre-existing 2026-07-23)                                                                              |
| C1      | (—)                                                | Syndication / Bank entity noted for post-MVP                                                                                            | N/A — noted only                                                                                              |
| C2      | (—)                                                | Per-LC document requirements post-MVP                                                                                                   | N/A — noted only                                                                                              |

## Impact set (12 test suites in `src/e2e/tests/PRD1042-22-Framework Agreement/`)

**Already CR-applied (no file changes this session):**

- PRD1042-799 FA Creation Draft — CR A4/A5/B1/B2 applied 2026-07-23
- PRD1042-800 FA Activation — CR B6 applied 2026-07-23
- PRD1042-801 FA List View — CR A1/A2/A3/A4 applied 2026-07-23
- PRD1042-805 FA Reactivation — CR B5 applied 2026-07-24 (D-CR-B5-Rollback dependency)
- PRD1042-812 FA LC Portal Summary — CR A4 pre-aligned (bank-internal fields excluded via LC DTO)

**Updated in this session (2026-07-24):**

- PRD1042-803 FA Detail View — CR A4: Bank entity chip removed from chip row + IDENTITY section field list, AC-01 assertion inverted from "present" to "not present"; AC-CR-A4 added to scope filter (bundled into AC-01)
- PRD1042-807 FA Document Attachment — CR A6: Document type made optional (server default "Uncategorized"); primary button gate changed from "every row has Document type" to "at least one file staged"; new @happy-path scenario AC-CR-A6 added; CR B3 acknowledged as bundled config-level invariant
- PRD1042-808 FA Live Utilization — CR A3: AC-17 batch scenario reworked as API-only (list-view mini-gauge + flag badges hidden per MVP); Design specification section notes list-view surfacing hidden but backend endpoints unchanged
- PRD1042-809 FA Edit Active/Suspended — CR B4: Interaction model annotated with pre-CR two-step baseline and post-CR 6-step-alignment (Special Conditions step added); AC-01 scenario comment updated; behavioural assertions unchanged (LOCKED/EDITABLE lists, atomic PATCH, expectedVersion + version bump preserved)

**Unaffected by CR (no changes needed):**

- PRD1042-804 FA Suspension — B5 keeps Suspension in UI
- PRD1042-806 FA Termination — B5 keeps Termination in UI
- PRD1042-813 FA Audit Trail Read — read-only audit surface, not touched by CR

## D-\* dependencies introduced / reused

- **D-CR-B5-Rollback** (introduced 2026-07-24 via 805) — Reactivate UI entry-point visibility toggle. Unblocks AC-01 UI click-path in 805 once CR B5 is rolled back or flag-gated. Reused as impact tag in this CR memory.
- **B2-VFE-BE-pending** (introduced 2026-07-23 via 799) — VFE field BE build gap per Nevena 2026-07-23. FE hidden until BE ships. AC-VFE on 799 remains Blocked.

## E2E-ready count deltas per suite

| Suite | Before CR  | After CR    | Delta reason                                        |
| ----- | ---------- | ----------- | --------------------------------------------------- |
| 799   | 6 of 6 ✅  | 6 of 6 ✅   | No change (VFE Blocked pre-existing)                |
| 800   | 5 of 5 ✅  | 5 of 5 ✅   | Valid Until optional already covered                |
| 801   | 4 of 4 ✅  | 4 of 4 ✅   | Bank Entity / utilization already hidden in Feature |
| 803   | 8 of 10 ✅ | 8 of 10 ✅  | AC-01 & AC-07 assertions updated (still ✅)         |
| 805   | 9 of 10 ✅ | 9 of 10 ✅  | D-CR-B5-Rollback pre-recorded                       |
| 807   | 9 of 11 ✅ | 10 of 12 ✅ | +1 scenario AC-CR-A6 (E2E-ready ✅)                 |
| 808   | 0 of 10 ✅ | 0 of 10 ✅  | AC-17 stays ⚙️; behaviour changed (API-only)        |
| 809   | 9 of 12 ✅ | 9 of 12 ✅  | No new scenarios; comments annotated                |
| 812   | 6 of 9 ✅  | 6 of 9 ✅   | Bank-internal exclusion already covered             |
| 804   | 7 of 11 ✅ | 7 of 11 ✅  | Not touched                                         |
| 806   | 4 of 10 ✅ | 4 of 10 ✅  | Not touched                                         |
| 813   | 0 of 11 ✅ | 0 of 11 ✅  | Not touched                                         |

## `[CR-REMOVED — coordinate spec deletion]` items

None. No `@e2e-ready` scenarios were removed. All CR changes are either:

- Copy inversions (present→hidden) on existing scenarios
- Comment / rationale annotations
- New scenarios added (AC-CR-A6 on 807)
- Endpoint scope narrowing without endpoint removal (AC-17 on 808 becomes API-only)

The 805 UI happy-path scenario was already Blocked by D-CR-B5-Rollback pre-CR-run — no additional coordination needed.

## Comparison to related sessions

- **[[project-prd1042-805-framework-agreement-reactivation]]** — the D-CR-B5-Rollback dependency this CR memory pairs with.
- **[[project-prd1042-22-framework-agreement]]** — Epic 11 batch memory covering 799/800/801/807; already had CR A1-B6 recorded inline.
- **[[project-prd1042-803-807-809-framework-agreement]]** — 803/807/809 batch, now amended per this CR.
- **[[project-prd1042-808-framework-agreement-utilization]]** — 808 standalone, now amended per CR A3.

Epic folder: `PRD1042-22-Framework Agreement`. CR ticket: `PRD1042-1495`. CR children: PRD1042-1527 (BE), PRD1042-1532 (FE).
