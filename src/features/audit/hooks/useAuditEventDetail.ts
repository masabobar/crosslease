import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  fetchAuditEvent,
  AUDIT_QUERY_KEYS,
} from "@/features/audit/api/auditApi"
import type { AuditEvent } from "@/features/audit/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useAuditEventDetail(
  eventId: string | null
): UseQueryResult<AuditEvent, Error> {
  return useQuery<AuditEvent>({
    queryKey: AUDIT_QUERY_KEYS.detail(eventId ?? ""),
    queryFn: () => fetchAuditEvent(eventId!),
    staleTime: THIRTY_SECONDS_MS,
    enabled: !!eventId,
  })
}
