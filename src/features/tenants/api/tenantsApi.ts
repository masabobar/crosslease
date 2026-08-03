import { z } from "zod"
import { api } from "@/lib/api"
import {
  TenantsResponseSchema,
  PlatformModulesResponseSchema,
  SeedPackagesResponseSchema,
  TenantDetailSchema,
  TenantResponseSchema,
  TenantDetailModulesResponseSchema,
  GovernanceHistoryResponseSchema,
  AccessPolicyResponseSchema,
  IntegrationBindingResponseSchema,
  SupportGrantSchema,
} from "./schema"
import type {
  TenantsResponse,
  PlatformModulesResponse,
  SeedPackagesResponse,
  CreateTenantForm,
  TenantDetail,
  TenantResponse,
  TenantDetailModulesResponse,
  GovernanceHistoryResponse,
  AccessPolicyResponse,
  IntegrationBindingResponse,
  SupportGrant,
  AccessReason,
} from "./schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import { GovernedActionSchema } from "@/features/governedActions/api/schema"

export type TenantListParams = {
  page?: number
  per_page?: number
  search?: string | null
  status?: string[]
  tenant_type?: string[]
  country?: string | null
  from_date?: string | null
  to_date?: string | null
  module_key?: string | null
  module_active?: boolean | null
}

export const TENANTS_QUERY_KEYS = {
  list: (params?: TenantListParams) => ["tenants", "list", params] as const,
  detail: (id: string) => ["tenants", "detail", id] as const,
  modules: (id: string) => ["tenants", "modules", id] as const,
  governanceHistory: (id: string) =>
    ["tenants", "governance-history", id] as const,
  grants: (id: string) => ["tenants", "grants", id] as const,
  accessPolicy: (id: string) => ["tenants", "access-policy", id] as const,
  integrationBinding: (id: string) =>
    ["tenants", "integration-binding", id] as const,
} as const

export const PLATFORM_MODULES_QUERY_KEYS = {
  all: () => ["platform", "modules"] as const,
} as const

export const SEED_PACKAGES_QUERY_KEYS = {
  all: () => ["platform", "seed-packages"] as const,
} as const

export async function fetchTenants(
  params?: TenantListParams
): Promise<TenantsResponse> {
  const data = await api.get("/tenants", { params })
  return TenantsResponseSchema.parse(data)
}

export async function fetchPlatformModules(): Promise<PlatformModulesResponse> {
  const data = await api.get("/platform/modules")
  return PlatformModulesResponseSchema.parse(data)
}

export async function fetchSeedPackages(): Promise<SeedPackagesResponse> {
  const data = await api.get("/platform/seed-packages")
  return SeedPackagesResponseSchema.parse(data)
}

export type GovernanceHistoryParams = {
  cursor?: string
  per_page?: number
  event_types?: string[]
  from_date?: string
  to_date?: string
}

export async function fetchTenantDetail(id: string): Promise<TenantDetail> {
  const data = await api.get(`/tenants/${id}`)
  return TenantDetailSchema.parse(data)
}

export async function fetchTenantModules(
  id: string
): Promise<TenantDetailModulesResponse> {
  const data = await api.get(`/tenants/${id}/modules`)
  return TenantDetailModulesResponseSchema.parse(data)
}

export async function fetchGovernanceHistory(
  id: string,
  params?: GovernanceHistoryParams
): Promise<GovernanceHistoryResponse> {
  const data = await api.get(`/tenants/${id}/governance-history`, { params })
  return GovernanceHistoryResponseSchema.parse(data)
}

export async function fetchAccessPolicy(
  id: string
): Promise<AccessPolicyResponse> {
  const data = await api.get(`/tenants/${id}/access-policy`)
  return AccessPolicyResponseSchema.parse(data)
}

export async function fetchIntegrationBinding(
  id: string
): Promise<IntegrationBindingResponse> {
  const data = await api.get(`/tenants/${id}/integration-binding`)
  return IntegrationBindingResponseSchema.parse(data)
}

export async function fetchSupportGrants(id: string): Promise<SupportGrant[]> {
  const data = await api.get(`/tenants/${id}/grants`)
  return z.array(SupportGrantSchema).parse(data)
}

export type CreateGrantPayload = {
  grantee_id: string
  access_reason: AccessReason
  valid_from: string
  valid_until: string
  additional_context?: string | null
}

