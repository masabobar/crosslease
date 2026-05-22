import { z } from "zod"

export const TenantStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
])

export const TenantListItemSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string(),
  name: z.string(),
  code: z.string(),
  country: z.string(),
  default_currency: z.string(),
  status: TenantStatusSchema,
})

export type TenantListItem = z.infer<typeof TenantListItemSchema>

export const TenantsResponseSchema = z.object({
  tenants: z.array(TenantListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})

export type TenantsResponse = z.infer<typeof TenantsResponseSchema>
