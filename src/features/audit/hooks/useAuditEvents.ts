import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PaginatedAuditEvents } from "@/features/audit/api/schema"
import {
  fetchAuditEvents,
  AUDIT_QUERY_KEYS,
} from "@/features/audit/api/auditApi"
import type { AuditQueryParams } from "@/features/audit/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useAuditEvents(
  params: AuditQueryParams = {}
): UseQueryResult<PaginatedAuditEvents, Error> {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.list(params),
    queryFn: () => fetchAuditEvents(params),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
