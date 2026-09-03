import { api } from "@/lib/api"
import {
  FinancingOverviewResponseSchema,
  FinancingRemainingBalanceResponseSchema,
} from "@/features/financing/api/schema"
import type {
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
