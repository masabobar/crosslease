import { api } from "@/lib/api"
import {
  CreateDocumentRequirementCatalogRequestSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
} from "@/features/documentRequirements/api/schema"
import type {
  CreateDocumentRequirementCatalogRequest,
  DocumentRequirementCatalogListResponse,
  DocumentRequirementCatalogResponse,
  DocumentRequirementCatalogType,
  DocumentRequirementListResponse,
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
