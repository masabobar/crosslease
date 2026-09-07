import { z } from "zod"

/**
 * Cases (PRD1042-1794 DRC usability) — wire schemas.
 *
 * A case is the operational business object a refinancing/redemption/etc. flow runs on. Front
 * Office and Back Office reach a case's document surface through the Case list → Case detail →
 * Documents tab, so these schemas mirror the backend CaseListItem / CaseResponse contracts
 * (routes/cases.py). Only the fields those two responses actually carry are declared here; the
 * enums are kept as Zod enums so a value the backend adds fails the parse loudly rather than
 * silently rendering unstyled.
 */

// Mirrors the backend CaseType enum exactly.
export const CaseTypeSchema = z.enum([
  "refinancing_request",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
export type CaseType = z.infer<typeof CaseTypeSchema>

// The persisted lifecycle state (case_status). Distinct from display_status below, which is the
// richer status the list/detail surfaces render.
export const CaseStatusSchema = z.enum(["open", "waiting", "done", "cancelled"])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

// display_status is the operational status the UI shows and the `status` query param aliases. The
// backend widens it independently of case_status, so it is parsed as a plain string: a value added
// there must widen this screen's rendering (via a defaulted badge/label) rather than fail its parse.
export const CaseDisplayStatusSchema = z.string()
export type CaseDisplayStatus = z.infer<typeof CaseDisplayStatusSchema>

// Shared field shape behind both CaseListItem and CaseResponse — the two describe the same wire
// entity, so the detail response composes from the list item rather than duplicating fields.
export const CaseSchema = z.object({
  id: z.string().uuid(),
  case_reference: z.string(),
  case_type: CaseTypeSchema,
  case_status: CaseStatusSchema,
  display_status: CaseDisplayStatusSchema,
  origin: z.string(),
  owner_user_id: z.string().uuid().nullable(),
  lc_partner_id: z.string().uuid().nullable(),
  routing_exception: z.boolean(),
  created_by: z.string(),
  created_at: z.string(),
})
export type Case = z.infer<typeof CaseSchema>

// GET /cases — mirrors CaseListResponse. The list item and the detail response share a shape, so
// the same schema drives both the table rows and the detail header.
/**
 * GET /cases — one row of the list.
 *
 * ── THE FOUR OPTIONAL FIELDS ARE DOCUMENTED BACKEND GAPS ───────────────────────────────────────
 * The Figma frame for this screen (`CREATE NEW.pdf`, frame 1) shows six columns. `CaseListItem` as
 * the contract declares it backs only two of them — the case reference with its type, and the
 * status. The other four are added below as **`.optional()`**, which is what makes this honest
 * rather than invented:
 *
 *   - the real API's response still parses — the fields are simply absent, so they read `undefined`
 *   - the table then renders an em-dash in those cells, so the screen is **visibly incomplete**
 *     against a real backend instead of showing a fabricated figure
 *   - the mock layer supplies them, so the design can be reviewed as drawn (prototype-mode.md)
 *
 * The names are not guesses: `lc_partner_name` is exactly what the backend already denormalises
 * onto its own **list** rows (`FAListItemResponse`), `contract_count` exists on `CaseDataResponse`
 * and `FinancingOverviewResponse`, and `phase_name` / `steps_done` / `steps_applicable` are
 * `PhaseProgressResponse`'s own vocabulary. So this is the same shape the backend already uses,
 * asked for on one more row.
 *
 * `last_activity_at` / `last_activity_by` are the exception — neither appears anywhere in the
 * contract, and `CaseListItem` carries only `created_at` / `created_by`. Those two are NOT reused
 * for this column: "Created" and "Last activity" are different facts, and labelling one as the
 * other would be a quiet lie on an audit-relevant screen.
 *
 * Tracked as a backend gap; the columns disappear the day the fields land as required.
 */
export const CaseListItemSchema = CaseSchema.extend({
  // Design column "Leasing company / Lessee". Only the leasing-company half is requested — there
  // is no lessee anywhere on the case, and resolving one would mean a request per row.
  lc_partner_name: z.string().nullable().optional(),
  // Design column "Contracts".
  contract_count: z.number().int().nullable().optional(),
  // Design column "Phase" — rendered as "Phase A" over "Step 1/5".
  //
  // The fraction is the phase's ORDINAL, not progress within it. Across all eight rows of the
  // frame the numerator equals the phase letter's position (A→1/5, C→3/5, D→4/5, E→5/5) and the
  // denominator never moves off 5. So it needs the position and the phase count, not the
  // `steps_done` / `steps_applicable` pair that `PhaseProgressResponse` carries — those describe
  // step completion inside a phase, which this column does not show.
  phase_name: z.string().nullable().optional(),
  phase_position: z.number().int().nullable().optional(),
  phase_count: z.number().int().nullable().optional(),
  // Design column "Last activity" — a timestamp over the person who caused it. The design shows a
  // display name, not an id, so this is a name.
  last_activity_at: z.string().nullable().optional(),
  last_activity_by: z.string().nullable().optional(),
})
export type CaseListItem = z.infer<typeof CaseListItemSchema>

export const CaseListResponseSchema = z.object({
  items: z.array(CaseListItemSchema),
  total: z.number(),
})
export type CaseListResponse = z.infer<typeof CaseListResponseSchema>

// GET /cases/{case_id} — mirrors CaseResponse. Deliberately NOT the list-item schema: that one
// carries the optional display fields above, which the detail endpoint does not promise either.
export const CaseResponseSchema = CaseSchema
export type CaseResponse = z.infer<typeof CaseResponseSchema>

// GET /cases/{business_object_id}/progress — mirrors CaseProgressResponse, added with the
// 2026-09-02 contract refresh.
//
// This is what the design's progress band reads: `Progress · {done}/{applicable} ({percent}%)` above
// a phase stepper. `phase_name` and `position` are nullable on the wire, so a phase the backend
// cannot name still counts toward the totals rather than breaking the row.
export const PhaseProgressResponseSchema = z.object({
  phase_name: z.string().nullable(),
  position: z.number().int().nullable(),
  steps_done: z.number().int(),
  steps_applicable: z.number().int(),
  is_complete: z.boolean(),
  is_current: z.boolean(),
})
export type PhaseProgressResponse = z.infer<typeof PhaseProgressResponseSchema>

export const CaseProgressResponseSchema = z.object({
  business_object_id: z.string().uuid(),
  phases: z.array(PhaseProgressResponseSchema),
  overall_done: z.number().int(),
  overall_applicable: z.number().int(),
  percent_complete: z.number().int(),
  all_complete: z.boolean(),
})
export type CaseProgressResponse = z.infer<typeof CaseProgressResponseSchema>

// GET /cases/{case_id}/data — narrowed deliberately.
//
// `CaseDataResponse` is a wide, deeply nested aggregate (leasing_company, contracts, financing,
// collateral, absent_blocks). The workspace header needs one number from it, so only that is
// declared: Zod strips unknown keys, so this parses the full response and keeps the meta fields.
// Modelling the rest before a screen consumes it would be inventing a contract we do not read.
export const CaseDataMetaSchema = z.object({
  case_id: z.string().uuid(),
  contract_count: z.number().int(),
})
export type CaseDataMeta = z.infer<typeof CaseDataMetaSchema>

/**
 * GET /cases/{case_id}/leasing-company — the wizard's step 1, read back after the bind.
 *
 * ── THIS RESPONSE SETTLES TWO DESIGN CONFLICTS IN THE SPEC'S FAVOUR ────────────────────────────
 * `agreement_reference` and `agreement_active` are **outputs** of binding the leasing company, not
 * inputs. There is no endpoint that offers a choice of framework agreement for a case, which is
 * exactly D-79: *"one active framework agreement per leasing company; determined by the company,
 * shown read-only, never a dropdown."* The Figma frame draws a dropdown (design-extract §6); the
 * contract does not support one, so the agreement renders read-only.
 *
 * And there is **no bank account on this response** — no payout IBAN, no collection IBAN. The design
 * shows both in full; §5.2 says they are partner records that belong on generated documents, not
 * here. The contract agrees with the spec.
 *
 * `null` is a legitimate whole-body response: a case exists before its leasing company is bound, so
 * the endpoint answers `null` rather than 404 (see the `anyOf` in openapi.json). The hook models
 * that as `null` data, not as an error.
 *
 * Money and quotas are decimal strings for the reason given in features/financing/api/schema.ts.
 */
export const CaseLeasingCompanyResponseSchema = z.object({
  lc_number: z.string().nullable(),
  name: z.string().nullable(),
  // Untyped `object` on the wire — no declared properties, so nothing here may be read by key.
  // Parsed permissively so the response still validates; deliberately not rendered. The design's
  // result row reads "Premium Leasing GmbH, Hamburg", but neither this nor `FALCPartnerItem`
  // declares a city, so the town is not shown.
  address: z.record(z.string(), z.unknown()).nullable(),
  contact_person: z.string().nullable(),
  personennummer_os_plus: z.string().nullable(),
  agreement_reference: z.string().nullable(),
  agreement_active: z.boolean(),
  vfe_amount_eur: z.string().nullable(),
  refinancing_quota: z.string().nullable(),
  value_date_rule: z.string().nullable(),
  instalment_due_day: z.number().int().nullable(),
  framework_volume_eur: z.string().nullable(),
})
export type CaseLeasingCompanyResponse = z.infer<
  typeof CaseLeasingCompanyResponseSchema
>

// GET /cases/{case_id}/product-template — the bound template, also nullable before step 1 completes.
// `version_status` and `refinancing_form` are unconstrained strings on the wire despite both having
// enum counterparts elsewhere in the registry, so they are parsed as strings.
export const CaseProductTemplateResponseSchema = z.object({
  product_template_id: z.string().uuid(),
  template_code: z.string(),
  template_name: z.string().nullable(),
  version_number: z.string().nullable(),
  version_status: z.string().nullable(),
  min_term_months: z.number().int().nullable(),
  max_term_months: z.number().int().nullable(),
  refinancing_form: z.string().nullable(),
})
export type CaseProductTemplateResponse = z.infer<
  typeof CaseProductTemplateResponseSchema
>

/**
 * Bulk contract import — wizard step 2 (US 1.5), the design's "MiLK file validation" modal.
 *
 * ── THE FLOW ───────────────────────────────────────────────────────────────────────────────────
 * `POST /contracts/import` (multipart) → a batch with counts but no rows · `GET .../{batch_id}` →
 * the same counts plus the per-row verdicts · `POST .../commit` → the rows become contracts.
 * Nothing is created until the commit, which is what makes the preview a real gate rather than a
 * confirmation of work already done.
 *
 * ── `rows_held` IS THE DESIGN'S "POSSIBLE DUPLICATES" ──────────────────────────────────────────
 * The frame shows four tiles — Total 15, Valid 8, Failed 4, Possible Duplicates 3 — and a commit
 * button reading "Continue with 11 valid contracts". 8 + 4 + 3 = 15 and 8 + 3 = 11, so held rows
 * are committed alongside valid ones and only failures are dropped. There is **no total on the
 * wire**; it is the sum of the three, which is arithmetic on declared fields rather than invention.
 *
 * ── `status` AND `rejection_kind` ARE UNCONSTRAINED STRINGS ────────────────────────────────────
 * Neither is an enum in `openapi.json`, so no fixed set of row states may be assumed. They are
 * parsed as strings and rendered through an i18n lookup that falls back to the raw value — the same
 * treatment `CaseDisplayStatus` gets, and for the same reason (see features/cases/types.ts).
 */
export const ImportRowItemSchema = z.object({
  row_number: z.number().int(),
  status: z.string(),
  rejection_kind: z.string().nullable(),
  error_field: z.string().nullable(),
  error_message: z.string().nullable(),
  // The uploaded file's raw row. `type: object` with **no declared properties** — its keys are the
  // spreadsheet's own column headers, which vary per file. Parsed permissively so the response
  // validates; deliberately never read by key, which is why the design's "Contract no." column is
  // not rendered (there is no stable field to take it from).
  raw_data: z.record(z.string(), z.unknown()),
  contract_id: z.string().uuid().nullable(),
})
export type ImportRowItem = z.infer<typeof ImportRowItemSchema>

// POST /cases/{case_id}/contracts/import — the upload's own answer. Carries the counts but not the
// rows, so the modal follows it with the preview read below.
export const ImportBatchResponseSchema = z.object({
  batch_id: z.string().uuid(),
  case_id: z.string().uuid(),
  file_name: z.string(),
  status: z.string(),
  rows_held: z.number().int(),
  rows_valid: z.number().int(),
  rows_failed: z.number().int(),
  // A whole-file refusal — a missing product template, an unreadable file — as opposed to per-row
  // errors. Set means no row was even assessed, so the modal shows this instead of a row table.
  // The design has no state for it.
  precondition_error: z.string().nullable(),
  created_at: z.string(),
})
export type ImportBatchResponse = z.infer<typeof ImportBatchResponseSchema>

// GET /cases/{case_id}/contracts/import/{batch_id} — the counts again, plus the per-row verdicts.
export const ImportBatchPreviewResponseSchema = z.object({
  batch_id: z.string().uuid(),
  case_id: z.string().uuid(),
  file_name: z.string(),
  status: z.string(),
  rows: z.array(ImportRowItemSchema),
  rows_committed: z.number().int(),
  rows_held: z.number().int(),
  rows_valid: z.number().int(),
  rows_failed: z.number().int(),
  precondition_error: z.string().nullable(),
})
export type ImportBatchPreviewResponse = z.infer<
  typeof ImportBatchPreviewResponseSchema
>

/**
 * POST /cases/{case_id}/submit — the wizard's step 3 (US 1.17).
 *
 * No request body: everything being submitted is already on the case. The response returns the case
 * in its new state, which is what moves the request out of `draft`, plus who submitted and when.
 *
 * `submitted_by` and `submitted_at` are both nullable despite being required keys, so neither may be
 * relied on for the confirmation message.
 */
export const SubmitResultResponseSchema = z.object({
  case: CaseSchema,
  submitted_by: z.string().nullable(),
  submitted_at: z.string().nullable(),
})
export type SubmitResultResponse = z.infer<typeof SubmitResultResponseSchema>

// GET /cases/{case_id}/contracts/totals — the summary's contract count and its money sums. Note it
// carries **no object, lessee, date or term aggregate**; see features/cases/summaryFigures.ts.
export const PackageTotalsReadSchema = z.object({
  contract_count: z.number().int(),
  residual_sum: z.string(),
  acquisition_cost_sum: z.string().nullable(),
  special_payment_sum: z.string().nullable(),
})
export type PackageTotalsRead = z.infer<typeof PackageTotalsReadSchema>

// POST /cases/{case_id}/contracts/import/{batch_id}/commit
export const ImportCommitResponseSchema = z.object({
  batch_id: z.string().uuid(),
  status: z.string(),
  committed: z.number().int(),
  remaining_failed: z.number().int(),
})
export type ImportCommitResponse = z.infer<typeof ImportCommitResponseSchema>

/**
 * Manual contract entry — the design's `Manual contract entry` modal, Object tab (US 1.8).
 *
 * ── THE VEHICLE FLAG IS WHAT THE DESIGN'S INDENTATION MEANS ────────────────────────────────────
 * `GET /object-classification` returns groups with an **`is_vehicle`** flag and their sub-groups.
 * In the Figma frame, `Fuel type` sits indented beneath `Object group` — that indentation is this
 * flag: the sub-group picker and the vehicle-only fields (chassis, licence plate, ZLB II) apply to
 * a vehicle group and not to, say, industrial equipment. So the form reads the flag rather than
 * hard-coding a list of vehicle groups.
 *
 * The frame labels the sub-group "Fuel type" and shows `Hybrid`. That is one bank's sub-group
 * vocabulary, not a separate field — there is no `fuel_type` anywhere in the contract.
 */
export const ObjectSubGroupItemSchema = z.object({
  code: z.string(),
  name: z.string(),
})
export type ObjectSubGroupItem = z.infer<typeof ObjectSubGroupItemSchema>

export const ObjectGroupItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  // Gates the sub-group picker and the three registration fields — see the note above.
  is_vehicle: z.boolean(),
  provenance: z.string(),
  sub_groups: z.array(ObjectSubGroupItemSchema),
})
export type ObjectGroupItem = z.infer<typeof ObjectGroupItemSchema>

