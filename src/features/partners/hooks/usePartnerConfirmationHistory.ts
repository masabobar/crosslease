import { useInfiniteQuery } from "@tanstack/react-query"
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query"
import type { ConfirmationHistoryResponse } from "@/features/partners/api/schema"
import {
  fetchConfirmationHistory,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"

export function usePartnerConfirmationHistory(
  partnerId: string,
  params?: { per_page?: number }
): UseInfiniteQueryResult<
  InfiniteData<ConfirmationHistoryResponse, string | null>,
  Error
> {
  return useInfiniteQuery({
    queryKey: [...PARTNERS_QUERY_KEYS.confirmationHistory(partnerId), params],
    queryFn: ({ pageParam }) =>
      fetchConfirmationHistory(partnerId, {
        ...params,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
  })
}
