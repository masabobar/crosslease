import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
import type { FieldRegistryItem } from "@/features/workflowTaskCatalog/api/schema"
import {
  fetchFieldRegistry,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"

// The registry is a platform-level list that changes only when the backend adds a testable field,
// so it is cached for the session — the same reasoning as useCatalogCaseTypes.
const ONE_HOUR_MS = 60 * 60 * 1000

// `isEnabled` is passed rather than assumed: only a task that actually carries condition rows
// needs the registry, and a view panel for a task without any must not fire the request.
export function useFieldRegistry(
  isEnabled: boolean
): UseQueryResult<FieldRegistryItem[], Error> {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.fieldRegistry(),
    queryFn: fetchFieldRegistry,
    staleTime: ONE_HOUR_MS,
    enabled: isEnabled,
  })
}
