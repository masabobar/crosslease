// UI-only select-option labels and placeholder data for the Workflow Task Catalog.
// Wire enums live in api/schema.ts — one source of truth per
// .claude/rules/enums-and-constants.md §3; this file only maps them to i18n label keys.
// The PLACEHOLDER_* blocks below back the catalog DETAIL page, which is not wired yet
// (see .project-management/input/open-questions.md Q-024). The list screen reads the API.

import {
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogStateSchema,
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

// Not exported: nothing outside this file consumes the shape any more. The list screen reads
// CatalogListItem from api/schema.ts, and the detail page infers this from the array below.
type WorkflowTaskCatalogRow = {
  id: string
  catalogName: string
  catalogLayer: CatalogLayer
  entityType: CatalogEntityType
  // null for Global Default rows — the Product Template reference is forced null for that
  // layer (CreateCatalogRequest rejects a non-null entity_id on global_default).
  productTemplateName: string | null
  version: string
  publishedAt: string | null
  catalogState: CatalogState
}

// Placeholder rows for the still-unwired DETAIL page only — the list screen reads the API.
// Real catalog ids are UUIDs, so the detail page's id lookup never matches and it falls back
// to the first row; the second row exists so the archived (read-only) path stays reachable.
// Two rows rather than the previous twelve: the ten extra list fixtures became dead weight
// once the list stopped reading them.
export const PLACEHOLDER_CATALOG_ROWS: WorkflowTaskCatalogRow[] = [
  {
    id: "wtc-1",
    catalogName: "Refinancing Rules",
    catalogLayer: CatalogLayerSchema.enum.product_specific,
    entityType: CatalogEntityTypeSchema.enum.refinancing_request,
    productTemplateName: "Mortgage Plus",
    version: "v0.1",
    publishedAt: "2028-12-31",
    catalogState: CatalogStateSchema.enum.active,
  },
  {
    id: "wtc-2",
    catalogName: "Green Energy Finance",
    catalogLayer: CatalogLayerSchema.enum.global_default,
    entityType: CatalogEntityTypeSchema.enum.financing,
    productTemplateName: null,
    version: "v0.1",
    publishedAt: null,
    catalogState: CatalogStateSchema.enum.archived,
  },
]

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

// ─── Catalog Detail page — placeholder data ───
// GET /workflow-task-catalogs/{catalog_id} exists but the detail page is not wired to it
// yet (Q-024): everything below is static data derived from the Figma "True Sale Catalog"
// example, used regardless of the route :id. Wiring it is its own unit — several of these
// fields have no wire source (published at/by, the version label) and the response returns
// created_by/tenant_id as UUIDs rather than display names.

// Fixed lifecycle fields the list row shape doesn't carry (Tenant, Created/Published by).
export const PLACEHOLDER_CATALOG_DETAIL_META = {
  tenantName: "New Group Trade",
  createdAt: "2026-06-12T14:32:00Z",
  createdBy: "Bruce Wayne",
  publishedBy: "Adam Sandler",
  validFrom: "2026-06-13",
  validUntil: null as string | null,
}

export const TASK_DEFINITION_TYPE = {
  GLOBAL: "global",
  OVERRIDE: "override",
  DEACTIVATE: "deactivate",
  SUPPLEMENT: "supplement",
} as const
export type TaskDefinitionType =
  (typeof TASK_DEFINITION_TYPE)[keyof typeof TASK_DEFINITION_TYPE]

// Selectable only for Product-Specific catalogs (Global Default catalogs only ever
// author Global entries) — per PRD1042-1161/1162/1163.
export const PRODUCT_SPECIFIC_TASK_TYPE_OPTIONS = [
  {
    value: TASK_DEFINITION_TYPE.OVERRIDE,
    labelKey: "detail.taskDefinitions.types.override",
  },
  {
    value: TASK_DEFINITION_TYPE.DEACTIVATE,
    labelKey: "detail.taskDefinitions.types.deactivate",
  },
  {
    value: TASK_DEFINITION_TYPE.SUPPLEMENT,
    labelKey: "detail.taskDefinitions.types.supplement",
  },
] as const

// Not exported: consumed only by the *_OPTIONS arrays below. Their derived types
// (TaskCategory, TaskResponsibleRole) are exported because components do use those.
const TASK_CATEGORY = {
  LEGAL: "legal",
  COMPLIANCE: "compliance",
  CREDIT: "credit",
  OPERATIONS: "operations",
  TREASURY: "treasury",
  DOCUMENTATION: "documentation",
  OTHER: "other",
} as const
export type TaskCategory = (typeof TASK_CATEGORY)[keyof typeof TASK_CATEGORY]

export const TASK_CATEGORY_OPTIONS = Object.values(TASK_CATEGORY).map(
  value => ({
    value,
    labelKey: `detail.taskSheet.categories.${value}` as const,
  })
)

// Accountability only — runtime task assignment is owned by the Workflow Engine, per
// PRD1042-1160. Deliberately separate from the auth UserRole enum (different domain).
const TASK_RESPONSIBLE_ROLE = {
  FRONT_OFFICE: "front_office",
  BACK_OFFICE_RISK: "back_office_risk",
  COMPLIANCE: "compliance",
  LEGAL: "legal",
  TREASURY: "treasury",
  SUPPORT: "support",
  SYSTEM: "system",
} as const
export type TaskResponsibleRole =
  (typeof TASK_RESPONSIBLE_ROLE)[keyof typeof TASK_RESPONSIBLE_ROLE]

export const TASK_RESPONSIBLE_ROLE_OPTIONS = Object.values(
  TASK_RESPONSIBLE_ROLE
).map(value => ({
  value,
  labelKey: `detail.taskSheet.responsibleRoles.${value}` as const,
}))

const TASK_STAGE = {
  PRE_SUBMISSION: "pre_submission",
  STAGE_1_REVIEW: "stage_1_review",
  STAGE_2_REVIEW: "stage_2_review",
  PRE_DISBURSEMENT: "pre_disbursement",
  SERVICING: "servicing",
  REDEMPTION: "redemption",
} as const
type TaskStage = (typeof TASK_STAGE)[keyof typeof TASK_STAGE]

export const TASK_STAGE_OPTIONS = Object.values(TASK_STAGE).map(value => ({
  value,
  labelKey: `detail.taskSheet.stages.${value}` as const,
}))

// Figma's "Pinning behavior" radio has no defined semantics in PRD1042-1160..1163 —
// included for visual fidelity only, purely cosmetic in this static shell.
export const DOCUMENT_PINNING_BEHAVIOR = {
  PIN_BY_VERSION: "pin_by_version",
  PIN_BY_ID: "pin_by_id",
} as const
export type DocumentPinningBehavior =
  (typeof DOCUMENT_PINNING_BEHAVIOR)[keyof typeof DOCUMENT_PINNING_BEHAVIOR]

// Placeholder Document Requirement Catalog entries for the "Document requirement ref"
// select — no Document Requirement Catalog endpoint exists yet (see WTC-07).
export const PLACEHOLDER_DOCUMENT_REQUIREMENT_OPTIONS = [
  { value: "DOC-1101", label: "DOC-1101" },
  {
    value: "DOC-FHA-001",
    label: "DOC-FHA-001, FHA registration certificate, active",
  },
  { value: "DOC-KYC-001", label: "DOC-KYC-001, KYC document set, active" },
  {
    value: "DOC-APR-001",
    label: "DOC-APR-001, Underwriter approval pack, active",
  },
] as const

export type PlaceholderTaskDefinition = {
  id: string
  type: TaskDefinitionType
  taskCode: string
  taskName: string
  description: string
  category: TaskCategory | null
  responsibleRole: TaskResponsibleRole | null
  mandatory: boolean | null
  weight: number | null
  displayOrder: number | null
  stage: TaskStage | null
  processContext: string | null
  active: boolean
  documentRequirementRef: string | null
  parentTaskCode: string | null
  parentTaskName: string | null
  inherited: boolean
}

// True Sale Catalog's 4 task definitions, per the Figma "Identity & task definitions"
// tab — one row of each Override Action (Global / Override / Deactivate / Supplement)
// so every visual differentiator from PRD1042-1180 is represented.
export const PLACEHOLDER_TASK_DEFINITIONS: PlaceholderTaskDefinition[] = [
  {
    id: "task-1",
    type: TASK_DEFINITION_TYPE.GLOBAL,
    taskCode: "TASK.LEGAL.001",
    taskName: "Legal review of assignment agreement",
    description:
      "Confirm the assignment agreement has passed legal review prior to booking.",
    category: TASK_CATEGORY.LEGAL,
    responsibleRole: TASK_RESPONSIBLE_ROLE.FRONT_OFFICE,
    mandatory: true,
    weight: 6,
    displayOrder: 1,
    stage: TASK_STAGE.STAGE_1_REVIEW,
    processContext: "Request Approval Readiness",
    active: true,
    documentRequirementRef: "DOC-1101",
    parentTaskCode: null,
    parentTaskName: null,
    inherited: false,
  },
  {
    id: "task-2",
    type: TASK_DEFINITION_TYPE.OVERRIDE,
    taskCode: "TASK.COMP.012",
    taskName: "KYC document completeness check",
    description: "Confirm all required KYC documents are present and complete.",
    category: TASK_CATEGORY.COMPLIANCE,
    responsibleRole: TASK_RESPONSIBLE_ROLE.SUPPORT,
    mandatory: true,
    weight: 8,
    displayOrder: 2,
    stage: TASK_STAGE.STAGE_2_REVIEW,
    processContext: "Request Approval Readiness",
    active: true,
    documentRequirementRef: null,
    parentTaskCode: "TASK.COMP.012",
    parentTaskName: "KYC document completeness check",
    inherited: true,
  },
  {
    id: "task-3",
    type: TASK_DEFINITION_TYPE.DEACTIVATE,
    taskCode: "TASK.OPS.009",
    taskName: "Residual value confirmation",
    description: "Confirm residual value assumptions for the leased asset.",
    category: null,
    responsibleRole: null,
    mandatory: null,
    weight: null,
    displayOrder: null,
    stage: null,
    processContext: null,
    active: false,
    documentRequirementRef: null,
    parentTaskCode: "TASK.OPS.009",
    parentTaskName: "Residual value confirmation",
    inherited: false,
  },
  {
    id: "task-4",
    type: TASK_DEFINITION_TYPE.SUPPLEMENT,
    taskCode: "TASK>PROD.221",
    taskName: "True sale asset registration check",
    description:
      "Confirm asset registration under the true sale structure has been completed with the registry.",
    category: TASK_CATEGORY.OPERATIONS,
    responsibleRole: TASK_RESPONSIBLE_ROLE.BACK_OFFICE_RISK,
    mandatory: true,
    weight: 4,
    displayOrder: 12,
    stage: TASK_STAGE.PRE_DISBURSEMENT,
    processContext: "Disbursement Readiness",
    active: true,
    documentRequirementRef: "DOC-FHA-001",
    parentTaskCode: null,
    parentTaskName: null,
    inherited: false,
  },
]

// Global Default rows available as an Override/Deactivate "Parent task" pick list —
// in this static shell, only PLACEHOLDER_TASK_DEFINITIONS' own Global row qualifies.
export const PLACEHOLDER_PARENT_TASK_OPTIONS =
  PLACEHOLDER_TASK_DEFINITIONS.filter(
    task => task.type === TASK_DEFINITION_TYPE.GLOBAL
  ).map(task => ({
    value: task.taskCode,
    label: `${task.taskCode}, ${task.taskName}`,
  }))

const AUDIT_ACTOR_TYPE = {
  HUMAN_USER: "human_user",
  SYSTEM: "system",
  SCHEDULED_JOB: "scheduled_job",
} as const
type AuditActorType = (typeof AUDIT_ACTOR_TYPE)[keyof typeof AUDIT_ACTOR_TYPE]

type PlaceholderAuditTrailEntry = {
  id: string
  timestamp: string
  actorName: string
  actorType: AuditActorType
  action: string
  fieldDelta: string
}

// True Sale Catalog's audit trail, per the Figma "Audit trail" tab (append-only log,
// PRD1042-1175).
export const PLACEHOLDER_AUDIT_TRAIL: PlaceholderAuditTrailEntry[] = [
  {
    id: "audit-1",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "Mateo García",
    actorType: AUDIT_ACTOR_TYPE.HUMAN_USER,
    action: "Updated",
    fieldDelta: "KYC-001 › weight: 5 → 8",
  },
  {
    id: "audit-2",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "system_dd_counter",
    actorType: AUDIT_ACTOR_TYPE.SYSTEM,
    action: "Updated",
    fieldDelta:
      "KYC-001 › responsible role: Compliance officer → Senior compliance officer",
  },
  {
    id: "audit-3",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "Thomas Muller",
    actorType: AUDIT_ACTOR_TYPE.HUMAN_USER,
    action: "Added",
    fieldDelta: "FHA-002 supplement task: MIP calculation review",
  },
  {
    id: "audit-4",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "Anna Kowalski",
    actorType: AUDIT_ACTOR_TYPE.HUMAN_USER,
    action: "Added",
    fieldDelta: "FHA-001 supplement task: FHA eligibility check",
  },
  {
    id: "audit-5",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "Anna Kowalski",
    actorType: AUDIT_ACTOR_TYPE.HUMAN_USER,
    action: "Created",
    fieldDelta: "draft v2: Cloned from v1",
  },
  {
    id: "audit-6",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "system_scheduler",
    actorType: AUDIT_ACTOR_TYPE.SCHEDULED_JOB,
    action: "Activated",
    fieldDelta: "version: 2 → 3",
  },
  {
    id: "audit-7",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "system_kyc_engine",
    actorType: AUDIT_ACTOR_TYPE.SYSTEM,
    action: "Approved",
    fieldDelta: "activation of v3: pending approval → approved",
  },
  {
    id: "audit-8",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "Mateo García",
    actorType: AUDIT_ACTOR_TYPE.HUMAN_USER,
    action: "Submitted",
    fieldDelta: "activation request: draft → pending approval",
  },
  {
    id: "audit-9",
    timestamp: "2024-06-12T15:32:00Z",
    actorName: "system_dd_counter",
    actorType: AUDIT_ACTOR_TYPE.SYSTEM,
    action: "Activated",
    fieldDelta: "version: 2 → 3",
  },
]
