import { useInfiniteQuery } from "@tanstack/react-query"
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query"
import type { FAAuditHistoryResponse } from "@/features/frameworkAgreements/api/schema"
import {
  fetchFrameworkAgreementAuditHistory,
  FRAMEWORK_AGREEMENTS_QUERY_KEYS,
} from "@/features/frameworkAgreements/api/frameworkAgreementsApi"
import type { FrameworkAgreementAuditHistoryParams } from "@/features/frameworkAgreements/api/frameworkAgreementsApi"

export function useFrameworkAgreementAuditHistory(
  id: string,
  params?: Omit<FrameworkAgreementAuditHistoryParams, "cursor">
): UseInfiniteQueryResult<
  InfiniteData<FAAuditHistoryResponse, string | null>,
  Error
> {
  return useInfiniteQuery({
    queryKey: FRAMEWORK_AGREEMENTS_QUERY_KEYS.auditHistory(id, params),
    queryFn: ({ pageParam }) =>
      fetchFrameworkAgreementAuditHistory(id, {
        ...params,
        cursor: pageParam ?? undefined,
      }),
    getNextPageParam: lastPage => lastPage.next_cursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!id,
  })
}
