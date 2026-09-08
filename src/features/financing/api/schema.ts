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

/**
 * Approval conditions on a financing — US 1.21.
 *
 * ── PLACEMENT IS SETTLED ───────────────────────────────────────────────────────────────────────
 * On the **financing**, not the case: the spec said so (§5.13, D-37), the contract agrees (these
 * hang off `/cases/{id}/financing/conditions`), and the client confirmed it on 2026-09-08 (Q-008).
 * The confirmed UI term is **Approval Conditions**; "Covenants" is retired (D-38), though the wire
 * keeps the old word.
 *
 * ── `all_settled` IS THE READINESS SIGNAL ──────────────────────────────────────────────────────
 * Epic 3 states that Conditions Management owns fulfilment evaluation and the financing merely
 * *consumes* the aggregated signal. `all_settled` is that signal. It is read, never recomputed from
 * the rows — recomputing it here would duplicate the ownership boundary the epic draws.
 */
export const ApprovalConditionResponseSchema = z.object({
  id: z.string().uuid(),
  financing_id: z.string().uuid(),
  condition_text: z.string(),
  due_date: z.string(),
  state: ApprovalConditionStateSchema,
  step_reference: z.string().nullable(),
  evidence_document_id: z.string().nullable(),
  set_by: z.string(),
  set_at: z.string(),
  settled_by: z.string().nullable(),
  settled_at: z.string().nullable(),
})
export type ApprovalConditionResponse = z.infer<
  typeof ApprovalConditionResponseSchema
>

export const ApprovalConditionListResponseSchema = z.object({
  conditions: z.array(ApprovalConditionResponseSchema),
  open_count: z.number().int(),
  // Read, not derived — see the note above.
  all_settled: z.boolean(),
})
export type ApprovalConditionListResponse = z.infer<
  typeof ApprovalConditionListResponseSchema
>

// ── US 1.15 — the refinancing rate, the quota and the derived figures ────────────────────────────

/**
 * The financing's calculation carrier: the three things a person enters, and the state the backend
 * keeps about them. Every money and rate value is a **decimal string** — the calculation
 * specification is explicit that amounts and rates are decimal strings on purpose and must not be
 * parsed into binary floats.
 *
 * `effective_quota` is the resolved quota (the framework agreement's, or the override where one was
 * set) and is read rather than recomputed from the other two. `settlement_ready` is likewise the
 * backend's own gate: US 1.15 R7 makes settlement readiness lifecycle logic, not a required-field
 * marker, so this flag is read and never derived from whether the rate looks filled in.
 */
export const FinancingReadSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  financing_reference: z.string(),
  framework_agreement_id: z.string().uuid().nullable(),
  product_template_id: z.string().uuid().nullable(),
  // Pinned so a historical calculation reproduces under the version it was made with.
  product_template_version: z.string().uuid().nullable(),
  kind: FinancingKindSchema,
  refinancing_rate: z.string().nullable(),
  refinancing_quota_override: z.string().nullable(),
  effective_quota: z.string().nullable(),
  value_date: z.string().nullable(),
  // Kept alongside `refinancing_rate` rather than overwriting it: the difference between the
  // committed rate and the rate at settlement is what documents the deviation.
  committed_rate: z.string().nullable(),
  committed_rate_expiry: z.string().nullable(),
  rate_lock_days: z.number().int().nullable(),
  settlement_ready: z.boolean(),
  // Unconstrained on the wire, so it is not modelled as an enum.
  calculation_state: z.string(),
  calculation_version: z.number().int(),
  loan_number: z.string().nullable(),
  loan_account: z.string().nullable(),
  status: FinancingStatusSchema,
  created_by: z.string().uuid(),
  created_at: z.string(),
})
export type FinancingRead = z.infer<typeof FinancingReadSchema>

/**
 * One contract's contribution to the package. `refinanced_instalments` is the count that is
 * actually financed — an instalment falling on the value date is not refinanced, so a contract
 * with 48 instalments commonly refinances 47.
 */
export const ContractContributionItemSchema = z.object({
  contract_id: z.string().uuid(),
  status: z.string(),
  financing_amount_share: z.string().nullable(),
  refinanced_instalments: z.number().int(),
})
export type ContractContributionItem = z.infer<
  typeof ContractContributionItemSchema
>

export const ContractContributionListResponseSchema = z.object({
  case_id: z.string().uuid(),
  contributions: z.array(ContractContributionItemSchema),
  contract_count: z.number().int(),
  contribution_sum: z.string().nullable(),
  // The backend's own "not computed yet" signal. US 1.15 requires that figures depending on the
  // rate are shown as pending rather than computed against an empty or assumed rate, and this is
  // the flag that says so — it is read, never inferred from a null amount.
  figures_pending: z.boolean(),
})
export type ContractContributionListResponse = z.infer<
  typeof ContractContributionListResponseSchema
>

/**
 * The per-contract calculated figures — the evidence of what was computed.
 *
 * `financed_residual` and `share_final_instalment` are the **two distinct final figures** US 1.15
 * R4 insists on keeping apart: the quota'd residual value carries no rounding difference, while the
 * schedule final instalment is the remaining balance plus the last period's interest and closes the
 * balance at zero. They differ by cents. Neither is computed from the other, and they are never
 * collapsed into one field named "final instalment".
 *
 * `calculated_as_of` is the date the share was calculated as of; `freeze_timestamp` is set when the
 * plan freezes at step 18.
 */
export const FinancingComponentResponseSchema = z.object({
  id: z.string().uuid(),
  contract_id: z.string().uuid(),
  status: z.string(),
  calculated_as_of: z.string().nullable(),
  freeze_timestamp: z.string().nullable(),
  financing_amount_share: z.string().nullable(),
  financed_residual: z.string().nullable(),
  share_running_instalment: z.string().nullable(),
  share_final_instalment: z.string().nullable(),
})
export type FinancingComponentResponse = z.infer<
  typeof FinancingComponentResponseSchema
>

export const FinancingComponentListResponseSchema = z.object({
  case_id: z.string().uuid(),
  components: z.array(FinancingComponentResponseSchema),
})
export type FinancingComponentListResponse = z.infer<
  typeof FinancingComponentListResponseSchema
>
