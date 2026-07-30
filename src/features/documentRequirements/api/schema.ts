import { z } from "zod"

/**
 * Read-only slice of the Document Requirement Catalog (Epic 16).
 *
 * Only the fields the Workflow Task Catalog needs to render and pick a document requirement are
 * modelled — Zod strips the rest at `parse()`. E16 has no other FE presence yet; when it gains its
 * own screens they will own the full shapes and this can be folded into them.
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
