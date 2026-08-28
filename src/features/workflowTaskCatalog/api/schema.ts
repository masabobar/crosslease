import { z } from "zod"
import { UserRoleSchema } from "@/features/users/api/schema"

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
// (CatalogEntityType). Since PRD1042-1917 OQ-01 (closed 19 Aug 2026) the enum lives in the BE's
// cases module and ALL SEVEN case types carry a catalogue — the earlier "only main_process and
// package_redemption have a checklist" gate (`TYPED_CASE_TYPES`) is gone, so nothing here may key
// off a fixed subset. Financing is deliberately not a case type — it has actions, not a workflow,
// and cannot own a catalogue.
//
// `main_process` was renamed `refinancing_request` by the same change: "Main process" is the
// client's name for the 44-step *catalogue*, while the *case type* is the refinancing request,
// which is what the epic's acceptance criteria and permission matrices call it. The BE migration
// (case1917b01) rewrote the stored rows, so the old value no longer exists on the wire and keeping
// it here cost every catalogue list a ZodError against a 200 response.
export const CaseTypeSchema = z.enum([
  "refinancing_request",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
export type CaseType = z.infer<typeof CaseTypeSchema>

// The entity types a catalogue can actually carry. `financing` cannot: PRD1042-1790 removed it as
// a case type — it is a resolution input carrying the product reference, and its steps are stages
// inside the Main Refinancing Process catalogue — so no case type derives it and no catalogue can
// hold it. Excluded rather than re-listed (one source of truth per enums-and-constants.md §3).
// Used by the list filter; the create dialog asks for a case type instead.
export const CatalogOwningEntityTypeSchema = CatalogEntityTypeSchema.exclude([
  "financing",
])
export type CatalogOwningEntityType = z.infer<
  typeof CatalogOwningEntityTypeSchema
>

// PRD1042-1790 item 1 — the case types a catalogue may be scoped to, as GET
// /workflow-task-catalogs/case-types reports them. Read rather than re-listed: AC-94 fails an
// implementation wired to a fixed count of case types, so the create dialog offers exactly what
// this returns and a third case type needs no frontend release. `entity_type` is the coarse object
// the case type derives — display only, never part of the create request.
//
// This replaces a client-side CASE_TYPE_BY_ENTITY_TYPE map: inverting the BE's own derivation here
// meant the user picked an entity type, of which there are three, to reach a case type, of which
// there are seven — so four case types were unreachable by construction.
export const CatalogCaseTypeItemSchema = z.object({
  case_type: CaseTypeSchema,
  // Nullable, and usually null: only three case types derive an entity type
  // (CASE_TYPE_ENTITY_TYPE in the BE's enums.py) — lessee_change, object_swap, extension and
  // asset_event derive none, and the route sends `.get(ct)`, i.e. null, for those four. Required
  // here before PRD1042-1917, which is why the create dialog's case-type list broke as soon as
  // all seven were returned.
  entity_type: CatalogEntityTypeSchema.nullable(),
})
export type CatalogCaseTypeItem = z.infer<typeof CatalogCaseTypeItemSchema>

export const CatalogCaseTypeListSchema = z.array(CatalogCaseTypeItemSchema)

// GET /workflow-task-catalogs/field-registry — the fields a condition row may test, as a bare
// array. Fetched only to turn a `condition_rows[].field_registry_id` into the `label` a reader can
// understand; without it the applicability rules render as UUIDs. `data_available` reports whether
// the platform can actually evaluate the field yet, which is worth showing next to a rule built on
// one that cannot.
export const FieldRegistryItemSchema = z.object({
  id: z.string().uuid(),
  field_key: z.string(),
  field_type: z.string(),
  label: z.string(),
  data_available: z.boolean(),
})
export type FieldRegistryItem = z.infer<typeof FieldRegistryItemSchema>

export const FieldRegistryListSchema = z.array(FieldRegistryItemSchema)

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

// PRD1042-1892 item 13 (client answer, 17 Aug) — a step's responsible role is a SET of platform
// UserRole values, narrowed to the operational bank roles that act on a case. Mirrors the BE's
// `STEP_RESPONSIBLE_ROLES` (workflow_task_catalog/domain/enums.py), which its authoring validator
// enforces. Extracted from the canonical `UserRoleSchema` rather than retyped, so a change to the
// platform roles cannot leave this list behind. This retires `TaskResponsibleRoleSchema` above for
// authoring — that enum is a different domain (it carries `compliance`, `system`, …) and stays only
// to read historical rows.
export const StepResponsibleRoleSchema = UserRoleSchema.extract([
  "front_office",
  "back_office",
])
export type StepResponsibleRole = z.infer<typeof StepResponsibleRoleSchema>

// PRD1042-1894 Block 5 — the permitted outcomes of a state_transition task. A per-task set, not a
// value set of the type: main process step 4 carries all four.
export const StateTransitionOutcomeSchema = z.enum([
  "committed",
  "rejected",
  "missing_information",
  "rework",
])
export type StateTransitionOutcome = z.infer<
  typeof StateTransitionOutcomeSchema
>

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
// PRD1042-1892 item 5 — SEVEN types. `four_eyes_sign_off` was removed: four eyes is a flag on the
// task plus its exclusion set, not a kind of work ("this replaces the earlier line that four-eyes
// was a type of task"). The BE enum dropped it, so offering it here only ever bought a 422.
export const TaskTypeSchema = z.enum([
  "checkbox",
  "typed_upload",
  "generated_document",
  "calculation",
  "external_handover",
  "field_capture",
  "state_transition",
])
export type TaskType = z.infer<typeof TaskTypeSchema>

// PRD1042-1790 items 3/4 — WHEN a task applies, as against what kind of work it is (TaskType).
// `always` is unconditional; `rule` is driven by the task's `condition_rows`; `person` means a
// human decides per case. A GD-layer task the author leaves unset is stored as `always` by the
// service, so null here means a legacy row rather than "no answer".
export const TaskApplicabilitySchema = z.enum(["always", "rule", "person"])
export type TaskApplicability = z.infer<typeof TaskApplicabilitySchema>

// The comparison a condition row applies to its field. Read-only in this app: the rows are
// authored through a field-registry picker that does not exist yet (see the note on
// ConditionRowItemSchema), so these values are displayed and never offered.
export const ConditionOperatorSchema = z.enum([
  "is",
  "is_not",
  "greater_than",
  "less_than",
  "at_least",
  "at_most",
])
export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>

// PRD1042-1894 — the ordered documents a `typed_upload` task asks the worker to check off. The
// runtime counterpart is ChecklistItemCheckResponse in runtimeSchema.ts: one materialised check
// per row, carrying the worker's mark.
export const DocumentCheckItemSchema = z.object({
  document_ref: z.string().uuid(),
  position: z.number().int(),
})
export type DocumentCheckItem = z.infer<typeof DocumentCheckItemSchema>

// The rows behind `applicability: "rule"`. `value_raw` and `value_config_ref` are alternatives —
// a literal to compare against, or a reference to a configured value — and the BE sends both keys
// with one of them null.
export const ConditionRowItemSchema = z.object({
  field_registry_id: z.string().uuid(),
  operator: ConditionOperatorSchema,
  value_raw: z.string().nullable().optional(),
  value_config_ref: z.string().uuid().nullable().optional(),
})
export type ConditionRowItem = z.infer<typeof ConditionRowItemSchema>

// PRD1042-1892 item 2 — the stages of a catalogue are the bank's own, not a platform list. A Bank
// Admin creates, names, orders and removes them, and every task belongs to one. These mirror
// phase_schemas.py; a phase belongs to a catalogue VERSION, so every call carries the version id.
//
// Note the vocabulary: the BE calls these `phases` on the wire and the CR calls them stages. The
// wire name is kept here verbatim (enums-and-constants.md §2) and the UI labels say stage.
export const CataloguePhaseSchema = z.object({
  id: z.string().uuid(),
  catalog_version_id: z.string().uuid(),
  name: z.string(),
  position: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type CataloguePhase = z.infer<typeof CataloguePhaseSchema>

// GET .../phases returns a bare array, not an envelope-wrapped page.
export const CataloguePhaseListSchema = z.array(CataloguePhaseSchema)

// `position` is optional on create — the BE appends at max+1 when omitted, which is what the
// panel relies on rather than computing a position client-side.
export const CreatePhaseRequestSchema = z.object({
  name: z.string().min(1).max(80),
  position: z.number().int().min(1).optional(),
})
export type CreatePhaseRequest = z.infer<typeof CreatePhaseRequestSchema>

export const UpdatePhaseRequestSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  position: z.number().int().min(1).optional(),
})
export type UpdatePhaseRequest = z.infer<typeof UpdatePhaseRequestSchema>

// A full permutation of this version's phase ids, in the order wanted.
export const ReorderPhasesRequestSchema = z.object({
  ordered_phase_ids: z.array(z.string().uuid()).min(1),
})
export type ReorderPhasesRequest = z.infer<typeof ReorderPhasesRequestSchema>

// DELETE .../phases/{id} — `removed: false` with `tasks_in_phase > 0` means the caller must
// re-request with confirm=true. The panel turns that into a confirmation naming the count.
export const RemovePhaseResponseSchema = z.object({
  phase_id: z.string().uuid(),
  tasks_in_phase: z.number().int(),
  removed: z.boolean(),
})
export type RemovePhaseResponse = z.infer<typeof RemovePhaseResponseSchema>

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
  valid_from: z.string().nullable(),
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
  // PRD1042-2150 — the creation wizard no longer asks for a validity window and the backend
  // no longer requires one, so neither date is part of the create contract.
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
  valid_from: z.string().nullable(),
  valid_until: z.string().nullable(),
  description: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  current_version_id: z.string().uuid().nullable().optional(),
  warnings: z.array(z.string()).default([]),
})
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>

