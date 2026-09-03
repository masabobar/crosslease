import { z } from "zod"

/**
 * Financing — the outcome of an approved refinancing request (BR-03: it cannot be created directly).
 *
 * ── SHAPE, AND WHY IT LOOKS LIKE THIS ──────────────────────────────────────────────────────────
 * The backend models a financing as a **sub-resource of its case** (`/cases/{case_id}/financing/*`),
 * not as a top-level entity. There is no `GET /financings` and no `/financings/{id}`, so a financing
 * is only ever reachable through the case that produced it. That is why these screens live in the
 * case workspace's tabs rather than under a route of their own.
 *
 * ── MONEY AND RATES ARE STRINGS, DELIBERATELY ──────────────────────────────────────────────────
 * Every monetary and rate field arrives as a decimal **string** (`"372868.01"`, `"4.650"`), because
 * the backend serialises Decimal that way to avoid float drift on figures that must reconcile to the
 * cent. They are kept as strings here and converted only at the formatting boundary.
 *
 * Do NOT "simplify" these to `z.coerce.number()`. Coercing a nullable decimal string turns `null`
 * into `0` silently — a financing whose amount is not yet calculated would render as "€ 0,00", which
 * reads as a real figure of zero rather than as "no figure yet". That exact defect is live elsewhere
 * in this codebase on `max_volume_eur` and is the reason this comment exists.
 */

// Six states, lowercase snake on the wire. Note the design's status badge reads "● Live", which is
// NOT one of these — see .project-management/output/docs/financing-design-extract.md §7. The badge
// maps from this set; it does not introduce a seventh value.
export const FinancingStatusSchema = z.enum([
  "calculating",
  "ready_for_setup",
  "disbursed",
  "active",
  "ended",
  "cancelled",
])
export type FinancingStatus = z.infer<typeof FinancingStatusSchema>

export const FinancingKindSchema = z.enum(["single", "package"])
export type FinancingKind = z.infer<typeof FinancingKindSchema>

export const ApprovalConditionStateSchema = z.enum([
  "open",
  "met",
  "waived",
  "expired",
])
export type ApprovalConditionState = z.infer<
  typeof ApprovalConditionStateSchema
>

export const ObjectRefSchema = z.object({
  object_id: z.string().uuid(),
  object_number: z.number().int(),
  object_group: z.string().nullable(),
  object_sub_group: z.string().nullable(),
})
export type ObjectRef = z.infer<typeof ObjectRefSchema>

export const FinancingContractRefSchema = z.object({
  contract_id: z.string().uuid(),
  short_name: z.string().nullable(),
  leasing_company_contract_number: z.string().nullable(),
  // Plain string, not an enum: the design's Contracts tab shows three contract types
  // (`Hire purchase` / `Finance lease` / `Operating lease`) while the spec has a two-value
  // either-or (`LEASE` / `HIRE_PURCHASE`) — an unreconciled conflict (design-extract §8). Parsing
  // as a string means whichever vocabulary the backend actually sends renders, rather than throwing.
  contract_type: z.string().nullable(),
  status: z.string(),
  financing_amount_share: z.string().nullable(),
  objects: z.array(ObjectRefSchema),
})
export type FinancingContractRef = z.infer<typeof FinancingContractRefSchema>

// An approval condition carried by the financing. `step_reference` is the checklist step that
// raised it, which is what makes a covenant traceable back to the request that imposed it.
export const CovenantRefSchema = z.object({
  id: z.string().uuid(),
  condition_text: z.string(),
  state: ApprovalConditionStateSchema,
  due_date: z.string(),
  step_reference: z.string().nullable(),
})
export type CovenantRef = z.infer<typeof CovenantRefSchema>

// The decision that produced this financing — AC-01's traceability, resolving a financing back to
// its originating request. The design's financing header shows no case reference at all
// (design-extract §8), so this is surfaced here even though the Figma frame omits it.
export const DecisionRefSchema = z.object({
  request_status: z.string().nullable(),
  decision_reason: z.string().nullable(),
  decided_by: z.string().uuid().nullable(),
  decided_at: z.string().nullable(),
})
export type DecisionRef = z.infer<typeof DecisionRefSchema>

export const FinancingHistoryEntrySchema = z.object({
  status: FinancingStatusSchema,
  changed_by: z.string().uuid().nullable(),
  changed_at: z.string().nullable(),
  by_system: z.boolean(),
  ended_reason: z.string().nullable(),
})
export type FinancingHistoryEntry = z.infer<typeof FinancingHistoryEntrySchema>

/**
 * GET /cases/{case_id}/financing/overview
 *
 * Every field is present in the response (all 26 are `required`), but most are nullable — a
 * financing exists from the moment the request is approved, long before its figures are computed.
 *
 * `figures_pending` and `bank_figures_visible` are the two gates that decide whether the figures
 * may be shown at all. Neither appears anywhere in the Figma frames, which show a fully-populated
 * screen only; a UI that ignores them would present a stale or unauthorised figure as final.
 */
export const FinancingOverviewResponseSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  financing_reference: z.string(),
  status: FinancingStatusSchema,
  kind: FinancingKindSchema,
  framework_agreement_id: z.string().uuid().nullable(),
  product_template_id: z.string().uuid().nullable(),
  lc_partner_id: z.string().uuid().nullable(),
  loan_number: z.string().nullable(),
  loan_account: z.string().nullable(),
  refinancing_rate: z.string().nullable(),
  effective_quota: z.string().nullable(),
  collateral_total: z.string().nullable(),
  contract_count: z.number().int(),
  object_count: z.number().int(),
  nominal_claim: z.string().nullable(),
  present_value: z.string().nullable(),
  financing_amount: z.string().nullable(),
  financing_quote_pct: z.string().nullable(),
  figures_pending: z.boolean(),
  bank_figures_visible: z.boolean(),
  contracts: z.array(FinancingContractRefSchema),
  originating_decision: DecisionRefSchema.nullable(),
  covenants: z.array(CovenantRefSchema),
  open_covenant_count: z.number().int(),
  financing_history: z.array(FinancingHistoryEntrySchema),
})
export type FinancingOverviewResponse = z.infer<
  typeof FinancingOverviewResponseSchema
>

/**
 * GET /cases/{case_id}/financing/remaining-balance
 *
 * This is the design's hero-band left half — "Outstanding balance (calculated as of today)". It is
 * a separate request because it is computed as of a date rather than stored, so `as_of` is part of
 * the answer and must be rendered with the figure: a balance without its date is not verifiable.
 */
export const FinancingRemainingBalanceResponseSchema = z.object({
  case_id: z.string().uuid(),
  as_of: z.string(),
  remaining_balance: z.string(),
})
export type FinancingRemainingBalanceResponse = z.infer<
  typeof FinancingRemainingBalanceResponseSchema
>
