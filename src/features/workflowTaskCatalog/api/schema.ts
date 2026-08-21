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

// PRD1042-1894 Block 8 (AC §7) — the catalogue lifecycle: Draft → Active → Suspended, and
// back (reactivate). A new catalogue starts DRAFT (never resolved by a case); activate runs
// the validator and, on success, makes it the one resolved for its case type + product; an
// Active catalogue can be suspended (stops resolving for new cases, nothing deleted) and
// reactivated. ARCHIVED is a reserved post-MVP terminal, not reachable through this flow.
// Supersedes the older "created directly ACTIVE, no draft, no transitions" model — see
// the activate/{catalog_id}/activate, /suspend, /reactivate endpoints in openapi.json.
export const CatalogStateSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "archived",
])
export type CatalogState = z.infer<typeof CatalogStateSchema>

// PRD1042-1790 item 1 — the process a case runs, distinct from the object it runs on
// (CatalogEntityType). Seven case types exist; only the two below (main_process,
// package_redemption) carry a checklist in the November MVP. The other five run without a
// catalogue and nothing is built to give them one (out of scope). Financing is deliberately
// not a case type — it has actions, not a workflow, and cannot own a catalogue.
export const CaseTypeSchema = z.enum([
  "main_process",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
export type CaseType = z.infer<typeof CaseTypeSchema>

// The four product-specific change types CR PRD1042-1554 B2 requires, as the wire spells them.
// `defined` is the Global Default layer's own entry; the other three are the product's changes.
export const LayerActionSchema = z.enum([
  "defined",
  "override",
  "deactivated",
  "supplement",
])
export type LayerAction = z.infer<typeof LayerActionSchema>

export const TaskCategorySchema = z.enum([
  "legal",
  "compliance",
  "credit",
  "operations",
  "treasury",
  "documentation",
  "other",
])
export type TaskCategory = z.infer<typeof TaskCategorySchema>

// Accountability only — deliberately NOT the auth UserRole enum. Different domain, and it
// carries values (back_office_risk, compliance, system) that no user role has.
export const TaskResponsibleRoleSchema = z.enum([
  "front_office",
  "back_office_risk",
  "compliance",
  "legal",
  "treasury",
  "support",
  "system",
])
export type TaskResponsibleRole = z.infer<typeof TaskResponsibleRoleSchema>

export const StageCategorizationSchema = z.enum([
  "pre_submission",
  "stage_1_review",
  "stage_2_review",
  "pre_disbursement",
  "servicing",
  "redemption",
])
export type StageCategorization = z.infer<typeof StageCategorizationSchema>

export const TaskProcessContextSchema = z.enum([
  "rr_submission",
  "request_approval_readiness",
  "financing_approval_readiness",
  "disbursement_readiness",
  "stage_1_review",
  "stage_2_review",
  "conditions_follow_up",
  "servicing",
  "redemption",
])
export type TaskProcessContext = z.infer<typeof TaskProcessContextSchema>

export const DocRequirementPinModeSchema = z.enum([
  "pin_by_id",
  "pin_by_version",
])
export type DocRequirementPinMode = z.infer<typeof DocRequirementPinModeSchema>

export const ConditionalTriggerSchema = z.enum([
  "financing_amount_over_threshold",
])
export type ConditionalTrigger = z.infer<typeof ConditionalTriggerSchema>

// What the task demands from the worker, distinct from TaskCategory (a subject-area
// classification) — decides what opens for the worker and how the task closes.
export const TaskTypeSchema = z.enum([
  "checkbox",
  "four_eyes_sign_off",
  "typed_upload",
  "generated_document",
  "calculation",
  "external_handover",
  "field_capture",
  "state_transition",
])
export type TaskType = z.infer<typeof TaskTypeSchema>

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
  case_type: CaseTypeSchema.nullable(),
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
// entity_type is no longer part of this request (PRD1042-1790 item 1) — the backend derives
// it from case_type and returns it on the response schemas below instead. entity_id must
// still be null for global_default and is required for product_specific
// (catalog_schemas.py validate_product_specific_fields).
export const CreateCatalogRequestSchema = z.object({
  catalog_name: z.string().min(1).max(200),
  catalog_layer: CatalogLayerSchema,
  valid_from: z.string(),
  valid_until: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  entity_id: z.string().uuid().nullable().optional(),
  case_type: CaseTypeSchema,
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
  case_type: CaseTypeSchema.nullable(),
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

// The Global Default values sitting behind an override/deactivate row. Present only when the
// task has a parent; every field is required-but-nullable because the parent itself may not
// have set it. This is what makes US 15.23's "override rows show the inherited values
// alongside the override values" possible, and how CR B3/B4 become visible on screen.
export const InheritedGDValuesSchema = z.object({
  task_code: z.string().nullable(),
  task_name: z.string().nullable(),
  task_description: z.string().nullable(),
  category: TaskCategorySchema.nullable(),
  applicable_process_contexts: z.array(TaskProcessContextSchema).nullable(),
  is_mandatory: z.boolean().nullable(),
  weight: z.coerce.number().nullable(),
  responsible_role: TaskResponsibleRoleSchema.nullable(),
  display_order: z.number().int().nullable(),
  stage_categorization: StageCategorizationSchema.nullable(),
  doc_requirement_ref: z.string().uuid().nullable(),
})
export type InheritedGDValues = z.infer<typeof InheritedGDValuesSchema>

// A task row on GET /workflow-task-catalogs/{catalog_id}.
// Note the shape: every field below is REQUIRED on the wire but most are NULLABLE — a
// `deactivated` row legitimately carries null task_name/category/weight, since it only points
// at the parent it switches off. So `.nullable()` on a required key, never `.optional()`.
export const TaskDefinitionItemSchema = z.object({
  id: z.string().uuid(),
  catalog_version_id: z.string().uuid(),
  layer_action: LayerActionSchema,
  task_code: z.string().nullable(),
  task_name: z.string().nullable(),
  task_description: z.string().nullable(),
  category: TaskCategorySchema.nullable(),
  responsible_role: TaskResponsibleRoleSchema.nullable(),
  is_mandatory: z.boolean().nullable(),
  // Decimal on the BE, so it arrives as a string.
  weight: z.coerce.number().nullable(),
  display_order: z.number().int().nullable(),
  stage_categorization: StageCategorizationSchema.nullable(),
  applicable_process_contexts: z.array(TaskProcessContextSchema).nullable(),
  is_active: z.boolean(),
  parent_task_id: z.string().uuid().nullable(),
  doc_requirement_ref: z.string().uuid().nullable(),
  doc_requirement_pin_mode: DocRequirementPinModeSchema.nullable(),
  conditional_trigger: ConditionalTriggerSchema.nullable(),
  task_type: TaskTypeSchema.nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  inherited: InheritedGDValuesSchema.nullable().optional(),
})
export type TaskDefinitionItem = z.infer<typeof TaskDefinitionItemSchema>

// GET /workflow-task-catalogs/{catalog_id} — mirrors CatalogDetailResponse.
// current_version_id is required here (unlike on create) but still nullable, and it is the
// ONLY source of the version_id every task mutation needs. Null means authoring is impossible.
export const CatalogDetailResponseSchema = z.object({
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
  current_version_id: z.string().uuid().nullable(),
  tasks: z.array(TaskDefinitionItemSchema),
})
export type CatalogDetailResponse = z.infer<typeof CatalogDetailResponseSchema>

// GET /workflow-task-catalogs/{catalog_id}/audit-trail.
// event_type and action_type are free-form strings with no enum, so they are displayed through
// a dynamic i18n lookup with the raw value as fallback. There is no actor_type on the wire.
export const AuditTrailEventItemSchema = z.object({
  id: z.string().uuid(),
  event_type: z.string(),
  action_type: z.string(),
  // Not uuid-formatted on the wire, so do not constrain it.
  actor_id: z.string(),
  actor_role_at_time: z.string().nullable(),
  actor_display: z.string().nullable(),
  recorded_at: z.string(),
  entity_display: z.string().nullable(),
  old_data: z.record(z.string(), z.unknown()).nullable(),
  new_data: z.record(z.string(), z.unknown()).nullable(),
  changed_fields: z.array(z.string()).nullable(),
})
export type AuditTrailEventItem = z.infer<typeof AuditTrailEventItemSchema>

// Cursor-paginated, newest first — `events`/`next_cursor`, NOT the items/total/page envelope
// the catalogue list uses. per_page is capped at 50 server-side.
export const AuditTrailResponseSchema = z.object({
  events: z.array(AuditTrailEventItemSchema),
  next_cursor: z.string().nullable().optional(),
})
export type AuditTrailResponse = z.infer<typeof AuditTrailResponseSchema>

// POST .../versions/{version_id}/tasks — only layer_action is required; the BE decides which
// of the rest are mandatory from the layer_action and rejects with WTC_TASK_LAYER_MISMATCH.
export const AddTaskRequestSchema = z.object({
  layer_action: LayerActionSchema,
  task_code: z.string().min(1).max(100).optional(),
  task_name: z.string().min(1).max(300).optional(),
  task_description: z.string().optional(),
  category: TaskCategorySchema.optional(),
  responsible_role: TaskResponsibleRoleSchema.optional(),
  is_mandatory: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  display_order: z.number().int().min(0).optional(),
  stage_categorization: StageCategorizationSchema.optional(),
  applicable_process_contexts: z.array(TaskProcessContextSchema).optional(),
  is_active: z.boolean().optional(),
  parent_task_id: z.string().uuid().optional(),
  doc_requirement_ref: z.string().uuid().optional(),
  doc_requirement_pin_mode: DocRequirementPinModeSchema.optional(),
  conditional_trigger: ConditionalTriggerSchema.optional(),
  task_type: TaskTypeSchema.optional(),
})
export type AddTaskRequest = z.infer<typeof AddTaskRequestSchema>

// PATCH .../tasks/{task_id} — deliberately omits layer_action, task_code and parent_task_id.
// Those are immutable once created, so the edit form must not offer them. Nothing is required:
// a PATCH may carry a single field.
export const UpdateTaskRequestSchema = AddTaskRequestSchema.omit({
  layer_action: true,
  task_code: true,
  parent_task_id: true,
}).partial()
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>

// 201 from POST / 200 from PATCH. Same shape as a task row minus `inherited`, plus warnings.
export const TaskResponseWithWarningsSchema = TaskDefinitionItemSchema.omit({
  inherited: true,
}).extend({
  warnings: z.array(z.string()).default([]),
})
export type TaskResponseWithWarnings = z.infer<
  typeof TaskResponseWithWarningsSchema
>