// POST /workflow-task-catalogs/{id}/suspend — mirrors SuspendCatalogResponse. Suspending is
// never blocked, so this is a report rather than a decision: it names the cases already resolved
// against the catalogue so the action is not silent (PRD1042-1894 Block 8 AC §7).
// `catalog_state` is typed as a bare string on the wire (the route passes the ORM column
// straight through) but the service only ever sets `suspended` here, so it is parsed as the
// closed enum — a drift should surface rather than reach the UI as an unknown state.
export const SuspendCatalogResponseSchema = z.object({
  catalog_id: z.string().uuid(),
  catalog_state: CatalogStateSchema,
  product_template_id: z.string().uuid().nullable(),
  affected_case_ids: z.array(z.string().uuid()),
})
export type SuspendCatalogResponse = z.infer<
  typeof SuspendCatalogResponseSchema
>

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
  // The parent's role SET. Required on the wire and previously absent here, so an override row
  // could show the inherited name/mandatory/weight but never the roles it was replacing — the one
  // value US 15.23 most often asks about. Read as the full platform enum for the reason given on
  // TaskDefinitionItemSchema.responsible_roles below.
  responsible_roles: z.array(UserRoleSchema).nullable(),
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
  // Server-assigned, stable within a catalogue, and the number the bank actually says out loud
  // ("step 4 rejects"). Not authorable — it is absent from AddTaskRequest — so the table shows it
  // and the sheet does not offer it. Null on rows created before it existed.
  task_number: z.number().int().nullable(),
  task_code: z.string().nullable(),
  task_name: z.string().nullable(),
  task_description: z.string().nullable(),
  category: TaskCategorySchema.nullable(),
  // `responsible_role` is the retired singular, still sent for rows authored before 17 Aug;
  // `responsible_roles` is what new authoring writes. A row carries one or the other.
  responsible_role: TaskResponsibleRoleSchema.nullable(),
  // Read as the FULL platform role enum, which is what the wire declares (`list[UserRole]`), not
  // the narrowed authoring set. The BE's `_validate_step_roles` restricts what may be *written* to
  // front_office/back_office, but nothing restricts what a stored row may contain — so narrowing
  // the read schema made one unexpected role enough to fail the whole detail page with a ZodError
  // against a 200. Authoring stays narrow via StepResponsibleRoleSchema on AddTaskRequest below.
  responsible_roles: z.array(UserRoleSchema).nullable(),
  is_mandatory: z.boolean().nullable(),
  // Decimal on the BE, so it arrives as a string.
  weight: z.coerce.number().nullable(),
  display_order: z.number().int().nullable(),
  stage_categorization: StageCategorizationSchema.nullable(),
  applicable_process_contexts: z.array(TaskProcessContextSchema).nullable(),
  is_active: z.boolean(),
  parent_task_id: z.string().uuid().nullable(),
  // PRD1042-1892 item 2 — the stage the task sits in. Null on override/deactivated rows, which
  // inherit the parent's stage, and on rows authored before stages existed (no backfill).
  phase_id: z.string().uuid().nullable(),
  // PRD1042-1894 Block 5 — per-type configuration. Each is null unless the task's type uses it:
  // generate → generated_document_ref + trigger_event; state_transition → permitted_outcomes +
  // lifecycle_entity; capture → capture_section_name. Upload reuses doc_requirement_ref below.
  generated_document_ref: z.string().uuid().nullable(),
  trigger_event: z.string().nullable(),
  permitted_outcomes: z.array(StateTransitionOutcomeSchema).nullable(),
  lifecycle_entity: z.string().nullable(),
  capture_section_name: z.string().nullable(),
  doc_requirement_ref: z.string().uuid().nullable(),
  doc_requirement_pin_mode: DocRequirementPinModeSchema.nullable(),
  conditional_trigger: ConditionalTriggerSchema.nullable(),
  task_type: TaskTypeSchema.nullable(),
  // PRD1042-1790 items 3/4 — when the task applies. Sits beside task_type (what kind of work it
  // is) and is a GD-level attribute: authorable on defined/supplement, inherited on override and
  // refused on deactivated (task_schemas.py Gap 2/Gap 3).
  applicability: TaskApplicabilitySchema.nullable(),
  // PRD1042-1894 Block 3 / 1892 item 5 — four eyes is a FLAG plus its exclusion set, not a task
  // type (which is why `four_eyes_sign_off` was dropped from TaskTypeSchema). `exclusion_task_ids`
  // names the tasks whose closer may not also close this one; `four_eyes_exclusion_wide` widens
  // that to the whole catalogue. All three are non-nullable arrays/booleans on the wire.
  four_eyes: z.boolean(),
  exclusion_task_ids: z.array(z.string().uuid()),
  four_eyes_exclusion_wide: z.boolean(),
  // Sub-rows the service writes through their own code paths (`_set_condition_rows` and the
  // document-check equivalent), which is why they are read here but absent from AddTaskRequest.
  document_checks: z.array(DocumentCheckItemSchema),
  condition_rows: z.array(ConditionRowItemSchema),
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
  // PRD1042-1790 item 1 — the scope key. `entity_type` beside it is the derived object and
  // the old name for this axis; both are returned and they are not interchangeable.
  case_type: CaseTypeSchema.nullable(),
  entity_type: CatalogEntityTypeSchema.nullable(),
  entity_id: z.string().uuid().nullable(),
  valid_from: z.string().nullable(),
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
  // The BE's AddTaskRequest.validate_action_constraints counts `responsible_roles` among the
  // fields a defined/supplement task must carry — the legacy singular no longer satisfies it.
  responsible_roles: z.array(StepResponsibleRoleSchema).min(1).optional(),
  is_mandatory: z.boolean().optional(),
  weight: z.number().min(0).optional(),
  display_order: z.number().int().min(0).optional(),
  stage_categorization: StageCategorizationSchema.optional(),
  applicable_process_contexts: z.array(TaskProcessContextSchema).optional(),
  is_active: z.boolean().optional(),
  parent_task_id: z.string().uuid().optional(),
  // Mandatory for defined/supplement — task_service.py refuses those with no phase_id
  // (422 WTC_TASK_PHASE_REQUIRED). Override/deactivated inherit the parent's stage.
  phase_id: z.string().uuid().optional(),
  // PRD1042-1894 Block 5 — the type's own parameters. The endpoint accepts a task without them,
  // but `_activation_blockers` then refuses the catalogue: a generate task needs its document and
  // trigger event, a state_transition its outcomes and entity. Optional here because the type
  // decides which apply; the form requires the ones the chosen type needs (taskFormSchema).
  generated_document_ref: z.string().uuid().optional(),
  trigger_event: z.string().min(1).max(50).optional(),
  permitted_outcomes: z.array(StateTransitionOutcomeSchema).min(1).optional(),
  lifecycle_entity: z.string().min(1).max(50).optional(),
  capture_section_name: z.string().min(1).max(100).optional(),
  doc_requirement_ref: z.string().uuid().optional(),
  doc_requirement_pin_mode: DocRequirementPinModeSchema.optional(),
  conditional_trigger: ConditionalTriggerSchema.optional(),
  task_type: TaskTypeSchema.optional(),
  // PRD1042-1790 items 3/4 — authorable on defined/supplement only. Sending it on an override or a
  // deactivate row is rejected outright ("Fields not authorable on Override"), so the sheet omits
  // the key for those actions rather than sending a null. Left unset on a GD action, the service
  // stores `always`.
  applicability: TaskApplicabilitySchema.optional(),
  // PRD1042-1894 Block 3 — both are plain booleans with a `false` default on the wire, and neither
  // appears in the BE's override/deactivate forbidden sets, so an override may change them too.
  // The exclusion SET itself is not here: the service writes it through a separate path and
  // authoring it needs a task picker this screen does not have (read-only for now).
  four_eyes: z.boolean().optional(),
  four_eyes_exclusion_wide: z.boolean().optional(),
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
