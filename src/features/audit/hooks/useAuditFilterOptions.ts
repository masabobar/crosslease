import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  fetchAuditFilterOptions,
  AUDIT_QUERY_KEYS,
} from "@/features/audit/api/auditApi"
import type { AuditFilterOptions } from "@/features/audit/api/schema"
import { FIVE_MINUTES_MS } from "@/lib/constants"

export function useAuditFilterOptions(): UseQueryResult<
  AuditFilterOptions,
  Error
> {
  return useQuery<AuditFilterOptions>({
    queryKey: AUDIT_QUERY_KEYS.filterOptions(),
    queryFn: fetchAuditFilterOptions,
    staleTime: FIVE_MINUTES_MS,
  })
}
