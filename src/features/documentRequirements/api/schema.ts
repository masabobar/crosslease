import { z } from "zod"

/**
 * Document Requirement Catalog (Epic 16) — wire schemas.
 *
 * `DocumentRequirementSchema` is the thin field subset the Workflow Task Catalog picker needs
 * (US 15.7), composed via `.pick()` from the full `RequirementResponseSchema` below rather than
 * duplicated — the two describe the same wire entity.
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

// Wire enums — must match refinext-api
// src/app/modules/document_requirement_catalog/domain/enums.py exactly.
export const RequirementClassificationSchema = z.enum([
  "mandatory",
  "optional",
  "conditional",
])
export type RequirementClassification = z.infer<
  typeof RequirementClassificationSchema
>

export const GovernanceClassificationSchema = z.enum([
  "operational",
  "compliance_sensitive",
  "regulatory_critical",
])
export type GovernanceClassification = z.infer<
  typeof GovernanceClassificationSchema
>

// `default` is set automatically by the BE for Global Default entries; the other three are the
// three permitted Product-Specific layer actions (US 16.3).
export const SourceLayerSchema = z.enum([
  "default",
  "override",
  "supplement",
  "deactivated",
])
export type SourceLayer = z.infer<typeof SourceLayerSchema>

export const StageCategorizationSchema = z.enum([
  "submission",
  "approval",
  "disbursement_readiness",
])
export type StageCategorization = z.infer<typeof StageCategorizationSchema>

export const DocumentOriginSchema = z.enum(["uploaded", "generated"])
export type DocumentOrigin = z.infer<typeof DocumentOriginSchema>

// `conditional_rule`/`conditional_manual` both require `condition`; only `conditional_rule` is
// reachable from the UI in November scope (US 16.4) — the predicate authoring UI is post-MVP, so
// nothing in this app currently produces `conditional_manual`.
export const RequirementApplicabilitySchema = z.enum([
  "always",
  "conditional_rule",
  "conditional_manual",
])
export type RequirementApplicability = z.infer<
  typeof RequirementApplicabilitySchema
>

// A requirement row on GET /document-requirement-catalogs/{catalog_id} (embedded) and
// .../requirements — mirrors RequirementResponse exactly.
export const RequirementResponseSchema = z.object({
  id: z.string().uuid(),
  catalog_id: z.string().uuid(),
  requirement_code: z.string(),
  document_type_code: z.string(),
  document_type_name: z.string(),
  description: z.string().nullable(),
  classification: RequirementClassificationSchema,
  governance_classification: GovernanceClassificationSchema,
  source_layer: SourceLayerSchema,
  applicable_process_contexts: z.array(z.string()),
  stage_categorization: StageCategorizationSchema.nullable(),
  blocks_submission: z.boolean(),
  document_origin: DocumentOriginSchema,
  is_active: z.boolean(),
  sort_order: z.number(),
  applicability: RequirementApplicabilitySchema,
  condition: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type RequirementResponse = z.infer<typeof RequirementResponseSchema>

// Shared field shape behind both AddRequirementRequestSchema (below) and
// UpdateRequirementRequestSchema — kept as a plain object so both can compose from it
// (.superRefine() below returns a ZodEffects, which .omit()/.partial() cannot be called on).
const RequirementRequestFieldsSchema = z.object({
  requirement_code: z.string().min(1).max(100),
  document_type_code: z.string().min(1).max(100),
  document_type_name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  classification: RequirementClassificationSchema.default("mandatory"),
  governance_classification: GovernanceClassificationSchema,
  source_layer: SourceLayerSchema.nullable().optional(),
  applicable_process_contexts: z.array(z.string()).min(1),
  stage_categorization: StageCategorizationSchema.nullable().optional(),
  blocks_submission: z.boolean().default(true),
  document_origin: DocumentOriginSchema.default("uploaded"),
  sort_order: z.number().int().default(0),
  applicability: RequirementApplicabilitySchema.default("always"),
  condition: z.record(z.string(), z.unknown()).nullable().optional(),
})

// POST .../requirements — mirrors AddRequirementRequest, including its cross-field rule: BE
// rejects `condition` unless applicability is conditional_rule, and requires it when it is.
export const AddRequirementRequestSchema =
  RequirementRequestFieldsSchema.superRefine((data, ctx) => {
    const isConditionalRule = data.applicability === "conditional_rule"
    if (isConditionalRule && !data.condition) {
      ctx.addIssue({
        code: "custom",
        message: "conditionRequiredForConditionalRule",
        path: ["condition"],
      })
    }
    if (!isConditionalRule && data.condition) {
      ctx.addIssue({
        code: "custom",
        message: "conditionOnlyForConditionalRule",
        path: ["condition"],
      })
    }
  })
export type AddRequirementRequest = z.infer<typeof AddRequirementRequestSchema>

// PATCH /document-requirements/{id} — mirrors UpdateRequirementRequest: requirement_code,
// document_type_code and source_layer are immutable once created, so the edit form must not
// offer them. No cross-field condition/applicability rule — the BE has none for this endpoint.
export const UpdateRequirementRequestSchema =
  RequirementRequestFieldsSchema.omit({
    requirement_code: true,
    document_type_code: true,
    source_layer: true,
  }).partial()
export type UpdateRequirementRequest = z.infer<
  typeof UpdateRequirementRequestSchema
>

// PATCH /document-requirement-catalogs/{id} — mirrors UpdateCatalogRequest. catalog_type and
// product_template_id are absent: neither is mutable once the catalog is created.
export const UpdateDocumentRequirementCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200).optional(),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
  applicable_process_contexts: z.array(z.string()).min(1).optional(),
})
export type UpdateDocumentRequirementCatalogRequest = z.infer<
  typeof UpdateDocumentRequirementCatalogRequestSchema
>

// GET /document-requirement-catalogs/{catalog_id} — mirrors CatalogDetailResponse. Requirements
// are embedded (the BE fetches all of them, including inactive, in the same call) rather than
// paginated separately.
export const DocumentRequirementCatalogDetailResponseSchema =
  DocumentRequirementCatalogResponseSchema.extend({
    requirements: z.array(RequirementResponseSchema),
  })
export type DocumentRequirementCatalogDetailResponse = z.infer<
  typeof DocumentRequirementCatalogDetailResponseSchema
>

// GET .../preview?process_context= — mirrors MaterializationResponse (also the shape of
// POST .../materialize). Diagnostic only: never persists, per US 16.21.
export const MaterializedRequirementResponseSchema = z.object({
  requirement_definition_id: z.string().uuid(),
  requirement_code: z.string(),
  document_type_code: z.string(),
  document_type_name: z.string(),
  classification: RequirementClassificationSchema,
  governance_classification: GovernanceClassificationSchema,
  source_layer: SourceLayerSchema,
  stage_categorization: StageCategorizationSchema.nullable(),
  applicable_process_contexts: z.array(z.string()),
  blocks_submission: z.boolean(),
  document_origin: DocumentOriginSchema,
})
export type MaterializedRequirementResponse = z.infer<
  typeof MaterializedRequirementResponseSchema
>

export const MaterializationResponseSchema = z.object({
  catalog_id: z.string().uuid(),
  process_context: z.string(),
  effective_requirements: z.array(MaterializedRequirementResponseSchema),
  total: z.number(),
})
export type MaterializationResponse = z.infer<
  typeof MaterializationResponseSchema
>

// GET /document-requirement-catalogs/{catalog_id}/requirements — read-only slice consumed by the
// Workflow Task Catalog's document-requirement picker (US 15.7). Predates this catalog's own
// screens; composed from the full schema above rather than duplicated.
export const DocumentRequirementSchema = RequirementResponseSchema.pick({
  id: true,
  catalog_id: true,
  requirement_code: true,
  document_type_name: true,
  description: true,
  is_active: true,
  sort_order: true,
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
