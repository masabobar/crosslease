import { api } from "@/lib/api"
import {
  ContractContributionListResponseSchema,
  FinancingComponentListResponseSchema,
  FinancingReadSchema,
} from "@/features/financing/api/schema"
import type {
  ContractContributionListResponse,
  FinancingComponentListResponse,
  FinancingRead,
} from "@/features/financing/api/schema"
import { GovernedActionSchema } from "@/features/governedActions/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import {
  ApprovalConditionListResponseSchema,
  ApprovalConditionResponseSchema,
  FinancingOverviewResponseSchema,
  FinancingRemainingBalanceResponseSchema,
} from "@/features/financing/api/schema"
import type {
  ApprovalConditionListResponse,
  ApprovalConditionResponse,
  FinancingOverviewResponse,
  FinancingRemainingBalanceResponse,
} from "@/features/financing/api/schema"

// Keyed by case id, not by financing id: the backend exposes a financing only under its case
// (see schema.ts), so the case is the only identifier a caller ever has.
export const FINANCING_QUERY_KEYS = {
  overview: (caseId: string) => ["financing", "overview", caseId] as const,
  remainingBalance: (caseId: string) =>
    ["financing", "remaining-balance", caseId] as const,
}

export async function fetchFinancingOverview(
  caseId: string
): Promise<FinancingOverviewResponse> {
  const data = await api.get(`/cases/${caseId}/financing/overview`)
  return FinancingOverviewResponseSchema.parse(data)
}

export async function fetchFinancingRemainingBalance(
  caseId: string
): Promise<FinancingRemainingBalanceResponse> {
  const data = await api.get(`/cases/${caseId}/financing/remaining-balance`)
  return FinancingRemainingBalanceResponseSchema.parse(data)
}

// ── Approval conditions (US 1.21) ────────────────────────────────────────────
export const FINANCING_CONDITION_KEYS = {
  list: (caseId: string) => ["financing", "conditions", caseId] as const,
}

export async function fetchApprovalConditions(
  caseId: string
): Promise<ApprovalConditionListResponse> {
  const data = await api.get(`/cases/${caseId}/financing/conditions`)
  return ApprovalConditionListResponseSchema.parse(data)
}

export async function addApprovalCondition(
  caseId: string,
  body: {
    condition_text: string
    due_date: string
    step_reference: string | null
  }
): Promise<ApprovalConditionResponse> {
  const data = await api.post(`/cases/${caseId}/financing/conditions`, body)
  return ApprovalConditionResponseSchema.parse(data)
}

// Settling is immediate — the condition was met and the record says so.
export async function settleApprovalCondition(
  caseId: string,
  conditionId: string
): Promise<ApprovalConditionResponse> {
  const data = await api.post(
    `/cases/${caseId}/financing/conditions/${conditionId}/settle`
  )
  return ApprovalConditionResponseSchema.parse(data)
}

/**
 * Waiving is NOT immediate — it returns a **governed action**.
 *
 * The endpoint answers `GovernedActionResponse`, not a condition: a waiver needs a second pair of
 * eyes before it takes effect, which is what the spec means by "condition waivers must require
 * elevated approval and audit logging". So the caller must not show the condition as waived; it
 * shows that an approval has been requested, and the action appears in Pending approvals.
 *
 * `waiver_expiry` is required — a waiver is time-boxed, never open-ended.
 */
export async function requestConditionWaiver(
  caseId: string,
  conditionId: string,
  body: { reason: string; waiver_expiry: string }
): Promise<GovernedAction> {
  // Answers with the governed action, not the condition — the waiver is requested here and
  // applied only once a second approver clears it.
  return GovernedActionSchema.parse(
    await api.post(
      `/cases/${caseId}/financing/conditions/${conditionId}/waive`,
      body
    )
  )
}

// ── US 1.15 — the Calculation area ───────────────────────────────────────────────────────────────

export const FINANCING_CALCULATION_KEYS = {
  financing: (caseId: string) => ["financing", caseId, "record"] as const,
  components: (caseId: string) => ["financing", caseId, "components"] as const,
  contributions: (caseId: string) =>
    ["financing", caseId, "contributions"] as const,
}

export async function fetchFinancing(caseId: string): Promise<FinancingRead> {
  return FinancingReadSchema.parse(await api.get(`/cases/${caseId}/financing`))
}

export async function fetchFinancingComponents(
  caseId: string
): Promise<FinancingComponentListResponse> {
  return FinancingComponentListResponseSchema.parse(
    await api.get(`/cases/${caseId}/financing/components`)
  )
}

export async function fetchContractContributions(
  caseId: string
): Promise<ContractContributionListResponse> {
  return ContractContributionListResponseSchema.parse(
    await api.get(`/cases/${caseId}/financing/per-contract`)
  )
}

/**
 * The rate goes to the wire as the **decimal string the user typed**, not as a parsed number.
 * The endpoint accepts either, and sending the string is what keeps the third decimal exactly as
 * entered — a difference there produces a different repayment schedule.
 */
export async function setRefinancingRate(
  caseId: string,
  rate: string
): Promise<FinancingRead> {
  return FinancingReadSchema.parse(
    await api.put(`/cases/${caseId}/financing/rate`, { rate })
  )
}

/** `quota` is the wire's fraction (0–1), not the percentage shown on screen. */
export async function overrideQuota(
  caseId: string,
  quota: string
): Promise<FinancingRead> {
  return FinancingReadSchema.parse(
    await api.put(`/cases/${caseId}/financing/quota`, { quota })
  )
}

export async function setValueDate(
  caseId: string,
  valueDate: string
): Promise<FinancingRead> {
  return FinancingReadSchema.parse(
    await api.put(`/cases/${caseId}/financing/value-date`, {
      value_date: valueDate,
    })
  )
}

export async function recalculateFinancing(
  caseId: string
): Promise<FinancingRead> {
  return FinancingReadSchema.parse(
    await api.post(`/cases/${caseId}/financing/recalculate`, {})
  )
}

/** Freezes the committed rate and its expiry — the first of the three freeze points (step 4). */
export async function commitRate(
  caseId: string,
  lockDays: number
): Promise<FinancingRead> {
  return FinancingReadSchema.parse(
    await api.post(`/cases/${caseId}/financing/commit-rate`, {
      lock_days: lockDays,
    })
  )
}
