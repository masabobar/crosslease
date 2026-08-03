import { useQuery } from "@tanstack/react-query"
import {
  fetchGovernedActions,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governedActions/api/governedActionsApi"
import type { GovernedActionsQueryParams } from "@/features/governedActions/api/governedActionsApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useGovernedActions(params: GovernedActionsQueryParams = {}) {
  return useQuery({
    queryKey: GOVERNED_ACTIONS_QUERY_KEYS.list(params),
    queryFn: () => fetchGovernedActions(params),
    staleTime: THIRTY_SECONDS_MS,
  })
}
