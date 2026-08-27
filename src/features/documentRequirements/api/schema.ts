import { z } from "zod"
import { CaseTypeSchema } from "@/features/cases/api/schema"

/**
 * Document Requirement Catalog (Epic 16) — wire schemas.
 *
 * `DocumentRequirementSchema` is the thin field subset the Workflow Task Catalog picker needs
 * (US 15.7), composed via `.pick()` from the full `RequirementResponseSchema` below rather than
 * duplicated — the two describe the same wire entity.
 *
 * CR PRD1042-1794 removed the product layer from the document side entirely: `catalog_type`,
 * `product_template_id`, `source_layer` and `governance_classification` no longer exist on the
 * wire (see catalog_schemas.py / requirement_schemas.py), and `conditional` was dropped from the
 * requirement classification enum. None of them are declared here anymore.
 *
 * PRD1042-1794 DRC usability: the required-document set is keyed by CASE TYPE, not process
 * context. The catalog itself no longer carries an applicability axis (it is just name + validity);
 * a requirement declares which case types it applies to via `applicable_case_types`, and the
 * runtime surface resolves the set for a case's own `case_type`. `process_context` is retired
 * throughout — see the cases feature's `CaseTypeSchema` for the seven authoritative values.
 */

// The seven case-type values, reused from the cases feature rather than redefined — a requirement's
// applicability axis is exactly the case's own type, so there is one source of truth for the enum.
export { CaseTypeSchema }
export type { CaseType } from "@/features/cases/api/schema"

export const DocumentRequirementCatalogListItemSchema = z.object({
  id: z.string().uuid(),
  catalog_name: z.string(),
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

// POST /tenants/{tenant_id}/document-requirement-catalogs — mirrors CreateCatalogRequest. CR-1794
// removed the product layer, so there is no catalog_type / product_template_id to send; the DRC
// usability change retired the catalog's applicability axis too — a catalog is now just name +
// validity, and the case-type axis lives on the requirement.
export const CreateDocumentRequirementCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200),
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
export const RequirementClassificationSchema = z.enum(["mandatory", "optional"])
export type RequirementClassification = z.infer<
  typeof RequirementClassificationSchema
>

export const StageCategorizationSchema = z.enum([
  "submission",
  "approval",
  "disbursement_readiness",
])
export type StageCategorization = z.infer<typeof StageCategorizationSchema>

// PRD1042-1794 Block 10 — the tenant's document-type registry. A requirement names a document type
// by `type_code`, and `fulfilment_service` matches an arriving document against that same code, so a
// code that is not in the registry produces a requirement nothing can ever fulfil. Authoring picks
// from here rather than typing a code.
//
// Note the origin vocabularies differ and must not be conflated: the registry says
// `requested | generated`, a requirement's own `document_origin` says `uploaded | generated`. Any
// mapping between them belongs to the backend, so nothing here derives one.
export const DocumentTypeOriginSchema = z.enum(["requested", "generated"])
export type DocumentTypeOrigin = z.infer<typeof DocumentTypeOriginSchema>

export const DocumentRoleScopeSchema = z.enum(["lessee", "guarantor", "case"])
export type DocumentRoleScope = z.infer<typeof DocumentRoleScopeSchema>

export const DocumentTypeSchema = z.object({
  id: z.string().uuid(),
  type_code: z.string(),
  type_name: z.string(),
  role_scope: DocumentRoleScopeSchema,
  origin: DocumentTypeOriginSchema,
  note: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type DocumentType = z.infer<typeof DocumentTypeSchema>

export const DocumentTypeListResponseSchema = z.object({
  items: z.array(DocumentTypeSchema),
  total: z.number().int(),
})
export type DocumentTypeListResponse = z.infer<
  typeof DocumentTypeListResponseSchema
>

// POST /tenants/{tenant_id}/document-types — create a registry entry. Mirrors the backend
// CreateDocumentTypeRequest: type_code and origin are set once here and are immutable afterwards
// (the PATCH contract omits both). `origin` defaults to `requested`.
export const CreateDocumentTypeRequestSchema = z.object({
  type_code: z.string().min(1).max(100),
  type_name: z.string().min(1).max(255),
  role_scope: DocumentRoleScopeSchema,
  origin: DocumentTypeOriginSchema.default("requested"),
  note: z.string().nullable().optional(),
})
export type CreateDocumentTypeRequest = z.infer<
  typeof CreateDocumentTypeRequestSchema
>

// PATCH /tenants/{tenant_id}/document-types/{id} — edit a registry entry. All fields optional;
// type_code and origin are immutable and therefore absent. `is_active` carries the
// deactivate/reactivate row action.
export const UpdateDocumentTypeRequestSchema = z.object({
  type_name: z.string().min(1).max(255).optional(),
  role_scope: DocumentRoleScopeSchema.optional(),
  note: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})
export type UpdateDocumentTypeRequest = z.infer<
  typeof UpdateDocumentTypeRequestSchema
>

export const DocumentOriginSchema = z.enum(["uploaded", "generated"])
export type DocumentOrigin = z.infer<typeof DocumentOriginSchema>

// `applicability` and `condition` were removed from the document side under CR PRD1042-1794 A4
// (12 Aug 2026): conditions live only on the workflow step, and nothing on the document side
// evaluates a rule. `blocks_submission` went with the CR's later decision that membership is the
// only carrier of "required" — a mandatory member blocks when missing, so there is no separate
// flag (see surface_service's is_blocking derivation). All three are absent from the contract; the
// schemas below no longer declare them.

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
  applicable_case_types: z.array(z.string()),
  stage_categorization: StageCategorizationSchema.nullable(),
  document_origin: DocumentOriginSchema,
  is_active: z.boolean(),
  sort_order: z.number(),
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
  // At least one case type is required on create for a mandatory requirement — the resolution key
  // the runtime surface matches a case's own `case_type` against.
  applicable_case_types: z.array(z.string()).min(1),
  stage_categorization: StageCategorizationSchema.nullable().optional(),
  document_origin: DocumentOriginSchema.default("uploaded"),
  sort_order: z.number().int().default(0),
})

// POST .../requirements — mirrors AddRequirementRequest. The condition/applicability cross-field
// rule that used to live here went with the fields themselves (CR A4): there is nothing on the
// document side for a rule to be consistent with.
export const AddRequirementRequestSchema = RequirementRequestFieldsSchema
export type AddRequirementRequest = z.infer<typeof AddRequirementRequestSchema>

// PATCH /document-requirements/{id} — mirrors UpdateRequirementRequest: requirement_code and
// document_type_code are immutable once created, so the edit form must not offer them.
export const UpdateRequirementRequestSchema =
  RequirementRequestFieldsSchema.omit({
    requirement_code: true,
    document_type_code: true,
  }).partial()
export type UpdateRequirementRequest = z.infer<
  typeof UpdateRequirementRequestSchema
>

// PATCH /document-requirement-catalogs/{id} — mirrors UpdateCatalogRequest.
export const UpdateDocumentRequirementCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200).optional(),
  valid_from: z.string().nullable().optional(),
  valid_to: z.string().nullable().optional(),
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

