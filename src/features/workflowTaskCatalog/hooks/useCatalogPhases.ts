import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { CataloguePhase } from "@/features/workflowTaskCatalog/api/schema"
import {
  fetchCatalogPhases,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"

// PRD1042-1892 item 2 — a catalogue's own stages. Disabled until a version id exists: a catalogue
// with no current version has no stages to fetch, the same guard the task mutations use.
export function useCatalogPhases(
  catalogId: string | undefined,
  versionId: string | null
): UseQueryResult<CataloguePhase[], Error> {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.phases(
      catalogId ?? "",
      versionId ?? ""
    ),
    queryFn: () => fetchCatalogPhases(catalogId as string, versionId as string),
    enabled: Boolean(catalogId) && Boolean(versionId),
  })
}
