import { api } from "@/lib/api"
import {
  AttachDocumentResponseSchema,
  DownloadURLResponseSchema,
  FAAuditHistoryResponseSchema,
  FADetailResponseSchema,
  FADocumentListResponseSchema,
  FADraftResponseSchema,
  FALCPartnersResponseSchema,
  FALinkedFinancingsResponseSchema,
  FAListResponseSchema,
  FAReconstructResponseSchema,
  FATerminatedResponseSchema,
  FAUtilizationResponseSchema,
  FAVersionDetailResponseSchema,
  FAVersionDiffResponseSchema,
  FAVersionListResponseSchema,
  SelectableTemplatesResponseSchema,
  TerminationReadinessResponseSchema,
} from "@/features/frameworkAgreements/api/schema"
import type {
  ActivateFARequest,
  AttachDocumentResponse,
  BankEntity,
  CreateFARequest,
  DownloadURLResponse,
  FAAuditHistoryResponse,
  FADetailResponse,
  FADocumentListResponse,
  FADocumentType,
  FADraftResponse,
  FAEventTypeFilter,
  FALCPartnersResponse,
  FALifecycleStatus,
  FALinkedFinancingsResponse,
  FAListResponse,
  FAReconstructResponse,
  FATerminatedResponse,
  FAUtilizationResponse,
  FAVersionDetailResponse,
  FAVersionDiffResponse,
  FAVersionListResponse,
  SelectableTemplatesResponse,
  TerminateFARequest,
  TerminationReadinessResponse,
  UpdateFARequest,
} from "@/features/frameworkAgreements/api/schema"

export type FrameworkAgreementListParams = {
  q?: string
  status?: FALifecycleStatus
  lc_partner_id?: string
  bank_entity?: BankEntity
  page?: number
  per_page?: number
}

// Query params accepted by GET /framework-agreements/export-csv — the list filters
// minus pagination. `search` is the wire name the endpoint expects.
export type FrameworkAgreementExportParams = {
  search?: string
  status?: FALifecycleStatus
  lc_partner_id?: string
  bank_entity?: BankEntity
  valid_from?: string
  valid_until?: string
}

export type FrameworkAgreementAuditHistoryParams = {
  search?: string
  type?: FAEventTypeFilter[]
  from?: string
  to?: string
  per_page?: number
  cursor?: string
}

export type FrameworkAgreementAuditHistoryExportParams = Omit<
  FrameworkAgreementAuditHistoryParams,
  "per_page" | "cursor"
> & {
  reason?: string
}

export const FRAMEWORK_AGREEMENTS_QUERY_KEYS = {
  list: (params?: FrameworkAgreementListParams) =>
    params
      ? (["framework-agreements", "list", params] as const)
      : (["framework-agreements", "list"] as const),
  lcPartners: () => ["framework-agreements", "lc-partners"] as const,
  detail: (id: string) => ["framework-agreements", "detail", id] as const,
  selectableTemplates: () =>
    ["product-templates", "selectable", "framework-agreement"] as const,
  utilization: (id: string) =>
    ["framework-agreements", "utilization", id] as const,
  financings: (id: string) =>
    ["framework-agreements", "financings", id] as const,
  terminationReadiness: (id: string) =>
    ["framework-agreements", "termination-readiness", id] as const,
  documents: (id: string) => ["framework-agreements", "documents", id] as const,
  auditHistory: (
    id: string,
    params?: Omit<FrameworkAgreementAuditHistoryParams, "cursor">
  ) => ["framework-agreements", "audit-history", id, params] as const,
  reconstruct: (id: string, asOf: string) =>
    ["framework-agreements", "reconstruct", id, asOf] as const,
  versions: (id: string) => ["framework-agreements", "versions", id] as const,
  versionDetail: (id: string, versionNumber: string) =>
    ["framework-agreements", "version-detail", id, versionNumber] as const,
  versionDiff: (id: string, fromVersion: string, toVersion: string) =>
    [
      "framework-agreements",
      "version-diff",
      id,
      fromVersion,
      toVersion,
    ] as const,
} as const

export async function fetchFrameworkAgreements(
  params?: FrameworkAgreementListParams
): Promise<FAListResponse> {
  const data = await api.get("/framework-agreements", { params })
  return FAListResponseSchema.parse(data)
}

// GET /framework-agreements/export-csv — plain inventory export of the list, scoped to
// the caller and respecting the same filters (CR PRD1042-1552 B3). Returns a CSV blob,
// not the JSON envelope, so it bypasses schema parsing like the audit-history export.
export async function exportFrameworkAgreementsCsv(
  params?: FrameworkAgreementExportParams
): Promise<Blob> {
  return api.get("/framework-agreements/export-csv", {
    params,
    responseType: "blob",
  })
}

export async function fetchFrameworkAgreementLcPartners(): Promise<FALCPartnersResponse> {
  const data = await api.get("/framework-agreements/lc-partners")
  return FALCPartnersResponseSchema.parse(data)
}

