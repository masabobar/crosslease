import { useQuery } from "@tanstack/react-query"
import {
  fetchWorkflowTaskCatalogDetail,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

export function useWorkflowTaskCatalogDetail(catalogId: string | undefined) {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.detail(catalogId ?? ""),
    queryFn: () => fetchWorkflowTaskCatalogDetail(catalogId as string),
    enabled: !!catalogId,
    staleTime: THIRTY_SECONDS_MS,
  })
}
