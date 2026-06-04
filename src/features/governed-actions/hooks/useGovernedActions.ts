import { useQuery } from "@tanstack/react-query"
import {
  fetchGovernedActions,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governed-actions/api/governedActionsApi"
import type { GovernedActionsQueryParams } from "@/features/governed-actions/api/governedActionsApi"

export function useGovernedActions(params: GovernedActionsQueryParams = {}) {
  return useQuery({
    queryKey: GOVERNED_ACTIONS_QUERY_KEYS.list(params),
    queryFn: () => fetchGovernedActions(params),
  })
}
