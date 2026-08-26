import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CatalogCaseTypeItem } from "@/features/workflowTaskCatalog/api/schema"
import {
  fetchCatalogCaseTypes,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"

// PRD1042-1790 item 1 — the case types a catalogue may be scoped to. The set changes only when the
// bank assigns a catalogue to a further case type, which is a backend change (and later a
// configuration one), so this is cached for the session rather than refetched per dialog open.
const ONE_HOUR_MS = 60 * 60 * 1000

export function useCatalogCaseTypes(): UseQueryResult<
  CatalogCaseTypeItem[],
  Error
> {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.caseTypes(),
    queryFn: fetchCatalogCaseTypes,
    staleTime: ONE_HOUR_MS,
  })
}
