import { api } from "@/lib/api"
import {
  CatalogListResponseSchema,
  CatalogResponseSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  CatalogEntityType,
  CatalogLayer,
  CatalogListResponse,
  CatalogResponse,
  CatalogState,
  CreateCatalogRequest,
} from "@/features/workflowTaskCatalog/api/schema"

// The array filters go over the wire as repeated params (?catalog_layer=a&catalog_layer=b) —
// see the paramsSerializer in @/lib/api.
export type WorkflowTaskCatalogListParams = {
  search?: string
  catalog_layer?: CatalogLayer[]
  entity_type?: CatalogEntityType[]
  // Product Template UUIDs. The BE maps this straight onto the catalog's entity_id
  // (routes/catalogs.py), which is where a product-specific catalog stores its template.
  product_template_id?: string[]
  catalog_state?: CatalogState[]
  page?: number
  per_page?: number
}

export const WORKFLOW_TASK_CATALOG_QUERY_KEYS = {
  // Prefix shared by every key below — the invalidation target for create. It cannot
  // rebuild the `list` key (that carries the caller's filter params), so it invalidates the
  // whole feature rather than leaving a list screen without the row just created.
  all: ["workflow-task-catalogs"] as const,
  list: (params?: WorkflowTaskCatalogListParams) =>
    ["workflow-task-catalogs", "list", params] as const,
} as const

export async function fetchWorkflowTaskCatalogs(
  params?: WorkflowTaskCatalogListParams
): Promise<CatalogListResponse> {
  const data = await api.get("/workflow-task-catalogs", { params })
  return CatalogListResponseSchema.parse(data)
}

export async function createWorkflowTaskCatalog(
  body: CreateCatalogRequest
): Promise<CatalogResponse> {
  const data = await api.post("/workflow-task-catalogs", body)
  return CatalogResponseSchema.parse(data)
}
