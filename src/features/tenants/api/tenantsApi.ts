import { api } from "@/lib/api"
import { TenantsResponseSchema } from "./schema"
import type { TenantsResponse } from "./schema"

export const TENANTS_QUERY_KEYS = {
  list: () => ["tenants", "list"] as const,
} as const

const TENANTS_FETCH_PAGE = 1
const TENANTS_FETCH_LIMIT = 100

export async function fetchTenants(): Promise<TenantsResponse> {
  const data = await api.get("/tenants", {
    params: { page: TENANTS_FETCH_PAGE, per_page: TENANTS_FETCH_LIMIT },
  })
  return TenantsResponseSchema.parse(data)
}
