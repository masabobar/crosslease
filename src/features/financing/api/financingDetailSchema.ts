import { z } from "zod"
import {
  FinancingKindSchema,
  FinancingStatusSchema,
} from "@/features/financing/api/financingListSchema"

/**
 * The financing workspace — `GET /financings/{id}`.
 *
 * This route landed on 12 Oct and changed the shape of the screen: until then every financing
 * figure hung off `/cases/{case_id}/financing/…`, so the case was the financing's only address.
 * The financing now has its own, and the detail is denormalised — `case_reference`,
 * `lc_partner_name`, `framework_agreement_name` and `product_template_name` arrive with it, so
 * the header no longer resolves four names through four separate lookups.
 *
 * Every money figure is a **decimal string**. Coercing a nullable decimal turns `null` into a
 * convincing `0`, which on this screen would read as "nothing outstanding" rather than "not
 * recorded".
 */

export const RepaymentRowSchema = z.object({
  due_date: z.string().nullable(),
  payment: z.string(),
  principal: z.string(),
  interest: z.string(),
  closing_balance: z.string(),
  // "payout" / "redemption" / null for an ordinary instalment. Free text on the wire, so the row
  // label falls back to the raw value rather than to a blank cell.
  kind: z.string().nullable(),
  // The backend decides which row is today's position. Deriving it here from the dates would be a
  // second answer that can disagree with the one the schedule was built from.
  is_current: z.boolean(),
  is_future: z.boolean(),
})
export type RepaymentRow = z.infer<typeof RepaymentRowSchema>

export const RepaymentSchema = z.object({
  rows: z.array(RepaymentRowSchema),
  instalment: z.string().nullable(),
  instalments_due: z.number().int(),
  instalment_count: z.number().int(),
  repayment_start: z.string().nullable(),
  final_instalment: z.string().nullable(),
  residual: z.string().nullable(),
  maturity: z.string().nullable(),
  total_interest: z.string(),
  outstanding: z.string().nullable(),
  // A redemption rewrites the tail of the plan, so the schedule says when it is no longer the
  // original one.
  adjusted_for_redemptions: z.boolean(),
  early_redemption_case_id: z.string().nullable(),
})
export type Repayment = z.infer<typeof RepaymentSchema>

export const FinancingBalanceSchema = z.object({
  outstanding: z.string().nullable(),
  as_of: z.string(),
  payout: z.string().nullable(),
  approved_loan_amount: z.string().nullable(),
  // Provisional while the calculation has not settled. A figure read as final when it is still
  // moving is the one mistake this screen can cause, so the flag is rendered, never inferred.
  provisional: z.boolean(),
})
export type FinancingBalance = z.infer<typeof FinancingBalanceSchema>

// The tab counts come with the record, so the tab bar never fires four extra requests to label
// itself — and a count can never disagree with the tab it sits on.
export const FinancingTabCountsSchema = z.object({
  contracts: z.number().int(),
  collaterals: z.number().int(),
  covenants: z.number().int(),
  redemptions: z.number().int(),
})
export type FinancingTabCounts = z.infer<typeof FinancingTabCountsSchema>

export const ContractShareSchema = z.object({
  contract_id: z.string(),
  amount: z.string(),
  percent: z.string(),
})
export type ContractShare = z.infer<typeof ContractShareSchema>

export const FinancingEndedReasonSchema = z.enum([
  "term_ran_out",
  "terminated",
  "redeemed_early",
])

export const FinancingDetailSchema = z.object({
  id: z.string().uuid(),
  case_id: z.string().uuid(),
  financing_reference: z.string(),
  framework_agreement_id: z.string().nullable(),
  product_template_id: z.string().nullable(),
  product_template_version: z.string().nullable(),
  kind: FinancingKindSchema,

  refinancing_rate: z.string().nullable(),
  refinancing_quota_override: z.string().nullable(),
  effective_quota: z.string().nullable(),
  value_date: z.string().nullable(),
  first_instalment_date: z.string().nullable(),
  instalment_day: z.number().int().nullable(),
  default_instalment_day: z.number().int().optional(),
  rate_quoted_on: z.string().nullable(),
  agreed_loan_amount: z.string().nullable(),
  committed_rate: z.string().nullable(),
  committed_rate_expiry: z.string().nullable(),
  rate_lock_days: z.number().int().nullable(),

  settlement_ready: z.boolean(),
  calculation_state: z.string(),
  calculation_version: z.number().int(),
  calculated_at: z.string().nullable().optional(),

  // The OS+ pair. It comes back once the loan is set up there, which is why the record carries a
  // flag saying whether it may be edited rather than the UI deriving that from the status.
  loan_number: z.string().nullable(),
  loan_account: z.string().nullable(),
  loan_values_editable: z.boolean(),

  status: FinancingStatusSchema,
  ended_reason: FinancingEndedReasonSchema.nullable().optional(),
  created_by: z.string(),
  created_at: z.string(),

  // Denormalised onto the detail, so the header needs no second lookup for any of them.
  case_reference: z.string(),
  lc_partner_id: z.string().nullable(),
  lc_partner_name: z.string().nullable(),
  framework_agreement_name: z.string().nullable(),
  product_template_name: z.string().nullable(),
  product_template_version_number: z.string().nullable().optional(),

  // Pre-financing, maintained by hand: nothing computes these and nothing gates on them.
  soll_amount: z.string().nullable(),
  soll_date: z.string().nullable(),
  haben_amount: z.string().nullable(),
  haben_date: z.string().nullable(),

  // The optimistic-lock token. Every write of a maintained value sends it back, so two people
  // editing the same financing cannot silently overwrite each other.
  updated_at: z.string(),

  counts: FinancingTabCountsSchema,
  balance: FinancingBalanceSchema,
  repayment: RepaymentSchema.nullable(),
  contract_shares: z.array(ContractShareSchema).default([]),
})
export type FinancingDetail = z.infer<typeof FinancingDetailSchema>

