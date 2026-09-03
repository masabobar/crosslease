import { useQuery } from "@tanstack/react-query"
import {
  FINANCING_QUERY_KEYS,
  fetchFinancingRemainingBalance,
} from "@/features/financing/api/financingApi"
import type { FinancingRemainingBalanceResponse } from "@/features/financing/api/schema"

/**
 * The outstanding balance as of today — the hero band's left half.
 *
 * Separate from the overview because the backend computes it per request rather than storing it,
 * and it is only meaningful once the bank's figures are visible. `enabled` therefore takes the
 * gate from the overview: asking for a balance the caller may not see would answer 403 on every
 * render of the tab.
 */
export function useFinancingRemainingBalance(
  caseId: string | undefined,
  isEnabled: boolean
) {
  return useQuery<FinancingRemainingBalanceResponse>({
    queryKey: FINANCING_QUERY_KEYS.remainingBalance(caseId ?? ""),
    queryFn: () => fetchFinancingRemainingBalance(caseId as string),
    enabled: Boolean(caseId) && isEnabled,
    retry: false,
  })
}
