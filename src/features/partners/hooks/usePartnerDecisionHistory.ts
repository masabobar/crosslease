import { useInfiniteQuery } from "@tanstack/react-query"
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query"
import type { DecisionHistoryResponse } from "@/features/partners/api/schema"
import {
  fetchDecisionHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerDecisionHistory(
  partnerId: string,
  params?: { per_page?: number }
): UseInfiniteQueryResult<
  InfiniteData<DecisionHistoryResponse, string | null>,
  Error
> {
  return useInfiniteQuery({
    queryKey: [...PARTNERS_QUERY_KEYS.decisionHistory(partnerId), params],
    queryFn: ({ pageParam }) =>
      fetchDecisionHistory(partnerId, {
        ...params,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
  })
}