export const ObjectClassificationResponseSchema = z.object({
  groups: z.array(ObjectGroupItemSchema),
})
export type ObjectClassificationResponse = z.infer<
  typeof ObjectClassificationResponseSchema
>

export const NewOrUsedSchema = z.enum(["new", "used"])
export type NewOrUsed = z.infer<typeof NewOrUsedSchema>

// Two states, and the design's "Select File" row is what moves it: `pending` until a DAT valuation
// is attached, `uploaded` once one is.
export const DatEvidenceStatusSchema = z.enum(["pending", "uploaded"])
export type DatEvidenceStatus = z.infer<typeof DatEvidenceStatusSchema>

/**
 * A lease object as the wire returns it.
 *
 * Money arrives as `number | string` on this resource — the backend is inconsistent with the case
 * and financing responses, which are decimal strings throughout. Kept as a union and normalised at
 * the formatting boundary rather than coerced, because coercing would turn a null figure into a
 * convincing zero (the reason spelled out in features/financing/api/schema.ts).
 */
const MoneySchema = z.union([z.number(), z.string()]).nullable()

export const LeaseObjectReadSchema = z.object({
  id: z.string().uuid(),
  contract_id: z.string().uuid(),
  object_number: z.number().int(),
  object_group: z.string().nullable(),
  object_sub_group: z.string().nullable(),
  object_description: z.string().nullable(),
  manufacturer: z.string().nullable(),
  brand: z.string().nullable(),
  year_of_manufacture: z.number().int().nullable(),
  chassis_or_serial_number: z.string().nullable(),
  registration_plate: z.string().nullable(),
  vehicle_registration_document_number: z.string().nullable(),
  new_or_used: NewOrUsedSchema.nullable(),
  acquisition_cost: MoneySchema,
  residual_value: MoneySchema,
  special_payment: MoneySchema,
  market_value: MoneySchema,
  appraised_value: MoneySchema,
  value_as_at: z.string().nullable(),
  dat_evidence_status: DatEvidenceStatusSchema.nullable(),
  dat_evidence_document_id: z.string().nullable(),
  removed_at: z.string().nullable(),
})
export type LeaseObjectRead = z.infer<typeof LeaseObjectReadSchema>

