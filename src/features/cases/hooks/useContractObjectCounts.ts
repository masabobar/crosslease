import { useQueries } from "@tanstack/react-query"
import {
  CASE_QUERY_KEYS,
  fetchContractObjects,
} from "@/features/cases/api/casesApi"

/**
 * How many lease objects each contract carries, keyed by contract id.
 *
 * The dummy's contract table has an **Objects** column, and `ContractRead` does not carry a count —
 * the objects live behind `GET /contracts/{id}/objects`. So one request per contract is the only
 * way to fill that column, and this is where that cost is made visible rather than hidden inside a
 * row component that quietly fires a query each time it renders.
 *
 * It is bounded by the page size, not by the case: the caller passes the ids of the rows actually on
 * screen, so a case with 134 contracts costs a page's worth of requests, not 134. React Query dedupes
 * and caches them, so paging back is free.
 */
export function useContractObjectCounts(contractIds: string[]): {
  countsById: Map<string, number>
  isLoading: boolean
} {
  const uniqueIds = Array.from(new Set(contractIds))

  const results = useQueries({
    queries: uniqueIds.map(id => ({
      queryKey: CASE_QUERY_KEYS.contractObjects(id),
      queryFn: () => fetchContractObjects(id),
    })),
  })

  const countsById = new Map<string, number>()
  results.forEach((result, index) => {
    if (result.data)
      countsById.set(uniqueIds[index], result.data.objects.length)
  })

  return { countsById, isLoading: results.some(result => result.isLoading) }
}
