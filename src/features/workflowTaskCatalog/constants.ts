// Select-option labels for the Workflow Task Catalog — nothing else.
// Every wire enum lives in api/schema.ts as the single source of truth per
// .claude/rules/enums-and-constants.md §3; this file only maps those values to i18n label keys
// so a dropdown can render them. No placeholder data remains: both screens read the API.

import {
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogStateSchema,
  LayerActionSchema,
  StageCategorizationSchema,
  TaskCategorySchema,
  TaskResponsibleRoleSchema,
} from "@/features/workflowTaskCatalog/api/schema"
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
  { value: CatalogStateSchema.enum.active, labelKey: "catalogStates.active" },
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
