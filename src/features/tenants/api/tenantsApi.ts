import { api } from "@/lib/api"
import {
  TenantsResponseSchema,
  PlatformModulesResponseSchema,
  SeedPackagesResponseSchema,
} from "./schema"
import type {
  TenantsResponse,
  PlatformModulesResponse,
  SeedPackagesResponse,
  CreateTenantForm,
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