export async function createGrant(
  tenantId: string,
  payload: CreateGrantPayload
): Promise<SupportGrant> {
  const data = await api.post(`/tenants/${tenantId}/grants`, payload)
  return SupportGrantSchema.parse(data)
}

export type RevokeGrantPayload = {
  revocation_reason: string
}

export async function revokeGrant(
  tenantId: string,
  grantId: string,
  payload: RevokeGrantPayload
): Promise<SupportGrant> {
  const data = await api.delete(`/tenants/${tenantId}/grants/${grantId}`, {
    data: payload,
  })
  return SupportGrantSchema.parse(data)
}

export type UpdateTenantPayload = {
  name?: string
  legal_entity_name?: string
  description?: string | null
  legal_hold_flag?: boolean
  justification?: string
  max_lc_count?: number
  max_bank_user_count?: number
  max_users_per_lc?: number
}

export async function updateTenant(
  id: string,
  payload: UpdateTenantPayload
): Promise<TenantResponse> {
  const data = await api.patch(`/tenants/${id}`, payload)
  return TenantResponseSchema.parse(data)
}

export type UpdateAccessPolicyPayload = {
  support_read_only_access_allowed?: boolean | null
  auditor_access_allowed?: boolean | null
  lc_portal_enabled?: boolean | null
  reason: string
}

export type UpsertIntegrationBindingPayload = {
  endpoint_url: string
  credential_scope_identifier: string
  integration_active: boolean
  disbursement_execution_boundary_note?: string | null
  justification: string
}

export async function upsertIntegrationBinding(
  id: string,
  payload: UpsertIntegrationBindingPayload
): Promise<IntegrationBindingResponse> {
  const data = await api.patch(`/tenants/${id}/integration-binding`, payload)
  return IntegrationBindingResponseSchema.parse(data)
}

export async function updateAccessPolicy(
  id: string,
  payload: UpdateAccessPolicyPayload
): Promise<void> {
  await api.patch(`/tenants/${id}/access-policy`, payload)
}

export type SuspendTenantPayload = {
  justification: string
}

export async function suspendTenant(
  id: string,
  payload: SuspendTenantPayload
): Promise<GovernedAction> {
  const data = await api.post(`/tenants/${id}/suspend`, payload)
  return GovernedActionSchema.parse(data)
}

export type ReactivateTenantPayload = {
  justification: string
}

export type ModuleActivatePayload = {
  justification: string
}

export async function activateTenantModule(
  tenantId: string,
  moduleKey: string,
  payload: ModuleActivatePayload
): Promise<GovernedAction> {
  const data = await api.post(
    `/tenants/${tenantId}/modules/${moduleKey}/activate`,
    payload
  )
  return GovernedActionSchema.parse(data)
}

export type ModuleDeactivatePayload = {
  justification: string
}

export async function deactivateTenantModule(
  tenantId: string,
  moduleKey: string,
  payload: ModuleDeactivatePayload
): Promise<void> {
  await api.post(
    `/tenants/${tenantId}/modules/${moduleKey}/deactivate`,
    payload
  )
}

export async function reactivateTenant(
  id: string,
  payload: ReactivateTenantPayload
): Promise<GovernedAction> {
  const data = await api.post(`/tenants/${id}/reactivate`, payload)
  return GovernedActionSchema.parse(data)
}

export type ArchiveTenantPayload = {
  justification: string
  irreversibility_acknowledgement: boolean
}

export async function archiveTenant(
  id: string,
  payload: ArchiveTenantPayload
): Promise<GovernedAction> {
  const data = await api.post(`/tenants/${id}/archive`, payload)
  return GovernedActionSchema.parse(data)
}

export async function createTenant(
  payload: CreateTenantForm
): Promise<GovernedAction> {
  const data = await api.post("/tenants", {
    name: payload.name,
    code: payload.code,
    legal_entity_name: payload.legal_entity_name,
    country: payload.country,
    tenant_type: payload.tenant_type,
    default_currency: payload.default_currency,
    description: payload.description || undefined,
    modules: payload.modules,
    seed_package: payload.seed_package,
    core_banking_integration_ref:
      payload.core_banking_integration_ref || undefined,
  })
  return GovernedActionSchema.parse(data)
}
