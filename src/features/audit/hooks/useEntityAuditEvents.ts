import { useQuery } from "@tanstack/react-query"
import {
  fetchEntityAuditEvents,
  AUDIT_QUERY_KEYS,
} from "@/features/audit/api/auditApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useEntityAuditEvents(
  entityType: string,
  entityId: string,
  page: number,
  perPage: number
) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.entityList(entityType, entityId, {
      page,
      per_page: perPage,
    }),
    queryFn: () =>
      fetchEntityAuditEvents(entityType, entityId, {
        page,
        per_page: perPage,
      }),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
