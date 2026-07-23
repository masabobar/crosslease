import { api } from "@/lib/api"
import {
  DeprecateTemplateVersionResponseSchema,
  NewVersionCreatedResponseSchema,
  PublishTemplateDraftResponseSchema,
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  TemplateListResponseSchema,
  TemplateVersionDetailSchema,
  VersionHistoryResponseSchema,
} from "@/features/productTemplates/api/schema"
import type {
  CreateNewVersionRequest,
  CreateProductTemplateDraftRequest,
  DeprecateTemplateVersionRequest,
  DeprecateTemplateVersionResponse,
  NewVersionCreatedResponse,
  PublishTemplateDraftRequest,
  PublishTemplateDraftResponse,
  TemplateDraftCreatedResponse,
  TemplateDraftDiscardedResponse,
  TemplateDraftUpdatedResponse,
  TemplateListResponse,
  TemplateStatus,
  TemplateVersionDetail,
  UpdateProductTemplateDraftRequest,
  VersionHistoryResponse,
} from "@/features/productTemplates/api/schema"

export type ProductTemplateListParams = {
  search?: string
  status?: TemplateStatus
  page?: number
  per_page?: number
}

export const PRODUCT_TEMPLATES_QUERY_KEYS = {
  list: (tenantId: string | null, params?: ProductTemplateListParams) =>
    ["product-templates", "list", tenantId, params] as const,
  detail: (templateId: string) =>
    ["product-templates", "detail", templateId] as const,
  versions: (templateId: string) =>
    ["product-templates", "versions", templateId] as const,
  versionDetail: (templateId: string, versionNumber: string) =>
    ["product-templates", "version-detail", templateId, versionNumber] as const,
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

export async function createNewProductTemplateVersion(
  templateId: string,
  body: CreateNewVersionRequest
): Promise<NewVersionCreatedResponse> {
  const data = await api.post(`/product-templates/${templateId}/versions`, body)
  return NewVersionCreatedResponseSchema.parse(data)
}

export async function deprecateProductTemplateVersion(
  templateId: string,
  versionNumber: string,
  body: DeprecateTemplateVersionRequest
): Promise<DeprecateTemplateVersionResponse> {
  const data = await api.post(
    `/product-templates/${templateId}/versions/${versionNumber}/deprecate`,
    body
  )
  return DeprecateTemplateVersionResponseSchema.parse(data)
}
