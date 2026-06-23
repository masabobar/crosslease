import { z } from "zod"
import { api } from "@/lib/api"
import {
  TenantsResponseSchema,
  PlatformModulesResponseSchema,
  SeedPackagesResponseSchema,
  TenantDetailSchema,
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
  TenantDetailModulesResponse,
  GovernanceHistoryResponse,
  AccessPolicyResponse,
  IntegrationBindingResponse,
  SupportGrant,
} from "./schema"
import type { GovernedAction } from "@/features/governed-actions/api/schema"
import { GovernedActionSchema } from "@/features/governed-actions/api/schema"

export type TenantListParams = {
  page?: number
  per_page?: number
  status?: string[]
  tenant_type?: string[]
  country?: string | null
  from_date?: string | null
  to_date?: string | null
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

export async function createTenant(
  payload: CreateTenantForm
): Promise<GovernedAction> {
  const data = await api.post("/tenants", {
    name: payload.name,
    code: payload.code,
    legal_entity_name: payload.legal_entity_name,
    country: payload.country,
    tenant_type: payload.tenant_type,
    description: payload.description || undefined,
    modules: payload.modules,
    seed_package: payload.seed_package,
    core_banking_integration_ref:
      payload.core_banking_integration_ref || undefined,
  })
  return GovernedActionSchema.parse(data)
}
