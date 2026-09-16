import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  FINANCING_LIST_QUERY_KEYS,
  fetchFinancings,
  type FinancingListParams,
} from "@/features/financing/api/financingListApi"
import type { FinancingListResponse } from "@/features/financing/api/financingListSchema"

export function useFinancings(
  params: FinancingListParams
): UseQueryResult<FinancingListResponse, Error> {
  return useQuery({
    queryKey: FINANCING_LIST_QUERY_KEYS.list(params),
    queryFn: () => fetchFinancings(params),
    // Paging must not blank the table between pages.
    placeholderData: previous => previous,
  })
}