// Note the envelope: `{contract_id, objects}` — not the `{items, total}` shape the case's contract
// list and every other collection on this API uses.
export const LeaseObjectListResponseSchema = z.object({
  contract_id: z.string().uuid(),
  objects: z.array(LeaseObjectReadSchema),
})
export type LeaseObjectListResponse = z.infer<
  typeof LeaseObjectListResponseSchema
>

// The only *closed* enum on a contract read. `ContractType` and `AmortisationType` also exist in the
// contract registry (`lease | hire_purchase`, `full | partial`) but are `$ref`'d **only** from
// `ContractCreate` / `ContractEdit` — on `ContractRead` both arrive as bare `string | null`. So they
// are parsed as strings below; see the note there.
export const ContractDeferredStateSchema = z.enum(["active", "deferred"])
export type ContractDeferredState = z.infer<typeof ContractDeferredStateSchema>

/**
 * GET /cases/{case_id}/contracts — narrowed deliberately, the same way `CaseDataMetaSchema` is.
 *
 * `ContractRead` carries 32 fields. The financing workspace's Contracts tab reads ten of them, so
 * only those are declared; Zod strips the rest. Declaring all 32 before a screen consumes them
 * would be modelling a contract we do not read.
 *
 * `contract_type` and `amortisation_type` are strings, not enums, and that is not laziness:
 * `ContractRead` genuinely does not constrain them (see `ContractDeferredStateSchema` above). The
 * design's Contracts tab shows a *third* contract type (`Finance lease` / `Operating lease`) and a
 * different amortisation axis (`Linear` / `Degressive`) than the spec's two-value pairs — a live
 * conflict (design-extract §8). Since the write schemas admit only the spec's values, the design's
 * vocabulary is unreachable through this API; parsing as a string renders whatever the backend
 * actually sends, including legacy or imported values, rather than throwing on the whole page.
 */
export const CaseContractSchema = z.object({
  id: z.string().uuid(),
  leasing_company_contract_number: z.string().nullable(),
  // Read only to count distinct lessees for the wizard's summary (US 1.17). The wire carries no
  // lessee *name* here — just this id — which is why the Contracts tab does not render a lessee
  // column (Q-015) even though the summary can still count them.
  lessee_partner_id: z.string().uuid().nullable(),
  short_name: z.string().nullable(),
  contract_type: z.string().nullable(),
  amortisation_type: z.string().nullable(),
  term_months: z.number().int().nullable(),
  // Decimal strings, for the reason spelled out in features/financing/api/schema.ts — coercing a
  // nullable decimal turns `null` into a convincing `0`.
  net_instalment: z.string().nullable(),
  residual_value: z.string().nullable(),
  contract_start: z.string().nullable(),
  deferred_state: ContractDeferredStateSchema,
})
export type CaseContract = z.infer<typeof CaseContractSchema>

export const CaseContractListResponseSchema = z.object({
  items: z.array(CaseContractSchema),
  total: z.number().int(),
})
export type CaseContractListResponse = z.infer<
  typeof CaseContractListResponseSchema
>
