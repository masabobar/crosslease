import { api } from "@/lib/api"
import {
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementListResponseSchema,
} from "@/features/documentRequirements/api/schema"
import type {
  DocumentRequirementCatalogListResponse,
  DocumentRequirementListResponse,
} from "@/features/documentRequirements/api/schema"

export const DOCUMENT_REQUIREMENT_QUERY_KEYS = {
  all: ["document-requirements"] as const,
  tenantCatalogs: (tenantId: string) =>
    ["document-requirements", "catalogs", tenantId] as const,
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
