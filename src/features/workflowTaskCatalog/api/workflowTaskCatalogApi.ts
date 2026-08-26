import { api } from "@/lib/api"
import { toUpdateTaskBody } from "@/features/workflowTaskCatalog/utils"
import {
  AuditTrailResponseSchema,
  CatalogDetailResponseSchema,
  CatalogListResponseSchema,
  CatalogResponseSchema,
  CatalogCaseTypeListSchema,
  CataloguePhaseListSchema,
  CataloguePhaseSchema,
  RemovePhaseResponseSchema,
  TaskResponseWithWarningsSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type {
  AddTaskRequest,
  AuditTrailResponse,
  CatalogDetailResponse,
  CatalogEntityType,
  CatalogLayer,
  CatalogListResponse,
  CatalogResponse,
  CatalogCaseTypeItem,
  CatalogState,
  CataloguePhase,
  CreateCatalogRequest,
  CreatePhaseRequest,
  RemovePhaseResponse,
  ReorderPhasesRequest,
  TaskResponseWithWarnings,
  UpdatePhaseRequest,
  UpdateTaskRequest,
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

export type AuditTrailParams = {
  cursor?: string
  // Server caps this at 50.
  per_page?: number
}

export const WORKFLOW_TASK_CATALOG_QUERY_KEYS = {
  // Prefix shared by every key below — the invalidation target for create and for the three
  // task mutations. They cannot rebuild the `list` key (it carries the caller's filter params)
  // or know which detail is cached, so they invalidate the whole feature instead of leaving a
  // screen showing a task set that no longer matches the server.
  all: ["workflow-task-catalogs"] as const,
  list: (params?: WorkflowTaskCatalogListParams) =>
    ["workflow-task-catalogs", "list", params] as const,
  detail: (catalogId: string) =>
    ["workflow-task-catalogs", "detail", catalogId] as const,
  auditTrail: (catalogId: string) =>
    ["workflow-task-catalogs", "audit-trail", catalogId] as const,
  // Keyed by entity type, not catalogue: the Global Default set is shared by every
  // product-specific catalogue of that entity type, so they can share the cache entry.
  globalDefaultTasks: (entityType: CatalogEntityType | null) =>
    ["workflow-task-catalogs", "global-default-tasks", entityType] as const,
  // Keyed by version, not catalogue: a phase belongs to a catalogue version and every phase
  // endpoint is scoped to one.
  phases: (catalogId: string, versionId: string) =>
    ["workflow-task-catalogs", "phases", catalogId, versionId] as const,
  // Tenant-independent within a session and effectively static, so one key with no params.
  caseTypes: () => ["workflow-task-catalogs", "case-types"] as const,
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

export async function fetchWorkflowTaskCatalogDetail(
  catalogId: string
): Promise<CatalogDetailResponse> {
  const data = await api.get(`/workflow-task-catalogs/${catalogId}`)
  return CatalogDetailResponseSchema.parse(data)
}

export async function fetchWorkflowTaskCatalogAuditTrail(
  catalogId: string,
  params?: AuditTrailParams
): Promise<AuditTrailResponse> {
  const data = await api.get(
    `/workflow-task-catalogs/${catalogId}/audit-trail`,
    { params }
  )
  return AuditTrailResponseSchema.parse(data)
}

// The three task mutations all hang off the catalogue's current_version_id, which is only
// obtainable from the detail response — there is no versions endpoint to look it up.
export async function addCatalogTask(
  catalogId: string,
  versionId: string,
  body: AddTaskRequest
): Promise<TaskResponseWithWarnings> {
  const data = await api.post(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/tasks`,
    body
  )
  return TaskResponseWithWarningsSchema.parse(data)
}

export async function updateCatalogTask(
  catalogId: string,
  versionId: string,
  taskId: string,
  body: UpdateTaskRequest
): Promise<TaskResponseWithWarnings> {
  // Strip the immutable fields the caller's shared payload still carries — see toUpdateTaskBody.
  const data = await api.patch(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/tasks/${taskId}`,
    toUpdateTaskBody(body)
  )
  return TaskResponseWithWarningsSchema.parse(data)
}

// 204 No Content — nothing to parse.
export async function removeCatalogTask(
  catalogId: string,
  versionId: string,
  taskId: string
): Promise<void> {
  await api.delete(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/tasks/${taskId}`
  )
}

// PRD1042-1892 item 2 — the catalogue's own stages. All five endpoints are version-scoped, so
// they take the same (catalogId, versionId) pair the task mutations do.
export async function fetchCatalogPhases(
  catalogId: string,
  versionId: string
): Promise<CataloguePhase[]> {
  const data = await api.get(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/phases`
  )
  return CataloguePhaseListSchema.parse(data)
}

export async function addCatalogPhase(
  catalogId: string,
  versionId: string,
  body: CreatePhaseRequest
): Promise<CataloguePhase> {
  const data = await api.post(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/phases`,
    body
  )
  return CataloguePhaseSchema.parse(data)
}

export async function updateCatalogPhase(
  catalogId: string,
  versionId: string,
  phaseId: string,
  body: UpdatePhaseRequest
): Promise<CataloguePhase> {
  const data = await api.patch(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/phases/${phaseId}`,
    body
  )
  return CataloguePhaseSchema.parse(data)
}

// Reorder is a POST rather than a PATCH per phase: the BE takes the full permutation so the
// positions stay contiguous, which per-phase updates could not guarantee mid-sequence.
export async function reorderCatalogPhases(
  catalogId: string,
  versionId: string,
  body: ReorderPhasesRequest
): Promise<CataloguePhase[]> {
  const data = await api.post(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/phases/reorder`,
    body
  )
  return CataloguePhaseListSchema.parse(data)
}

// Returns `removed: false` with a task count when the stage still holds tasks — the caller must
// re-request with confirm=true, which is why this is not a plain 204 delete.
export async function removeCatalogPhase(
  catalogId: string,
  versionId: string,
  phaseId: string,
  confirm: boolean
): Promise<RemovePhaseResponse> {
  const data = await api.delete(
    `/workflow-task-catalogs/${catalogId}/versions/${versionId}/phases/${phaseId}`,
    { params: { confirm } }
  )
  return RemovePhaseResponseSchema.parse(data)
}

// PRD1042-1790 item 1 — the case types a catalogue may be scoped to. The create dialog offers
// exactly this, so the axis widens without a frontend release (AC-74/AC-94).
export async function fetchCatalogCaseTypes(): Promise<CatalogCaseTypeItem[]> {
  const data = await api.get("/workflow-task-catalogs/case-types")
  return CatalogCaseTypeListSchema.parse(data)
}
