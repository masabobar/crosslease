import { api } from "@/lib/api"
import {
  AddRequirementRequestSchema,
  CreateDocumentRequirementCatalogRequestSchema,
  DocumentRequirementCatalogDetailResponseSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentTypeListResponseSchema,
  MaterializationResponseSchema,
  RequirementResponseSchema,
  UpdateDocumentRequirementCatalogRequestSchema,
  UpdateRequirementRequestSchema,
} from "@/features/documentRequirements/api/schema"
import type {
  DocumentTypeListResponse,
  AddRequirementRequest,
  CreateDocumentRequirementCatalogRequest,
  DocumentRequirementCatalogDetailResponse,
  DocumentRequirementCatalogListResponse,
  DocumentRequirementCatalogResponse,
  DocumentRequirementCatalogType,
  DocumentRequirementListResponse,
  MaterializationResponse,
  RequirementResponse,
  UpdateDocumentRequirementCatalogRequest,
  UpdateRequirementRequest,
} from "@/features/documentRequirements/api/schema"

export type DocumentRequirementCatalogListParams = {
  search?: string
  catalog_type?: DocumentRequirementCatalogType
  process_context?: string
  page?: number
  per_page?: number
}

export const DOCUMENT_REQUIREMENT_QUERY_KEYS = {
  all: ["document-requirements"] as const,
  tenantCatalogs: (tenantId: string) =>
    ["document-requirements", "catalogs", tenantId] as const,
  list: (tenantId: string, params?: DocumentRequirementCatalogListParams) =>
    ["document-requirements", "catalogs", "list", tenantId, params] as const,
  // Keyed by tenant, not by catalogue: the consumer needs the tenant's whole active set, which is
  // the scope the BE validates a task's doc_requirement_ref against.
  tenantRequirements: (tenantId: string) =>
    ["document-requirements", "requirements", tenantId] as const,
  // Prefix over every tenant's set. Requirement mutations are scoped by catalogue and never
  // learn the tenant id, so this is what they can invalidate; refetching another tenant's
  // set costs one request and is preferable to leaving the task picker stale.
  allTenantRequirements: () =>
    ["document-requirements", "requirements"] as const,
  detail: (catalogId: string) =>
    ["document-requirements", "catalogs", "detail", catalogId] as const,
  // Diagnostic only (US 16.21) — never persists, so a short staleTime on the query hook is
  // enough; no invalidation needed anywhere.
  preview: (catalogId: string, processContext: string) =>
    [
      "document-requirements",
      "catalogs",
      "preview",
      catalogId,
      processContext,
    ] as const,
} as const

// The endpoint caps per_page server-side; these are the widest useful pages for a picker.
export const DOCUMENT_REQUIREMENT_PAGE_SIZE = 50

export async function fetchTenantDocumentRequirementCatalogs(
  tenantId: string
): Promise<DocumentRequirementCatalogListResponse> {
  const data = await api.get(
    `/tenants/${tenantId}/document-requirement-catalogs`,
    { params: { per_page: DOCUMENT_REQUIREMENT_PAGE_SIZE } }
  )
  return DocumentRequirementCatalogListResponseSchema.parse(data)
}

// US 16.19's paginated, filtered list view — separate from the picker fetch above, which is
// fixed to the widest page and no filters on purpose (see its own doc comment).
export async function fetchDocumentRequirementCatalogs(
  tenantId: string,
  params?: DocumentRequirementCatalogListParams
): Promise<DocumentRequirementCatalogListResponse> {
  const data = await api.get(
    `/tenants/${tenantId}/document-requirement-catalogs`,
    { params }
  )
  return DocumentRequirementCatalogListResponseSchema.parse(data)
}

export async function createDocumentRequirementCatalog(
  tenantId: string,
  body: CreateDocumentRequirementCatalogRequest
): Promise<DocumentRequirementCatalogResponse> {
  const data = await api.post(
    `/tenants/${tenantId}/document-requirement-catalogs`,
    CreateDocumentRequirementCatalogRequestSchema.parse(body)
  )
  return DocumentRequirementCatalogResponseSchema.parse(data)
}

export async function fetchDocumentRequirements(
  catalogId: string
): Promise<DocumentRequirementListResponse> {
  const data = await api.get(
    `/document-requirement-catalogs/${catalogId}/requirements`,
    {
      params: {
        include_inactive: false,
        per_page: DOCUMENT_REQUIREMENT_PAGE_SIZE,
      },
    }
  )
  return DocumentRequirementListResponseSchema.parse(data)
}

// Requirements are embedded — the BE fetches all of them (including inactive) in this same call
// rather than exposing a separate paginated fetch for the detail screen.
export async function fetchDocumentRequirementCatalogDetail(
  catalogId: string
): Promise<DocumentRequirementCatalogDetailResponse> {
  const data = await api.get(`/document-requirement-catalogs/${catalogId}`)
  return DocumentRequirementCatalogDetailResponseSchema.parse(data)
}

export async function updateDocumentRequirementCatalog(
  catalogId: string,
  body: UpdateDocumentRequirementCatalogRequest
): Promise<DocumentRequirementCatalogResponse> {
  const data = await api.patch(
    `/document-requirement-catalogs/${catalogId}`,
    UpdateDocumentRequirementCatalogRequestSchema.parse(body)
  )
  return DocumentRequirementCatalogResponseSchema.parse(data)
}

export async function addRequirement(
  catalogId: string,
  body: AddRequirementRequest
): Promise<RequirementResponse> {
  const data = await api.post(
    `/document-requirement-catalogs/${catalogId}/requirements`,
    AddRequirementRequestSchema.parse(body)
  )
  return RequirementResponseSchema.parse(data)
}

export async function updateRequirement(
  requirementId: string,
  body: UpdateRequirementRequest
): Promise<RequirementResponse> {
  const data = await api.patch(
    `/document-requirements/${requirementId}`,
    UpdateRequirementRequestSchema.parse(body)
  )
  return RequirementResponseSchema.parse(data)
}

export async function deactivateRequirement(
  requirementId: string
): Promise<RequirementResponse> {
  const data = await api.post(
    `/document-requirements/${requirementId}/deactivate`
  )
  return RequirementResponseSchema.parse(data)
}

// US 16.21 — diagnostic only, never persists.
export async function fetchDocumentRequirementCatalogPreview(
  catalogId: string,
  processContext: string
): Promise<MaterializationResponse> {
  const data = await api.get(
    `/document-requirement-catalogs/${catalogId}/preview`,
    { params: { process_context: processContext } }
  )
  return MaterializationResponseSchema.parse(data)
}

// PRD1042-1794 Block 10 — the tenant's document-type registry. `include_inactive` is deliberately
// not sent: an authoring picker must not offer a retired type, and the backend already filters.
export async function fetchTenantDocumentTypes(
  tenantId: string
): Promise<DocumentTypeListResponse> {
  const data = await api.get(`/tenants/${tenantId}/document-types`)
  return DocumentTypeListResponseSchema.parse(data)
}
