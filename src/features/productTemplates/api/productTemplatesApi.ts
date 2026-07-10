import { api } from "@/lib/api"
import {
  TemplateDraftCreatedResponseSchema,
  TemplateDraftDiscardedResponseSchema,
  TemplateDraftUpdatedResponseSchema,
  TemplateVersionHeaderSchema,
  VersionHistoryResponseSchema,
} from "@/features/productTemplates/api/schema"
import type {
  CreateProductTemplateDraftRequest,
  TemplateDraftCreatedResponse,
  TemplateDraftDiscardedResponse,
  TemplateDraftUpdatedResponse,
  TemplateVersionHeader,
  UpdateProductTemplateDraftRequest,
  VersionHistoryResponse,
} from "@/features/productTemplates/api/schema"

export const PRODUCT_TEMPLATES_QUERY_KEYS = {
  list: (tenantId: string | null) =>
    ["product-templates", "list", tenantId] as const,
  detail: (templateId: string) =>
    ["product-templates", "detail", templateId] as const,
  versions: (templateId: string) =>
    ["product-templates", "versions", templateId] as const,
  versionDetail: (templateId: string, versionNumber: string) =>
    ["product-templates", "version-detail", templateId, versionNumber] as const,
} as const

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

export async function fetchTemplateVersions(
  templateId: string
): Promise<VersionHistoryResponse> {
  const data = await api.get(`/product-templates/${templateId}/versions`)
  return VersionHistoryResponseSchema.parse(data)
}

export async function fetchTemplateVersionHeader(
  templateId: string,
  versionNumber: string
): Promise<TemplateVersionHeader> {
  const data = await api.get(
    `/product-templates/${templateId}/versions/${versionNumber}`
  )
  return TemplateVersionHeaderSchema.parse(data)
}
