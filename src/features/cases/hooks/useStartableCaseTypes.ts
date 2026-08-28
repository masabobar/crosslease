import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchStartableCaseTypes,
} from "@/features/cases/api/casesApi"
import { FIVE_MINUTES_MS } from "@/lib/constants"

// The case types the caller's bank has requirements for — used by the Start-case / Raise-proposal
// dialogs to disable case types that cannot be started (PRD1042-1794). Cached a few minutes: the
// bank's catalogue changes rarely relative to how often a dialog opens.
export function useStartableCaseTypes(): UseQueryResult<string[], Error> {
  return useQuery({
    queryKey: CASE_QUERY_KEYS.startableCaseTypes,
    queryFn: fetchStartableCaseTypes,
    staleTime: FIVE_MINUTES_MS,
  })
}