/* ── COLLATERAL ─────────────────────────────────────────────────────────────────────────────── */

export const CollateralTypeSchema = z.enum([
  "chattel_mortgage",
  "assignment_of_receivables",
  "guarantee",
])

// `needs_recheck` is raised by the events that change what the collateral is worth — a partial
// redemption, a package falling to one contract. It cannot be dismissed; only an approved
// re-determination clears it.
export const CollateralRecheckStateSchema = z.enum(["clear", "needs_recheck"])

// Why the signed-in user may not confirm a proposed total. The backend decides it, because the
// rule depends on who resolved a checklist step — which the UI cannot see.
export const CollateralDecisionBlockSchema = z.enum([
  "not_back_office",
  "proposer",
  "step_35_resolver",
])

export const CollateralEvidenceSchema = z.object({
  document_id: z.string(),
  file_name: z.string().nullable(),
  size: z.number().int().nullable(),
  uploaded_at_utc: z.string(),
  uploaded_at_local: z.string(),
})
export type CollateralEvidence = z.infer<typeof CollateralEvidenceSchema>

export const CollateralValueSchema = z.object({
  total_eur: z.string(),
  set_by: z.string(),
  set_by_name: z.string().nullable(),
  set_at: z.string(),
})
export type CollateralValue = z.infer<typeof CollateralValueSchema>

/**
 * The financing's collateral total — `GET /financings/{id}/collateral`.
 *
 * One figure for the whole financing, never one per object. Re-determining a recorded total is a
 * **proposal** until a second Back Office person confirms it, and the proposer can never be that
 * person — which is why `decision_block` arrives from the backend rather than being worked out
 * here from the signed-in user.
 */
export const FinancingCollateralSchema = z.object({
  id: z.string(),
  financing_id: z.string(),
  collateral_type: CollateralTypeSchema.nullable(),
  current_total_eur: z.string().nullable(),
  // Set while a re-determination is waiting for its second pair of eyes.
  proposed_total_eur: z.string().nullable(),
  evidence: z.array(CollateralEvidenceSchema).default([]),
  recheck_state: CollateralRecheckStateSchema,
  redetermined_by: z.string().nullable(),
  redetermined_by_name: z.string().nullable(),
  redetermined_at: z.string().nullable(),
  confirmed_by: z.string().nullable(),
  confirmed_by_name: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  decision_block: CollateralDecisionBlockSchema.nullable(),
  value_history: z.array(CollateralValueSchema).default([]),
})
export type FinancingCollateral = z.infer<typeof FinancingCollateralSchema>

/* ── SECURITIES ─────────────────────────────────────────────────────────────────────────────── */

/**
 * The securities held against the financing's contracts — `GET /financings/{id}/securities`.
 *
 * A security is held against a CONTRACT, never against the loan, so the contract it belongs to is
 * a column of its own rather than a footnote. An empty value means **not recorded** — not
 * "unlimited".
 */
export const FinancingSecuritySchema = z.object({
  collateral_id: z.string(),
  collateral_type: z.string(),
  value: z.string().nullable(),
  guarantor_partner_id: z.string().nullable(),
  guarantor_display_name: z.string().nullable(),
  evidence_document_id: z.string().nullable(),
  evidence_document_name: z.string().nullable(),
  evidence_document_date: z.string().nullable(),
  kind_of_obligation: z.string().nullable(),
  contract_id: z.string(),
  contract_number: z.string().nullable(),
})
export type FinancingSecurity = z.infer<typeof FinancingSecuritySchema>

export const FinancingSecuritiesResponseSchema = z.object({
  financing_id: z.string(),
  items: z.array(FinancingSecuritySchema),
})
export type FinancingSecuritiesResponse = z.infer<
  typeof FinancingSecuritiesResponseSchema
>
