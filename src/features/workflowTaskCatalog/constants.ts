// Local UI-only enums and placeholder data for the Workflow Task Catalog static shell.
// No backend exists yet for Epic 15 (see CLAUDE.md "Critical constraint") — nothing here
// crosses a network boundary, so plain TS const objects are used instead of Zod schemas
// (Zod is reserved for data that actually comes from an API response).

export const CATALOG_LAYER = {
  GLOBAL_DEFAULT: "global_default",
  PRODUCT_SPECIFIC: "product_specific",
} as const
export type CatalogLayer = (typeof CATALOG_LAYER)[keyof typeof CATALOG_LAYER]

export const ENTITY_TYPE = {
  REFINANCING_REQUEST: "refinancing_request",
  FINANCING: "financing",
  REDEMPTION_REQUEST: "redemption_request",
} as const
export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE]

export const CATALOG_STATE = {
  DRAFT: "draft",
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  ARCHIVED: "archived",
} as const
export type CatalogState = (typeof CATALOG_STATE)[keyof typeof CATALOG_STATE]

export const CATALOG_LAYER_OPTIONS = [
  {
    value: CATALOG_LAYER.GLOBAL_DEFAULT,
    labelKey: "catalogLayers.global_default",
  },
  {
    value: CATALOG_LAYER.PRODUCT_SPECIFIC,
    labelKey: "catalogLayers.product_specific",
  },
] as const

export const ENTITY_TYPE_OPTIONS = [
  {
    value: ENTITY_TYPE.REFINANCING_REQUEST,
    labelKey: "entityTypes.refinancing_request",
  },
  { value: ENTITY_TYPE.FINANCING, labelKey: "entityTypes.financing" },
  {
    value: ENTITY_TYPE.REDEMPTION_REQUEST,
    labelKey: "entityTypes.redemption_request",
  },
] as const

export const CATALOG_STATE_OPTIONS = [
  { value: CATALOG_STATE.DRAFT, labelKey: "catalogStates.draft" },
  { value: CATALOG_STATE.ACTIVE, labelKey: "catalogStates.active" },
  { value: CATALOG_STATE.DEPRECATED, labelKey: "catalogStates.deprecated" },
  { value: CATALOG_STATE.ARCHIVED, labelKey: "catalogStates.archived" },
] as const

// "Version State" per PRD1042-1179 adds "published" on top of the four Catalog States.
// Presentational only — see WorkflowTaskCatalogFilterBar: no per-row version-state field
// exists on the placeholder rows below, so this filter tracks a selection but does not
// narrow the static rows (there is no per-version data to filter against yet).
export const VERSION_STATE_OPTIONS = [
  { value: "draft", labelKey: "versionStates.draft" },
  { value: "published", labelKey: "versionStates.published" },
  { value: "active", labelKey: "versionStates.active" },
  { value: "deprecated", labelKey: "versionStates.deprecated" },
  { value: "archived", labelKey: "versionStates.archived" },
] as const
export type VersionState = (typeof VERSION_STATE_OPTIONS)[number]["value"]

// Shared by the Deprecate/Archive justification textareas — matches the Figma
// "min 10 characters" hint under both fields.
export const JUSTIFICATION_MIN_LENGTH = 10

