import { api } from "@/lib/api"
import {
  AttachDocumentResponseSchema,
  DownloadURLResponseSchema,
  FADetailResponseSchema,
  FADocumentListResponseSchema,
  FADraftResponseSchema,
  FALCPartnersResponseSchema,
  FALinkedFinancingsResponseSchema,
  FAListResponseSchema,
  FAReactivatedResponseSchema,
  FASuspendedResponseSchema,
  FATerminatedResponseSchema,
  FAUtilizationResponseSchema,
  SelectableTemplatesResponseSchema,
  TerminationReadinessResponseSchema,
} from "@/features/frameworkAgreements/api/schema"
import type {
  ActivateFARequest,
  AttachDocumentResponse,
  BankEntity,
  CreateFARequest,
  DownloadURLResponse,
  FADetailResponse,
  FADocumentListResponse,
  FADraftResponse,
  FALCPartnersResponse,
  FALifecycleStatus,
  FALinkedFinancingsResponse,
  FAListResponse,
  FAReactivatedResponse,
  FASuspendedResponse,
  FATerminatedResponse,
  FAUtilizationResponse,
  ReactivateFARequest,
  SelectableTemplatesResponse,
  SuspendFARequest,
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

export const FRAMEWORK_AGREEMENTS_QUERY_KEYS = {
  list: (params?: FrameworkAgreementListParams) =>
    ["framework-agreements", "list", params] as const,
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
} as const

export async function fetchFrameworkAgreements(
  params?: FrameworkAgreementListParams
): Promise<FAListResponse> {
  const data = await api.get("/framework-agreements", { params })
  return FAListResponseSchema.parse(data)
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
  documentType: string,
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

export async function suspendFrameworkAgreement(
  id: string,
  body: SuspendFARequest
): Promise<FASuspendedResponse> {
  const data = await api.post(`/framework-agreements/${id}/suspend`, body)
  return FASuspendedResponseSchema.parse(data)
}

export async function reactivateFrameworkAgreement(
  id: string,
  body: ReactivateFARequest
): Promise<FAReactivatedResponse> {
  const data = await api.post(`/framework-agreements/${id}/reactivate`, body)
  return FAReactivatedResponseSchema.parse(data)
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

export async function detachFrameworkAgreementDocument(
  faId: string,
  docId: string
): Promise<void> {
  await api.delete(`/framework-agreements/${faId}/documents/${docId}`)
}
