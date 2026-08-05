import { z } from "zod"

/**
 * Document Requirement Catalog (Epic 16) — wire schemas.
 *
 * `DocumentRequirementSchema` below predates the catalog's own screens and is kept as the
 * read-only slice the Workflow Task Catalog picker needs (see its doc comment). Everything else
 * in this file backs the catalog's own list/create screens (US 16.19, 16.1).
 */

// Same two-layer model as the workflow task catalogue.
export const DocumentRequirementCatalogTypeSchema = z.enum([
  "global_default",
  "product_specific",
])
export type DocumentRequirementCatalogType = z.infer<
  typeof DocumentRequirementCatalogTypeSchema
>

export const DocumentRequirementCatalogListItemSchema = z.object({
  id: z.string().uuid(),
  catalog_name: z.string(),
  catalog_type: DocumentRequirementCatalogTypeSchema,
  applicable_process_contexts: z.array(z.string()),
  product_template_id: z.string().uuid().nullable(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  created_at: z.string(),
})
export type DocumentRequirementCatalogListItem = z.infer<
  typeof DocumentRequirementCatalogListItemSchema
>

export const DocumentRequirementCatalogListResponseSchema = z.object({
  items: z.array(DocumentRequirementCatalogListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
export type DocumentRequirementCatalogListResponse = z.infer<
  typeof DocumentRequirementCatalogListResponseSchema
>

// POST /tenants/{tenant_id}/document-requirement-catalogs — mirrors CreateCatalogRequest.
// product_template_id is required for product_specific and must be absent for global_default;
// enforced by the two create-dialog schemas (see CreateDocumentRequirementCatalogDialog), not
// here — the BE itself has no such cross-field check beyond product_template_id being nullable.
export const CreateDocumentRequirementCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200),
  catalog_type: DocumentRequirementCatalogTypeSchema,
  applicable_process_contexts: z.array(z.string()).min(1),
  product_template_id: z.string().uuid().nullable(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
})
export type CreateDocumentRequirementCatalogRequest = z.infer<
  typeof CreateDocumentRequirementCatalogRequestSchema
>

// 201 from the create endpoint — mirrors CatalogResponse. No `catalog_state`/`operational_state`
// field exists on the wire (US 16.1: a catalog is Active on creation, no separate publish step),
// so there is nothing to parse for one — see open-questions.md for the list-column gap this
// causes.
export const DocumentRequirementCatalogResponseSchema = z.object({
  id: z.string().uuid(),
  catalog_name: z.string(),
  catalog_type: DocumentRequirementCatalogTypeSchema,
  applicable_process_contexts: z.array(z.string()),
  product_template_id: z.string().uuid().nullable(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type DocumentRequirementCatalogResponse = z.infer<
  typeof DocumentRequirementCatalogResponseSchema
>

// GET /document-requirement-catalogs/{catalog_id}/requirements — read-only slice consumed by the
// Workflow Task Catalog's document-requirement picker (US 15.7). Predates this catalog's own
// screens.
export const DocumentRequirementSchema = z.object({
  id: z.string().uuid(),
  catalog_id: z.string().uuid(),
  requirement_code: z.string(),
  document_type_name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number(),
})
export type DocumentRequirement = z.infer<typeof DocumentRequirementSchema>

export const DocumentRequirementListResponseSchema = z.object({
  items: z.array(DocumentRequirementSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
})
export type DocumentRequirementListResponse = z.infer<
  typeof DocumentRequirementListResponseSchema
>