export async function createFrameworkAgreementDraft(
  body: CreateFARequest
): Promise<FADraftResponse> {
  const data = await api.post("/framework-agreements", body)
  return FADraftResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementDetail(
  id: string
): Promise<FADetailResponse> {
  const data = await api.get(`/framework-agreements/${id}`)
  return FADetailResponseSchema.parse(data)
}

export async function activateFrameworkAgreement(
  id: string,
  body: ActivateFARequest
): Promise<FADraftResponse> {
  const data = await api.post(`/framework-agreements/${id}/activate`, body)
  return FADraftResponseSchema.parse(data)
}

export async function fetchSelectableProductTemplates(): Promise<SelectableTemplatesResponse> {
  const data = await api.get("/product-templates/selectable")
  return SelectableTemplatesResponseSchema.parse(data)
}

export async function attachFrameworkAgreementDocument(
  faId: string,
  file: File,
  documentType: FADocumentType,
  documentLabel?: string
): Promise<AttachDocumentResponse> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("document_type", documentType)
  if (documentLabel) {
    formData.append("document_label", documentLabel)
  }
  const data = await api.post(
    `/framework-agreements/${faId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return AttachDocumentResponseSchema.parse(data)
}

export async function terminateFrameworkAgreement(
  id: string,
  body: TerminateFARequest
): Promise<FATerminatedResponse> {
  const data = await api.post(`/framework-agreements/${id}/terminate`, body)
  return FATerminatedResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementTerminationReadiness(
  id: string
): Promise<TerminationReadinessResponse> {
  const data = await api.get(
    `/framework-agreements/${id}/termination-readiness`
  )
  return TerminationReadinessResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementUtilization(
  id: string
): Promise<FAUtilizationResponse> {
  const data = await api.get(`/framework-agreements/${id}/utilization`)
  return FAUtilizationResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementFinancings(
  id: string
): Promise<FALinkedFinancingsResponse> {
  const data = await api.get(`/framework-agreements/${id}/financings`)
  return FALinkedFinancingsResponseSchema.parse(data)
}

export async function updateFrameworkAgreement(
  id: string,
  body: UpdateFARequest
): Promise<FADraftResponse> {
  const data = await api.patch(`/framework-agreements/${id}`, body)
  return FADraftResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementDocuments(
  faId: string
): Promise<FADocumentListResponse> {
  const data = await api.get(`/framework-agreements/${faId}/documents`)
  return FADocumentListResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementDocumentDownloadUrl(
  faId: string,
  docId: string
): Promise<DownloadURLResponse> {
  const data = await api.get(
    `/framework-agreements/${faId}/documents/${docId}/download-url`
  )
  return DownloadURLResponseSchema.parse(data)
}

/**
 * DELETE /framework-agreements/{id} — "Delete Fa Draft". Used when the create wizard's
 * discard is confirmed after a draft has already been persisted, so the discard the dialog
 * promises actually happens instead of leaving the record behind.
 */
export async function deleteFrameworkAgreementDraft(id: string): Promise<void> {
  await api.delete(`/framework-agreements/${id}`)
}

export async function detachFrameworkAgreementDocument(
  faId: string,
  docId: string
): Promise<void> {
  await api.delete(`/framework-agreements/${faId}/documents/${docId}`)
}

export async function fetchFrameworkAgreementAuditHistory(
  id: string,
  params?: FrameworkAgreementAuditHistoryParams
): Promise<FAAuditHistoryResponse> {
  const data = await api.get(`/framework-agreements/${id}/audit-history`, {
    params,
  })
  return FAAuditHistoryResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementReconstruct(
  id: string,
  asOf: string
): Promise<FAReconstructResponse> {
  const data = await api.get(`/framework-agreements/${id}/reconstruct`, {
    params: { as_of: asOf },
  })
  return FAReconstructResponseSchema.parse(data)
}

export async function exportFrameworkAgreementAuditHistoryCsv(
  id: string,
  params?: FrameworkAgreementAuditHistoryExportParams
): Promise<Blob> {
  return api.get(`/framework-agreements/${id}/audit-history/export-csv`, {
    params,
    responseType: "blob",
  })
}

// FA versioning (CR-FA-04 on PRD1042-1799) — view-only for now. `create_new_version` and
// `activate_version` are deliberately not wired here: the backend has no way to edit a new
// draft version's fields before activating it (no version-scoped PATCH, unlike the Bank
// Product Template equivalent), so an authoring flow would only ever produce a byte-for-byte
// clone of the current version. See open-questions Q-064.
export async function fetchFrameworkAgreementVersions(
  id: string
): Promise<FAVersionListResponse> {
  const data = await api.get(`/framework-agreements/${id}/versions`)
  return FAVersionListResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementVersionDetail(
  id: string,
  versionNumber: string
): Promise<FAVersionDetailResponse> {
  const data = await api.get(
    `/framework-agreements/${id}/versions/${versionNumber}`
  )
  return FAVersionDetailResponseSchema.parse(data)
}

export async function fetchFrameworkAgreementVersionDiff(
  id: string,
  fromVersion: string,
  toVersion: string
): Promise<FAVersionDiffResponse> {
  const data = await api.get(`/framework-agreements/${id}/diff`, {
    params: { from_version: fromVersion, to_version: toVersion },
  })
  return FAVersionDiffResponseSchema.parse(data)
}
