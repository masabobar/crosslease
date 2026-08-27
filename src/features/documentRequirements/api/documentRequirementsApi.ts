import { api } from "@/lib/api"
import {
  AddRequirementRequestSchema,
  CreateDocumentRequirementCatalogRequestSchema,
  CreateDocumentTypeRequestSchema,
  DocumentRequirementCatalogDetailResponseSchema,
  DocumentRequirementCatalogListResponseSchema,
  DocumentRequirementCatalogResponseSchema,
  DocumentRequirementListResponseSchema,
  DocumentTypeListResponseSchema,
  DocumentTypeSchema,
  RuntimeRequirementSurfaceResponseSchema,
  RequirementResponseSchema,
  UpdateDocumentRequirementCatalogRequestSchema,
  UpdateDocumentTypeRequestSchema,
  UpdateRequirementRequestSchema,
} from "@/features/documentRequirements/api/schema"
import type {
  CreateDocumentTypeRequest,
  DocumentType,
  DocumentTypeListResponse,
  RuntimeRequirementSurfaceResponse,
  AddRequirementRequest,
  CreateDocumentRequirementCatalogRequest,
  DocumentRequirementCatalogDetailResponse,
  DocumentRequirementCatalogListResponse,
  DocumentRequirementCatalogResponse,
  DocumentRequirementListResponse,
  RequirementResponse,
  UpdateDocumentRequirementCatalogRequest,
  UpdateDocumentTypeRequest,
  UpdateRequirementRequest,
} from "@/features/documentRequirements/api/schema"

export type DocumentRequirementCatalogListParams = {
  search?: string
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

// PRD1042-1794 Block 10 — the tenant's document-type registry. `include_inactive` is deliberately
// not sent: an authoring picker must not offer a retired type, and the backend already filters.
export async function fetchTenantDocumentTypes(
  tenantId: string
): Promise<DocumentTypeListResponse> {
  const data = await api.get(`/tenants/${tenantId}/document-types`)
  return DocumentTypeListResponseSchema.parse(data)
}

// PRD1042-1794 Block 10 — the registry management list. Unlike the picker fetch above, this one
// drives a maintenance screen, so it can opt into deactivated rows via `include_inactive` (the
// backend defaults to active-only). Kept separate so the picker never accidentally offers a
// retired type.
export async function listDocumentTypes(
  tenantId: string,
  includeInactive = false
): Promise<DocumentTypeListResponse> {
  const data = await api.get(`/tenants/${tenantId}/document-types`, {
    params: includeInactive ? { include_inactive: true } : undefined,
  })
  return DocumentTypeListResponseSchema.parse(data)
}

export async function createDocumentType(
  tenantId: string,
  body: CreateDocumentTypeRequest
): Promise<DocumentType> {
  const data = await api.post(
    `/tenants/${tenantId}/document-types`,
    CreateDocumentTypeRequestSchema.parse(body)
  )
  return DocumentTypeSchema.parse(data)
}

// type_code and origin are immutable, so the request contract (and this function's body) never
// carries them; `is_active` is how the deactivate/reactivate row action is expressed.
export async function updateDocumentType(
  tenantId: string,
  documentTypeId: string,
  body: UpdateDocumentTypeRequest
): Promise<DocumentType> {
  const data = await api.patch(
    `/tenants/${tenantId}/document-types/${documentTypeId}`,
    UpdateDocumentTypeRequestSchema.parse(body)
  )
  return DocumentTypeSchema.parse(data)
}

// D-11 (PRD1042-1796 item 5) — what a case requires. `object_type` is the business object kind
// (a case is a `refinancing_request` object). `case_type` is the case's own type — the resolution
// key the backend matches a requirement's `applicable_case_types` against; the two are distinct.
export async function fetchCaseDocumentRequirements(
  catalogId: string,
  businessObjectId: string,
  objectType: string,
  caseType: string
): Promise<RuntimeRequirementSurfaceResponse> {
  const data = await api.get(
    `/document-requirement-catalogs/${catalogId}/objects/${businessObjectId}/requirements`,
    { params: { object_type: objectType, case_type: caseType } }
  )
  return RuntimeRequirementSurfaceResponseSchema.parse(data)
}

// The fulfilling document is streamed by the media endpoint, which authenticates from the session
// cookie — so a plain navigation is authenticated and no token is ever put in a URL. Same pattern as
// getLcPortalDocumentDownloadUrl.
export function getCaseDocumentUrl(documentId: string): string {
  return `${api.defaults.baseURL}/media/${documentId}`
}

// PRD1042-1794 item 6 — upload a document against one case requirement. Multipart, mirroring the FA
// attach flow (FormData on the shared axios instance, explicit multipart Content-Type). `case_id` is
// the business object id; `requirement_definition_id` names which requirement the file fulfils. The
// backend records a fulfilment and flips the requirement to `uploaded_pending_review`, so the caller
// invalidates the case-requirements query on success. MIME is validated client-side before this is
// called (see CASE_DOCUMENT_ACCEPTED_MIME); the backend is the authority.
export async function uploadCaseDocument(
  caseId: string,
  requirementDefinitionId: string,
  file: File
): Promise<void> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("requirement_definition_id", requirementDefinitionId)
  await api.post(`/cases/${caseId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}

// PRD1042-1794 A10/B3 — the bank's review action on a case document. Back Office checks a document
// (new_status "fulfilled") or rejects it ("rejected", which reopens the requirement). Front Office
// and leasing companies upload; only the bank reviews (fulfilment_review_write). Mirrors the backend
// transition endpoint (routes/fulfilment.py transition_status).
export async function transitionFulfilmentStatus(
  catalogId: string,
  args: {
    requirementDefinitionId: string
    businessObjectId: string
    businessObjectType: string
    newStatus: "fulfilled" | "rejected"
    transitionReason?: string
  }
): Promise<void> {
  await api.post(
    `/document-requirement-catalogs/${catalogId}/fulfilments/transition`,
    {
      requirement_definition_id: args.requirementDefinitionId,
      business_object_id: args.businessObjectId,
      business_object_type: args.businessObjectType,
      new_status: args.newStatus,
      transition_reason: args.transitionReason ?? null,
    }
  )
}
