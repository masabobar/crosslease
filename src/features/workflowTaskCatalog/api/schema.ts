import { z } from "zod"

// Wire enums — must match refinext-api
// src/app/modules/workflow_task_catalog/domain/enums.py exactly.
export const CatalogLayerSchema = z.enum(["global_default", "product_specific"])
export type CatalogLayer = z.infer<typeof CatalogLayerSchema>

export const CatalogEntityTypeSchema = z.enum([
  "refinancing_request",
  "financing",
  "redemption_request",
])
export type CatalogEntityType = z.infer<typeof CatalogEntityTypeSchema>

// Only two states exist on the wire. A catalog is created directly ACTIVE
// (services.py create_catalog) — there is no draft, and no endpoint transitions state,
// so "deprecated" from the pre-wiring shell has no wire counterpart.
export const CatalogStateSchema = z.enum(["active", "archived"])
export type CatalogState = z.infer<typeof CatalogStateSchema>

// GET /workflow-task-catalogs — mirrors CatalogListItemResponse.
// Deliberately thin: no version label, no published-at, no reference count and no product
// template name. entity_id is the Product Template UUID for product_specific rows
// (routes/catalogs.py passes the product_template_id filter through as entity_id).
export const CatalogListItemSchema = z.object({
  id: z.string().uuid(),
  catalog_name: z.string(),
  catalog_layer: CatalogLayerSchema,
  catalog_state: CatalogStateSchema,
  entity_type: CatalogEntityTypeSchema.nullable(),
  entity_id: z.string().uuid().nullable(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  created_at: z.string(),
})
export type CatalogListItem = z.infer<typeof CatalogListItemSchema>

export const CatalogListResponseSchema = z.object({
  items: z.array(CatalogListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
})
export type CatalogListResponse = z.infer<typeof CatalogListResponseSchema>

// POST /workflow-task-catalogs — mirrors CreateCatalogRequest.
// entity_type is required for BOTH layers; entity_id must be null for global_default and
// is required for product_specific (catalog_schemas.py validate_product_specific_fields).
export const CreateCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200),
  catalog_layer: CatalogLayerSchema,
  valid_from: z.string(),
  valid_until: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  entity_type: CatalogEntityTypeSchema.nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
})
export type CreateCatalogRequest = z.infer<typeof CreateCatalogRequestSchema>

// 201 from POST /workflow-task-catalogs — mirrors CatalogResponse.
// `warnings` carries the BE's "no Global Default exists for this Tenant × Entity Type"
// notice, which is informational rather than a failure (services.py create_catalog).
export const CatalogResponseSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  catalog_name: z.string(),
  catalog_layer: CatalogLayerSchema,
  catalog_state: CatalogStateSchema,
  entity_type: CatalogEntityTypeSchema.nullable(),
  entity_id: z.string().uuid().nullable(),
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  description: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  current_version_id: z.string().uuid().nullable().optional(),
  warnings: z.array(z.string()).default([]),
})
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>
