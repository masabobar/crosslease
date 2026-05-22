import { api } from "@/lib/api"
import { TenantsResponseSchema } from "./schema"
import type { TenantsResponse } from "./schema"

export const TENANTS_QUERY_KEYS = {
  list: () => ["tenants", "list"] as const,
} as const

export async function fetchTenants(): Promise<TenantsResponse> {
  const data = await api.get("/tenants", { params: { page: 1, per_page: 100 } })
  return TenantsResponseSchema.parse(data)
}
