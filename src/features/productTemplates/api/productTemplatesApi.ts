import { api } from "@/lib/api"
import {
  NewVersionCreatedResponseSchema,
  ProductStatusResponseSchema,
  PublishTemplateDraftResponseSchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  TemplateListResponseSchema,
  TemplateVersionDetailSchema,
  TerminateTemplateVersionResponseSchema,
  VersionDiffResponseSchema,
  VersionHistoryResponseSchema,
} from "@/features/productTemplates/api/schema"
import type {
  CreateProductTemplateDraftRequest,
  DeactivateProductTemplateRequest,
  NewVersionCreatedResponse,
  ProductStatusResponse,
  PublishTemplateDraftRequest,
  PublishTemplateDraftResponse,
  TemplateDraftCreatedResponse,
  TemplateDraftDiscardedResponse,
  TemplateDraftUpdatedResponse,
  TemplateListResponse,
  TemplateVersionDetail,
  TerminateTemplateVersionRequest,
  TerminateTemplateVersionResponse,
  UpdateProductTemplateDraftRequest,
  VersionDiffResponse,
  VersionHistoryResponse,
} from "@/features/productTemplates/api/schema"

export type ProductTemplateListParams = {
  search?: string
  // Was `TemplateStatus` (the 6-value version-status enum): the backend widened this query
  // param to a plain string and dropped the TemplateStatus component from openapi.json — it
  // no longer rejects values outside that enum. TemplateStatus itself is unaffected as a
  // concept (version_status fields on responses are still validated against it); only this
  // request-side constraint was relaxed.
  status?: string
  page?: number
  per_page?: number
}

export const PRODUCT_TEMPLATES_QUERY_KEYS = {
  // Prefix shared by every key below — the invalidation target for status-changing
  // mutations. They can't rebuild the `list` key (it carries the caller's tenant and
  // filter params) or know which version details are cached, so they invalidate the
  // whole feature instead of leaving those screens showing a stale status.
  all: ["product-templates"] as const,
  list: (tenantId: string | null, params?: ProductTemplateListParams) =>
    ["product-templates", "list", tenantId, params] as const,
  detail: (templateId: string) =>
    ["product-templates", "detail", templateId] as const,
  versions: (templateId: string) =>
    ["product-templates", "versions", templateId] as const,
  versionDetail: (templateId: string, versionNumber: string) =>
    ["product-templates", "version-detail", templateId, versionNumber] as const,
  diff: (templateId: string, fromVersion: string, toVersion: string) =>
    ["product-templates", "diff", templateId, fromVersion, toVersion] as const,
} as const

export async function fetchProductTemplates(
  tenantId: string,
  params?: ProductTemplateListParams
): Promise<TemplateListResponse> {
  const data = await api.get(`/tenants/${tenantId}/product-templates`, {
    params,
  })
  return TemplateListResponseSchema.parse(data)
}

export async function createProductTemplateDraft(
  tenantId: string,
  body: CreateProductTemplateDraftRequest
): Promise<TemplateDraftCreatedResponse> {
  const data = await api.post(`/tenants/${tenantId}/product-templates`, body)
  return TemplateDraftCreatedResponseSchema.parse(data)
}

export async function updateProductTemplateDraft(
  templateId: string,
  versionNumber: string,
  body: UpdateProductTemplateDraftRequest
): Promise<TemplateDraftUpdatedResponse> {
  const data = await api.patch(
    `/product-templates/${templateId}/versions/${versionNumber}`,
    body
  )
  return TemplateDraftUpdatedResponseSchema.parse(data)
}

export async function discardProductTemplateDraft(
  templateId: string,
  versionNumber: string
): Promise<TemplateDraftDiscardedResponse> {
  const data = await api.post(
    `/product-templates/${templateId}/versions/${versionNumber}/discard`
  )
  return TemplateDraftDiscardedResponseSchema.parse(data)
}

export async function publishProductTemplate(
  templateId: string,
  versionNumber: string,
  body: PublishTemplateDraftRequest
): Promise<PublishTemplateDraftResponse> {
  const data = await api.post(
    `/product-templates/${templateId}/versions/${versionNumber}/publish`,
    body
  )
  return PublishTemplateDraftResponseSchema.parse(data)
}

export async function fetchTemplateVersions(
  templateId: string
): Promise<VersionHistoryResponse> {
  const data = await api.get(`/product-templates/${templateId}/versions`)
  return VersionHistoryResponseSchema.parse(data)
}

export async function fetchTemplateVersionDetail(
  templateId: string,
  versionNumber: string
): Promise<TemplateVersionDetail> {
  const data = await api.get(
    `/product-templates/${templateId}/versions/${versionNumber}`
  )
  return TemplateVersionDetailSchema.parse(data)
}

export async function fetchTemplateVersionDiff(
  templateId: string,
  fromVersion: string,
  toVersion: string
): Promise<VersionDiffResponse> {
  const data = await api.get(`/product-templates/${templateId}/diff`, {
    params: { from_version: fromVersion, to_version: toVersion },
  })
  return VersionDiffResponseSchema.parse(data)
}

export async function createNewProductTemplateVersion(
  templateId: string
): Promise<NewVersionCreatedResponse> {
  const data = await api.post(`/product-templates/${templateId}/versions`)
  return NewVersionCreatedResponseSchema.parse(data)
}

export async function terminateProductTemplateVersion(
  templateId: string,
  versionNumber: string,
  body: TerminateTemplateVersionRequest
): Promise<TerminateTemplateVersionResponse> {
  const data = await api.post(
    `/product-templates/${templateId}/versions/${versionNumber}/terminate`,
    body
  )
  return TerminateTemplateVersionResponseSchema.parse(data)
}

export async function deactivateProductTemplate(
  templateId: string,
  body: DeactivateProductTemplateRequest
): Promise<ProductStatusResponse> {
  const data = await api.post(
    `/product-templates/${templateId}/deactivate`,
    body
  )
  return ProductStatusResponseSchema.parse(data)
}

// No request body — reversing a deactivation carries no reason, unlike deactivating itself.
export async function reactivateProductTemplate(
  templateId: string
): Promise<ProductStatusResponse> {
  const data = await api.post(`/product-templates/${templateId}/reactivate`)
  return ProductStatusResponseSchema.parse(data)
}
