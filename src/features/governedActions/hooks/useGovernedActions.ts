import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { PaginatedGovernedActions } from "@/features/governedActions/api/schema"
import {
  fetchGovernedActions,
  GOVERNED_ACTIONS_QUERY_KEYS,
} from "@/features/governedActions/api/governedActionsApi"
import type { GovernedActionsQueryParams } from "@/features/governedActions/api/governedActionsApi"
import { ONE_MINUTE_MS, THIRTY_SECONDS_MS } from "@/lib/constants"

export function useGovernedActions(
  params: GovernedActionsQueryParams = {}
): UseQueryResult<PaginatedGovernedActions, Error> {
  return useQuery({
    queryKey: GOVERNED_ACTIONS_QUERY_KEYS.list(params),
    queryFn: () => fetchGovernedActions(params),
    staleTime: THIRTY_SECONDS_MS,
    // The rows render a relative "expires in …" label computed at render time, so on a
    // queue left open it drifted until something else forced a re-render. Polling refreshes
    // the countdown and the queue itself — the point of a four-eyes queue is to be current.
    refetchInterval: ONE_MINUTE_MS,
  })
}
