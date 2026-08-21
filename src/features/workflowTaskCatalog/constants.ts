// Select-option labels for the Workflow Task Catalog, plus the one shared status-pill class
// string its badges have in common.
// Every wire enum lives in api/schema.ts as the single source of truth per
// .claude/rules/enums-and-constants.md §3; this file only maps those values to i18n label keys
// so a dropdown can render them. No placeholder data remains: both screens read the API.

// Shared by this feature's three tinted status pills — the catalogue state badge, the task
// type badge, and the two case-checklist badges. Extracted per code-review.md §10 (a Tailwind
// string repeated across 3+ components). Deliberately NOT shadcn's <Badge>: its base sets
// h-5 / rounded-4xl / border / px-2, so adopting it would change the rendered pill.
// Per-status colour tints stay with each badge; only the geometry is shared.
export const STATUS_PILL_CLASSES =
  "inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"

import {
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogStateSchema,
  LayerActionSchema,
  StageCategorizationSchema,
  TaskCategorySchema,
  TaskResponsibleRoleSchema,
  TaskTypeSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import {
  PhaseGateStatusSchema,
  SettableChecklistItemStatusSchema,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type {
  CatalogEntityType,
  CatalogLayer,
  CatalogState,
} from "@/features/workflowTaskCatalog/api/schema"

export const CATALOG_LAYER_OPTIONS = [
  {
    value: CatalogLayerSchema.enum.global_default,
    labelKey: "catalogLayers.global_default",
  },
  {
    value: CatalogLayerSchema.enum.product_specific,
    labelKey: "catalogLayers.product_specific",
  },
] as const

export const ENTITY_TYPE_OPTIONS = [
  {
    value: CatalogEntityTypeSchema.enum.refinancing_request,
    labelKey: "entityTypes.refinancing_request",
  },
  {
    value: CatalogEntityTypeSchema.enum.financing,
    labelKey: "entityTypes.financing",
  },
  {
    value: CatalogEntityTypeSchema.enum.redemption_request,
    labelKey: "entityTypes.redemption_request",
  },
] as const

export const CATALOG_STATE_OPTIONS = [
  { value: CatalogStateSchema.enum.draft, labelKey: "catalogStates.draft" },
  { value: CatalogStateSchema.enum.active, labelKey: "catalogStates.active" },
  {
    value: CatalogStateSchema.enum.suspended,
    labelKey: "catalogStates.suspended",
  },
  {
    value: CatalogStateSchema.enum.archived,
    labelKey: "catalogStates.archived",
  },
] as const

// Version state is gone — it has no wire concept at all; versioning is a hidden implementation
// detail with a single active version (BE detail_service.py), and US 15.22's November scope note
// removes the version-state columns and filters outright.
// productTemplate holds Product Template UUIDs (the `product_template_id` query param), not names.
export type WorkflowTaskCatalogFilterState = {
  catalogLayer: CatalogLayer[]
  entityType: CatalogEntityType[]
  productTemplate: string[]
  catalogState: CatalogState[]
}

// The three change types a product-specific catalogue can author. `defined` is absent by
// design: it is the Global Default layer's own entry, never a product's change (the BE rejects
// the mismatch with WTC_TASK_LAYER_MISMATCH).
export const PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS = [
  {
    value: LayerActionSchema.enum.override,
    labelKey: "detail.taskDefinitions.types.override",
  },
  {
    value: LayerActionSchema.enum.deactivated,
    labelKey: "detail.taskDefinitions.types.deactivated",
  },
  {
    value: LayerActionSchema.enum.supplement,
    labelKey: "detail.taskDefinitions.types.supplement",
  },
] as const

export const TASK_CATEGORY_OPTIONS = TaskCategorySchema.options.map(value => ({
  value,
  labelKey: `detail.taskSheet.categories.${value}` as const,
}))

// Required for defined/supplement, forbidden on override/deactivated — same authorability
// class as category (task_service._OVERRIDE_FORBIDDEN_ON_UPDATE /
// _DEACTIVATE_FORBIDDEN_ON_UPDATE both include task_type in ../refinext-api).
export const TASK_TYPE_OPTIONS = TaskTypeSchema.options.map(value => ({
  value,
  labelKey: `detail.taskSheet.taskTypes.${value}` as const,
}))

// Accountability only — runtime task assignment is owned by the Workflow Engine.
export const TASK_RESPONSIBLE_ROLE_OPTIONS =
  TaskResponsibleRoleSchema.options.map(value => ({
    value,
    labelKey: `detail.taskSheet.responsibleRoles.${value}` as const,
  }))

export const TASK_STAGE_OPTIONS = StageCategorizationSchema.options.map(
  value => ({
    value,
    labelKey: `detail.taskSheet.stages.${value}` as const,
  })
)

// --- Runtime: case checklist + phase gates ---

// What a case worker can set an OPEN item to. `open` is absent because it is not settable — the
// service rejects it with WTC_CHECKLIST_ITEM_IMMUTABLE along with any other re-set, so offering it
// would be offering an action the backend refuses.
export const SETTABLE_CHECKLIST_ITEM_STATUS_OPTIONS =
  SettableChecklistItemStatusSchema.options.map(value => ({
    value,
    labelKey: `caseChecklist.itemStatuses.${value}` as const,
  }))

// Every gate status is settable; the service's only rule is that `approved` is terminal and
// `rejected` may be reopened, which is enforced per-gate at the call site rather than by trimming
// this list.
export const PHASE_GATE_STATUS_OPTIONS = PhaseGateStatusSchema.options.map(
  value => ({
    value,
    labelKey: `caseChecklist.gateStatuses.${value}` as const,
  })
)

// The six phases a gate can exist on, in process order. Rendered as the panel's rows so a phase
// with no gate is still visible — the wire enum is a closed set (StageCategorization), and
// `.options` preserves the declaration order, which is the process order.
export const CASE_PHASE_ORDER = StageCategorizationSchema.options
