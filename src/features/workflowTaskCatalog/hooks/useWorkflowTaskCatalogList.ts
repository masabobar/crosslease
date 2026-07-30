import { useQuery } from "@tanstack/react-query"
import {
  fetchWorkflowTaskCatalogs,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import type { WorkflowTaskCatalogListParams } from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import { MIN_SEARCH_LENGTH } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogListParams"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useWorkflowTaskCatalogList(
  params: WorkflowTaskCatalogListParams
) {
  const normalizedParams: WorkflowTaskCatalogListParams = {
    ...params,
    search:
      params.search && params.search.length >= MIN_SEARCH_LENGTH
        ? params.search
        : undefined,
  }

  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.list(normalizedParams),
    queryFn: () => fetchWorkflowTaskCatalogs(normalizedParams),
    staleTime: THIRTY_SECONDS_MS,
    placeholderData: prev => prev,
  })
}