// ── D-11: what a case requires (PRD1042-1796 item 5) ────────────────────────────────────────
//
// GET /document-requirement-catalogs/{id}/objects/{object_id}/requirements. Resolved from the
// case's own `case_type`: the runtime surface returns the requirement set that applies to that case
// type, and each row carries the case types it applies to. Omitting the case type spans the whole
// catalogue.
// The statuses the backend defines today (waived / overridden / not_applicable are post-MVP). Used
// for labelling and styling only — the row's own `fulfilment_status` is parsed as a plain string so
// a status added on the backend widens this screen instead of breaking it.
export const FulfilmentStatusSchema = z.enum([
  "missing",
  "uploaded_pending_review",
  "fulfilled",
  "rejected",
])
export type FulfilmentStatus = z.infer<typeof FulfilmentStatusSchema>

export const RuntimeRequirementItemSchema = z.object({
  requirement_definition_id: z.string().uuid(),
  requirement_code: z.string(),
  document_type_name: z.string(),
  classification: z.string(),
  stage_categorization: z.string().nullable(),
  // Kept as a plain string rather than FulfilmentStatusSchema: the backend types it `str`, and a
  // status added there must widen this screen's rendering, never fail its parse.
  fulfilment_status: z.string(),
  is_blocking: z.boolean(),
  document_origin: z.string(),
  // The case types this requirement applies to. Kept optional/defaulted so this screen parses the
  // runtime response and degrades gracefully when the backend omits it.
  applicable_case_types: z.array(z.string()).optional().default([]),
  linked_document_id: z.string().uuid().nullable().optional(),
})
export type RuntimeRequirementItem = z.infer<
  typeof RuntimeRequirementItemSchema
>

export const RuntimeRequirementSurfaceResponseSchema = z.object({
  catalog_id: z.string().uuid(),
  business_object_id: z.string().uuid(),
  // The case type the set was resolved for. Null when none was named: the response spans the
  // catalogue.
  case_type: z.string().nullable(),
  completeness_summary: z.string(),
  requirements: z.array(RuntimeRequirementItemSchema),
})
export type RuntimeRequirementSurfaceResponse = z.infer<
  typeof RuntimeRequirementSurfaceResponseSchema
>
