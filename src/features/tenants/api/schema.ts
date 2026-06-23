import { z } from "zod"

export const TenantStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
  "rejected",
  "expired",
])
export type TenantStatus = z.infer<typeof TenantStatusSchema>

export const TenantTypeSchema = z.enum([
  "bank",
  "bank_entity",
  "bank_branch_group",
])
export type TenantType = z.infer<typeof TenantTypeSchema>

export const SeedPackageSchema = z.enum([
  "standard_retail_bank",
  "minimal_sandbox",
])
export type SeedPackage = z.infer<typeof SeedPackageSchema>

export const TenantListItemSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string(),
  name: z.string(),
  code: z.string(),
  country: z.string(),
  default_currency: z.string(),
  tenant_type: TenantTypeSchema,
  status: TenantStatusSchema,
  active_module_count: z.number().int(),
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

export const PlatformModuleSchema = z.object({
  key: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  group: z.string(),
  always_on: z.boolean(),
  permissions: z.array(z.string()),
})
export type PlatformModule = z.infer<typeof PlatformModuleSchema>

export const PlatformModulesResponseSchema = z.object({
  modules: z.array(PlatformModuleSchema),
})
export type PlatformModulesResponse = z.infer<
  typeof PlatformModulesResponseSchema
>

export const SeedPackageEntrySchema = z.object({
  key: z.string(),
  display_name: z.string(),
  description: z.string(),
  includes: z.array(z.string()),
  available: z.boolean(),
})
export type SeedPackageEntry = z.infer<typeof SeedPackageEntrySchema>

export const SeedPackagesResponseSchema = z.object({
  packages: z.array(SeedPackageEntrySchema),
})
export type SeedPackagesResponse = z.infer<typeof SeedPackagesResponseSchema>

export const CreateTenantFormSchema = z.object({
  name: z.string().min(2).max(200),
  code: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Za-z0-9-]+$/, "codeInvalidChars"),
  tenant_type: TenantTypeSchema,
  default_currency: z.string().length(3),
  legal_entity_name: z.string().min(2).max(300),
  country: z.string().length(2),
  description: z.string().max(1000).optional(),
  modules: z.array(z.string()),
  seed_package: SeedPackageSchema,
  core_banking_integration_ref: z.string().max(200).optional(),
})
export type CreateTenantForm = z.infer<typeof CreateTenantFormSchema>