export const PAGE_SIZES = [10, 25, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export type CatalogRowAction =
  | "openDetail"
  | "newDraftVersion"
  | "versionHistory"
  | "migrationHistory"
  | "deprecate"
  | "archive"

export type CatalogLifecycleAction = "deprecate" | "archive"

export type WorkflowTaskCatalogRow = {
  id: string
  catalogName: string
  catalogLayer: CatalogLayer
  entityType: EntityType
  // null for Global Default rows — Product Template reference is forced null for that
  // layer per PRD1042-1158 (rejected as a structural error if non-null).
  productTemplateName: string | null
  version: string
  // null = "Open ended" (no Valid Until set).
  publishedAt: string | null
  catalogState: CatalogState
  objectRefCount: number
}

// Placeholder Active Product Templates — no Product Template list endpoint is queried
// here; this is static population only for the "Applicable product template" selector
// and the list's Product template filter (see CLAUDE.md constraint: no data wiring).
export const PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS = [
  "Standard Loan",
  "Mortgage Plus",
  "Auto Lease",
  "SME Standard",
  "Consumer Loan",
  "Equipment Lease",
  "Auto Refinance",
  "Corporate Lease",
  "Insurance Bundle",
  "Asset Recovery",
  "Solar Leasing",
  "Premium Lease",
].map(name => ({ value: name, label: name }))

// Placeholder rows — no API exists yet for Epic 15 (see CLAUDE.md), used only to
// populate the static list shell. Global Default rows carry a null product template per
// the "forced null" business rule in PRD1042-1158, even though the Figma sample data
// shows a template name against those rows.
export const PLACEHOLDER_CATALOG_ROWS: WorkflowTaskCatalogRow[] = [
  {
    id: "wtc-1",
    catalogName: "Financing Default",
    catalogLayer: CATALOG_LAYER.GLOBAL_DEFAULT,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: null,
    version: "v4",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 124,
  },
  {
    id: "wtc-2",
    catalogName: "Refinancing Rules",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.REFINANCING_REQUEST,
    productTemplateName: "Mortgage Plus",
    version: "v5",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 36,
  },
  {
    id: "wtc-3",
    catalogName: "Redemption Workflow",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.REDEMPTION_REQUEST,
    productTemplateName: "Auto Lease",
    version: "v3",
    publishedAt: null,
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 87,
  },
  {
    id: "wtc-4",
    catalogName: "SME Financing",
    catalogLayer: CATALOG_LAYER.GLOBAL_DEFAULT,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: null,
    version: "v2",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 59,
  },
  {
    id: "wtc-5",
    catalogName: "Consumer Loan Flow",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: "Consumer Loan",
    version: "v7",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 41,
  },
  {
    id: "wtc-6",
    catalogName: "Leasing Approval",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: "Equipment Lease",
    version: "v8",
    publishedAt: null,
    catalogState: CATALOG_STATE.ACTIVE,
    objectRefCount: 73,
  },
  {
    id: "wtc-7",
    catalogName: "Vehicle Refinancing",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.REFINANCING_REQUEST,
    productTemplateName: "Auto Refinance",
    version: "v1",
    publishedAt: null,
    catalogState: CATALOG_STATE.DEPRECATED,
    objectRefCount: 0,
  },
  {
    id: "wtc-8",
    catalogName: "Corporate Workflow",
    catalogLayer: CATALOG_LAYER.GLOBAL_DEFAULT,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: null,
    version: "v4",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.DEPRECATED,
    objectRefCount: 198,
  },
  {
    id: "wtc-9",
    catalogName: "Insurance Extension",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: "Insurance Bundle",
    version: "v6",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.DRAFT,
    objectRefCount: 14,
  },
  {
    id: "wtc-10",
    catalogName: "Asset Redemption",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.REDEMPTION_REQUEST,
    productTemplateName: "Asset Recovery",
    version: "v7",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.DEPRECATED,
    objectRefCount: 65,
  },
  {
    id: "wtc-11",
    catalogName: "Green Energy Finance",
    catalogLayer: CATALOG_LAYER.GLOBAL_DEFAULT,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: null,
    version: "v1",
    publishedAt: null,
    catalogState: CATALOG_STATE.ARCHIVED,
    objectRefCount: 0,
  },
  {
    id: "wtc-12",
    catalogName: "Premium Leasing",
    catalogLayer: CATALOG_LAYER.PRODUCT_SPECIFIC,
    entityType: ENTITY_TYPE.FINANCING,
    productTemplateName: "Premium Lease",
    version: "v9",
    publishedAt: "2028-12-31",
    catalogState: CATALOG_STATE.ARCHIVED,
    objectRefCount: 0,
  },
]

export type WorkflowTaskCatalogFilterState = {
  catalogLayer: CatalogLayer[]
  entityType: EntityType[]
  productTemplate: string[]
  versionState: VersionState[]
  catalogState: CatalogState[]
}

export const EMPTY_CATALOG_FILTER_STATE: WorkflowTaskCatalogFilterState = {
  catalogLayer: [],
  entityType: [],
  productTemplate: [],
  versionState: [],
  catalogState: [],
}

// ─── Catalog Detail page — placeholder data (PRD1042-1180/1160-1163/1175-1177) ───
// No API exists yet for Epic 15 (see CLAUDE.md). Everything below is static shell
// data derived from the Figma "True Sale Catalog" example — used regardless of the
// route :id, except catalogState/layer/entityType/productTemplateName/version/
// publishedAt/objectRefCount, which are read from the matching PLACEHOLDER_CATALOG_ROWS
// entry so the Draft vs Active header/editability actually varies by which list row
// was clicked.

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

export const TASK_CATEGORY = {
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
export const TASK_RESPONSIBLE_ROLE = {
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

export const TASK_STAGE = {
  PRE_SUBMISSION: "pre_submission",
  STAGE_1_REVIEW: "stage_1_review",
  STAGE_2_REVIEW: "stage_2_review",
  PRE_DISBURSEMENT: "pre_disbursement",
  SERVICING: "servicing",
  REDEMPTION: "redemption",
} as const
export type TaskStage = (typeof TASK_STAGE)[keyof typeof TASK_STAGE]

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

export type PlaceholderVersionHistoryEntry = {
  id: string
  version: string
  state: CatalogState
  activatedAt: string
  changeSummary: string
  objectRefs: number
  archivable: boolean
  publishedAt: string | null
  publishedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  deprecatedAt: string | null
}

// True Sale Catalog's version history, per the Figma "Version history" tab.
export const PLACEHOLDER_VERSION_HISTORY: PlaceholderVersionHistoryEntry[] = [
  {
    id: "version-2",
    version: "v2",
    state: CATALOG_STATE.ACTIVE,
    activatedAt: "2024-06-12T15:32:00Z",
    changeSummary: "Updated FHA weight thresholds per Q3 compliance guidance",
    objectRefs: 42,
    archivable: false,
    publishedAt: "2024-06-12T15:32:00Z",
    publishedBy: "Adam Sandler",
    approvedAt: "2024-06-12T15:32:00Z",
    approvedBy: "Bruce Wayne",
    deprecatedAt: null,
  },
  {
    id: "version-3",
    version: "v3",
    state: CATALOG_STATE.DEPRECATED,
    activatedAt: "2024-06-12T15:32:00Z",
    changeSummary: "Added MIP calculation review task (FHA-002)",
    objectRefs: 0,
    archivable: true,
    publishedAt: "2024-06-12T15:32:00Z",
    publishedBy: "James Wu",
    approvedAt: "2024-06-12T15:32:00Z",
    approvedBy: "Bruce Wayne",
    deprecatedAt: "2024-06-12T15:32:00Z",
  },
  {
    id: "version-1",
    version: "v1",
    state: CATALOG_STATE.ARCHIVED,
    activatedAt: "2024-06-12T15:32:00Z",
    changeSummary: "Bug fix: corrected stage assignment for FHA-002",
    objectRefs: 0,
    archivable: true,
    publishedAt: "2024-06-12T15:32:00Z",
    publishedBy: "James Wu",
    approvedAt: "2024-06-12T15:32:00Z",
    approvedBy: "Bruce Wayne",
    deprecatedAt: "2024-06-12T15:32:00Z",
  },
  {
    id: "version-4",
    version: "v4",
    state: CATALOG_STATE.ARCHIVED,
    activatedAt: "2024-06-12T15:32:00Z",
    changeSummary: "Initial product specific catalog for FHA Standard 2024",
    objectRefs: 0,
    archivable: true,
    publishedAt: "2024-06-12T15:32:00Z",
    publishedBy: "James Wu",
    approvedAt: "2024-06-12T15:32:00Z",
    approvedBy: "Bruce Wayne",
    deprecatedAt: "2024-06-12T15:32:00Z",
  },
]

export type PlaceholderMigrationHistoryEntry = {
  id: string
  fromVersion: string
  toVersion: string
  objectsInScope: number
  decisionAt: string
  dryRunReportName: string
  initiator: string
  approver: string
  reconciledCount: number
  manualReviewCount: number
}

// True Sale Catalog's migration history, per the Figma "Migration history" tab.
export const PLACEHOLDER_MIGRATION_HISTORY: PlaceholderMigrationHistoryEntry[] =
  [
    {
      id: "migration-v2-v3",
      fromVersion: "v2",
      toVersion: "v3",
      objectsInScope: 12,
      decisionAt: "2024-06-12T15:32:00Z",
      dryRunReportName: "rpt-mig-20240801",
      initiator: "Operations",
      approver: "Bruce Wayne",
      reconciledCount: 12,
      manualReviewCount: 0,
    },
    {
      id: "migration-v3-v4",
      fromVersion: "v3",
      toVersion: "v4",
      objectsInScope: 8,
      decisionAt: "2024-06-12T15:32:00Z",
      dryRunReportName: "rpt-mig-20240801",
      initiator: "Operations",
      approver: "Bruce Wayne",
      reconciledCount: 12,
      manualReviewCount: 2,
    },
    {
      id: "migration-v1-v2",
      fromVersion: "v1",
      toVersion: "v2",
      objectsInScope: 8,
      decisionAt: "2024-06-12T15:32:00Z",
      dryRunReportName: "rpt-mig-20240801",
      initiator: "Operations",
      approver: "Bruce Wayne",
      reconciledCount: 8,
      manualReviewCount: 0,
    },
  ]

export const AUDIT_ACTOR_TYPE = {
  HUMAN_USER: "human_user",
  SYSTEM: "system",
  SCHEDULED_JOB: "scheduled_job",
} as const
export type AuditActorType =
  (typeof AUDIT_ACTOR_TYPE)[keyof typeof AUDIT_ACTOR_TYPE]

export type PlaceholderAuditTrailEntry = {
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

export type PlaceholderEffectiveTask = {
  code: string
  taskName: string
  source: TaskDefinitionType
  mandatory: boolean
  weight: number
  responsibleRole: TaskResponsibleRole
  stage: string
  documentRequirementRef: string | null
}

// Resolved effective task set for the "Preview effective tasks" sheet, per
// PRD1042-1181 (out of this story's 5-tab scope, but directly triggered from this
// page's header in both fetched Figma nodes, so included as a static shell).
export const PLACEHOLDER_EFFECTIVE_TASKS: PlaceholderEffectiveTask[] = [
  {
    code: "KYC-001",
    taskName: "Identity verification",
    source: TASK_DEFINITION_TYPE.OVERRIDE,
    mandatory: true,
    weight: 8,
    responsibleRole: TASK_RESPONSIBLE_ROLE.COMPLIANCE,
    stage: "Pre-application",
    documentRequirementRef: "DOC-KYC-001",
  },
  {
    code: "KYC-002",
    taskName: "AML screening",
    source: TASK_DEFINITION_TYPE.GLOBAL,
    mandatory: true,
    weight: 8,
    responsibleRole: TASK_RESPONSIBLE_ROLE.COMPLIANCE,
    stage: "Pre-application",
    documentRequirementRef: null,
  },
  {
    code: "INC-001",
    taskName: "Income verification",
    source: TASK_DEFINITION_TYPE.GLOBAL,
    mandatory: true,
    weight: 7,
    responsibleRole: TASK_RESPONSIBLE_ROLE.FRONT_OFFICE,
    stage: "Application",
    documentRequirementRef: null,
  },
  {
    code: "APR-001",
    taskName: "Underwriter review",
    source: TASK_DEFINITION_TYPE.GLOBAL,
    mandatory: true,
    weight: 10,
    responsibleRole: TASK_RESPONSIBLE_ROLE.BACK_OFFICE_RISK,
    stage: "Underwriting",
    documentRequirementRef: "DOC-APR-001",
  },
  {
    code: "FHA-001",
    taskName: "FHA eligibility check",
    source: TASK_DEFINITION_TYPE.SUPPLEMENT,
    mandatory: true,
    weight: 7,
    responsibleRole: TASK_RESPONSIBLE_ROLE.FRONT_OFFICE,
    stage: "Application",
    documentRequirementRef: "DOC-FHA-001",
  },
  {
    code: "FHA-002",
    taskName: "MIP calculation review",
    source: TASK_DEFINITION_TYPE.SUPPLEMENT,
    mandatory: true,
    weight: 4,
    responsibleRole: TASK_RESPONSIBLE_ROLE.FRONT_OFFICE,
    stage: "Application",
    documentRequirementRef: "DOC-FHA-001",
  },
]

export type PlaceholderPrecheckIssue = {
  id: string
  title: string
  description: string
}

// Fixed "Publication check failed" issues for the Submit for activation dialog, per
// the Figma "PRECHECK FAIL" state. Always the same 3 issues in this static shell —
// there is no real validation engine yet, so the dialog only demonstrates the blocked
// state (Submit stays disabled); see CLAUDE.md "Critical constraint".
export const PLACEHOLDER_SUBMIT_PRECHECK_ISSUES: PlaceholderPrecheckIssue[] = [
  {
    id: "issue-1",
    title: "Document requirement ref is deprecated",
    description:
      "Task FHA-002, MIP calculation review, references document requirement DR-7.1 which is deprecated. Update to an active version or remove the reference.",
  },
  {
    id: "issue-2",
    title: "Contradictory override and deactivate pair on same parent task",
    description:
      "Task code KYC-001 has both an override entry and a deactivate entry in this product specific catalog. Remove one of the conflicting entries before submitting.",
  },
  {
    id: "issue-3",
    title: "Parent task ID unresolvable",
    description:
      "Task FHA-001, FHA eligibility check, declares parent task GD-MORG-999 which does not exist in the active global default catalog. Remove or correct the parent reference.",
  },
]

// ─── Migration Wizard — placeholder data (PRD1042-1172/1173/1174) ───────────
// No API exists yet for Epic 15 (see CLAUDE.md). The dry-run/execution report below is a
// single fixed canned report reused across the Define Scope, Approval, and Execution
// steps — a real system would compute the report from the scope IDs entered in Define
// Scope; this static shell does not perform that computation.

export const MIGRATION_TO_VERSION_OPTIONS = [
  { value: "v3", label: "v3 - Mortgage task set refresh" },
  { value: "v4", label: "v4 - Q1 underwriting model update" },
] as const

export const PLACEHOLDER_MIGRATION_DEFAULT_SCOPE_IDS = [
  "BO-10045",
  "BO-10087",
  "BO-1034",
  "BO-10402",
  "BO-10112",
]

export const PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY = {
  reportId: "DRR-2025-07-08-0042",
  fromVersion: "v2",
  toVersion: "v3",
  added: 12,
  modified: 9,
  deactivated: 4,
  newInstances: 132,
  naInstances: 33,
}

export type PlaceholderMigrationScopeObject = {
  id: string
  name: string
  naInstances: number
  mandatoryChanges: number
  newInstances: number
  taskDelta: string[]
}

// True Sale Catalog migration dry-run's 6 in-scope objects, per the Figma "Dry run
// report" / "Approve or reject" frames (both reuse the same canned report).
export const PLACEHOLDER_MIGRATION_SCOPE_OBJECTS: PlaceholderMigrationScopeObject[] =
  [
    {
      id: "BO-10145",
      name: "Mortgage origination standard",
      naInstances: 0,
      mandatoryChanges: 2,
      newInstances: 47,
      taskDelta: [
        "Annual income verification: threshold 680 → 700",
        "Employment continuity check",
        "Property appraisal review",
        "Credit score evaluation",
        "Debt to income assessment: cap updated",
      ],
    },
    {
      id: "BO-10123",
      name: "Home equity line of credit",
      naInstances: 8,
      mandatoryChanges: 1,
      newInstances: 12,
      taskDelta: ["1 task added, 4 modified, 1 deactivated"],
    },
    {
      id: "BO-10223",
      name: "Auto refinance standard",
      naInstances: 0,
      mandatoryChanges: 0,
      newInstances: 23,
      taskDelta: ["2 tasks added, 1 modified"],
    },
    {
      id: "BO-10201",
      name: "Personal loan standard",
      naInstances: 18,
      mandatoryChanges: 3,
      newInstances: 0,
      taskDelta: ["Active task instances blocking migration for 18 records"],
    },
    {
      id: "BO-10189",
      name: "Student loan refinance",
      naInstances: 7,
      mandatoryChanges: 0,
      newInstances: 0,
      taskDelta: ["Version lock conflict detected on 7 in progress workflows"],
    },
    {
      id: "BO-10167",
      name: "Commercial property loan",
      naInstances: 2,
      mandatoryChanges: 1,
      newInstances: 19,
      taskDelta: ["2 tasks added, 2 modified"],
    },
  ]

export const MIGRATION_OBJECT_OUTCOME = {
  RECONCILED: "reconciled",
  FAILED: "failed",
} as const
export type MigrationObjectOutcome =
  (typeof MIGRATION_OBJECT_OUTCOME)[keyof typeof MIGRATION_OBJECT_OUTCOME]

export type PlaceholderMigrationExecutionOutcome = {
  id: string
  name: string
  outcome: MigrationObjectOutcome
  details: string
}

// Per-object outcomes for the Execution Report, per the Figma "Execution report" frame
// (4 reconciled, 2 failed — matches the header chip counts).
export const PLACEHOLDER_MIGRATION_EXECUTION_OUTCOMES: PlaceholderMigrationExecutionOutcome[] =
  [
    {
      id: "BO-10145",
      name: "Mortgage origination standard",
      outcome: MIGRATION_OBJECT_OUTCOME.RECONCILED,
      details: "3 tasks added, 2 modified. 47 new instances created.",
    },
    {
      id: "BO-10123",
      name: "Home equity line of credit",
      outcome: MIGRATION_OBJECT_OUTCOME.RECONCILED,
      details:
        "1 task added, 4 modified, 1 deactivated. 12 new instances, 8 marked NA.",
    },
    {
      id: "BO-10223",
      name: "Auto refinance standard",
      outcome: MIGRATION_OBJECT_OUTCOME.RECONCILED,
      details: "2 tasks added, 1 modified. 23 new instances created.",
    },
    {
      id: "BO-10201",
      name: "Personal loan standard",
      outcome: MIGRATION_OBJECT_OUTCOME.FAILED,
      details:
        "Active task instances blocking migration for 18 records. Object retains v2.",
    },
    {
      id: "BO-10189",
      name: "Student loan refinance",
      outcome: MIGRATION_OBJECT_OUTCOME.FAILED,
      details:
        "Version lock conflict detected on 7 in progress workflows. Object retains v2.",
    },
    {
      id: "BO-10167",
      name: "Commercial property loan",
      outcome: MIGRATION_OBJECT_OUTCOME.RECONCILED,
      details: "2 tasks added, 2 modified. 19 new instances created.",
    },
  ]

export const PLACEHOLDER_MIGRATION_EXECUTION_GENERATED_AT =
  "2025-07-08T14:32:00Z"
