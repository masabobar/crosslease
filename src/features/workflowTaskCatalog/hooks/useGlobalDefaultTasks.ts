import { useQuery } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query"
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
  CaseType,
  TaskDefinitionItem,
} from "@/features/workflowTaskCatalog/api/schema"
import { THIRTY_SECONDS_MS } from "@/lib/constants"

/**
 * The Global Default tasks an Override or Deactivate entry can point its parent_task_id at.
 *
 * **No endpoint enumerates them.** There is no `/versions` collection and no "global default
 * tasks" route, so this composes two calls: find the Global Default catalogue for this CASE TYPE
 * via the list filter, then read its detail and keep the `defined` rows. US 15.1 assumes a single
 * active Global Default per Tenant × Case Type, so the first match is the only match.
 *
 * **PRD1042-2145 — this looked the catalogue up by `entity_type` and could not find it.**
 * PRD1042-1917 stopped deriving entity_type from the case type (`resolved_entity_type = None`), so
 * every catalogue created since carries NULL and an `entity_type=` filter matches nothing — the
 * parent picker reported "no global default exists" however many tasks the Global Default had.
 * Legacy rows still carry a value, which is why it appeared to work on older data. Case type is
 * also the correct axis on its own terms: `package_redemption` and `single_redemption` both map to
 * the `redemption_request` entity type, so matching on it could resolve the WRONG catalogue.
 *
 * Returns an empty array — not an error — when no Global Default exists. That state is reachable
 * and expected: the BE itself warns about it when a product-specific catalogue is created first,
 * and the caller turns it into "Override/Deactivate unavailable" rather than a failure.
 */
export function useGlobalDefaultTasks(
  caseType: CaseType | null
): UseQueryResult<TaskDefinitionItem[], Error> {
  return useQuery({
    queryKey: WORKFLOW_TASK_CATALOG_QUERY_KEYS.globalDefaultTasks(caseType),
    queryFn: async (): Promise<TaskDefinitionItem[]> => {
      const list = await fetchWorkflowTaskCatalogs({
        catalog_layer: [CatalogLayerSchema.enum.global_default],
        case_type: [caseType as CaseType],
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
    enabled: !!caseType,
    staleTime: THIRTY_SECONDS_MS,
  })
}
