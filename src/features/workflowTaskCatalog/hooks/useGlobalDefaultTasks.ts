import { useQuery } from "@tanstack/react-query"
import {
  fetchWorkflowTaskCatalogDetail,
  fetchWorkflowTaskCatalogs,
  WORKFLOW_TASK_CATALOG_QUERY_KEYS,
} from "@/features/workflowTaskCatalog/api/workflowTaskCatalogApi"
import {
  CatalogLayerSchema,
  CatalogStateSchema,
  LayerActionSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  CatalogEntityType,
  TaskDefinitionItem,
} from "@/features/workflowTaskCatalog/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

/**
 * The Global Default tasks an Override or Deactivate entry can point its parent_task_id at.
 *
 * **No endpoint enumerates them.** There is no `/versions` collection and no "global default
 * tasks" route, so this composes two calls: find the Global Default catalogue for this entity
 * type via the list filter, then read its detail and keep the `defined` rows. US 15.1 assumes a
 * single active Global Default per Tenant × Entity Type, so the first match is the only match.
 *
 * Returns an empty array — not an error — when no Global Default exists. That state is reachable
 * and expected: the BE itself warns about it when a product-specific catalogue is created first,
 * and the caller turns it into "Override/Deactivate unavailable" rather than a failure.
 */
export function useGlobalDefaultTasks(entityType: CatalogEntityType | null) {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.globalDefaultTasks(entityType),
    queryFn: async (): Promise<TaskDefinitionItem[]> => {
      const list = await fetchWorkflowTaskCatalogs({
        catalog_layer: [CatalogLayerSchema.enum.global_default],
        entity_type: [entityType as CatalogEntityType],
        catalog_state: [CatalogStateSchema.enum.active],
        per_page: 1,
      })

      const globalDefault = list.items[0]
      if (!globalDefault) return []

      const detail = await fetchWorkflowTaskCatalogDetail(globalDefault.id)
      return detail.tasks.filter(
        task => task.layer_action === LayerActionSchema.enum.defined
      )
    },
    enabled: !!entityType,
    staleTime: THIRTY_SECONDS_MS,
  })
}
