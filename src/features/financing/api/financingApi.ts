import { api } from "@/lib/api"
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
