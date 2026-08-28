import { describe, it, expect } from "vitest"
import {
  AddTaskRequestSchema,
  ConditionOperatorSchema,
  ConditionRowItemSchema,
  DocumentCheckItemSchema,
  FieldRegistryItemSchema,
  FieldRegistryListSchema,
  TaskApplicabilitySchema,
  AuditTrailResponseSchema,
  CaseTypeSchema,
  CatalogDetailResponseSchema,
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogListItemSchema,
  CatalogListResponseSchema,
  CatalogCaseTypeItemSchema,
  CatalogCaseTypeListSchema,
  CatalogOwningEntityTypeSchema,
  CataloguePhaseListSchema,
  CataloguePhaseSchema,
  CreatePhaseRequestSchema,
  RemovePhaseResponseSchema,
  SuspendCatalogResponseSchema,
  ReorderPhasesRequestSchema,
  StateTransitionOutcomeSchema,
  TaskTypeSchema,
  CatalogResponseSchema,
  CatalogStateSchema,
  CreateCatalogRequestSchema,
  TaskDefinitionItemSchema,
  TaskResponseWithWarningsSchema,
  UpdateTaskRequestSchema,
} from "@/features/workflowTaskCatalog/api/schema"

const CATALOG_UUID = "3f1c9a2e-0b7d-4c5e-8a11-9d2e6f4b7c80"
const TENANT_UUID = "9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"
const TEMPLATE_UUID = "11111111-2222-4333-8444-555555555555"
const USER_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"

const validListItem = {
  id: CATALOG_UUID,
  catalog_name: "Refinancing Rules",
  catalog_layer: "product_specific",
  catalog_state: "active",
  entity_type: "refinancing_request",
  entity_id: TEMPLATE_UUID,
  case_type: "refinancing_request",
  valid_from: "2026-08-01",
  valid_until: null,
  created_at: "2026-07-30T12:00:00Z",
}

const validCatalogResponse = {
  id: CATALOG_UUID,
  tenant_id: TENANT_UUID,
  catalog_name: "Refinancing Rules",
  catalog_layer: "product_specific",
  catalog_state: "active",
  entity_type: "refinancing_request",
  entity_id: TEMPLATE_UUID,
  case_type: "refinancing_request",
  valid_from: "2026-08-01",
  valid_until: null,
  description: null,
  created_by: USER_UUID,
  created_at: "2026-07-30T12:00:00Z",
  updated_at: "2026-07-30T12:00:00Z",
}

describe("wire enums", () => {
  it("accepts every documented value", () => {
    expect(CatalogLayerSchema.options).toEqual([
      "global_default",
      "product_specific",
    ])
    expect(CatalogEntityTypeSchema.options).toEqual([
      "refinancing_request",
      "financing",
      "redemption_request",
    ])
    // PRD1042-1894 Block 8 (AC §7): Draft → Active → Suspended, and back — supersedes the
    // earlier "created directly ACTIVE, no transitions" model.
    expect(CatalogStateSchema.options).toEqual([
      "draft",
      "active",
      "suspended",
      "archived",
    ])
    // PRD1042-1917 OQ-01 (19 Aug 2026) — all seven case types carry a catalogue, and the first
    // is `refinancing_request`: `main_process` was the catalogue's client-facing name, never the
    // case type, and migration case1917b01 rewrote the stored rows.
    expect(CaseTypeSchema.options).toEqual([
      "refinancing_request",
      "package_redemption",
      "single_redemption",
      "lessee_change",
      "object_swap",
      "extension",
      "asset_event",
    ])
  })

  it("rejects the retired deprecated state — never had a wire counterpart", () => {
    expect(() => CatalogStateSchema.parse("deprecated")).toThrow()
  })

  it("rejects an unknown entity type", () => {
    expect(() => CatalogEntityTypeSchema.parse("lessee_change")).toThrow()
  })

  it("rejects an unknown case type", () => {
    expect(() => CaseTypeSchema.parse("financing")).toThrow()
  })
})

describe("CatalogListItemSchema", () => {
  it("accepts the documented shape", () => {
    expect(() => CatalogListItemSchema.parse(validListItem)).not.toThrow()
  })

  it("accepts a global default row with no entity id", () => {
    expect(() =>
      CatalogListItemSchema.parse({
        ...validListItem,
        catalog_layer: "global_default",
        entity_id: null,
      })
    ).not.toThrow()
  })

  it("accepts an archived row with a valid_until date", () => {
    const parsed = CatalogListItemSchema.parse({
      ...validListItem,
      catalog_state: "archived",
      valid_until: "2027-01-31",
    })
    expect(parsed.valid_until).toBe("2027-01-31")
  })

  it.each([
    "id",
    "catalog_name",
    "catalog_layer",
    "catalog_state",
    "entity_type",
    "entity_id",
    "case_type",
    "valid_from",
    "valid_until",
    "created_at",
  ])("rejects a payload missing %s", field => {
    const payload: Record<string, unknown> = { ...validListItem }
    delete payload[field]
    expect(() => CatalogListItemSchema.parse(payload)).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, id: "wtc-1" })
    ).toThrow()
  })

  it("rejects an unknown catalog state", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, catalog_state: "banana" })
    ).toThrow()
  })

  it("rejects a numeric valid_from", () => {
    expect(() =>
      CatalogListItemSchema.parse({ ...validListItem, valid_from: 20260801 })
    ).toThrow()
  })

  // PRD1042-2150 — the creation wizard no longer asks for a validity window, so a catalogue
  // can carry none. The key stays required on the wire (nullable, not optional): the backend
  // always sends it, it just may be null.
  it("accepts a null valid_from", () => {
    const parsed = CatalogListItemSchema.parse({
      ...validListItem,
      valid_from: null,
    })
    expect(parsed.valid_from).toBeNull()
  })

  it("accepts a catalogue with no validity window at all", () => {
    const parsed = CatalogListItemSchema.parse({
      ...validListItem,
      valid_from: null,
      valid_until: null,
    })
    expect(parsed.valid_from).toBeNull()
    expect(parsed.valid_until).toBeNull()
  })
})

describe("CatalogListResponseSchema", () => {
  it("accepts the paginated envelope", () => {
    const parsed = CatalogListResponseSchema.parse({
      items: [validListItem],
      total: 1,
      page: 1,
      per_page: 25,
      total_pages: 1,
    })
    expect(parsed.items).toHaveLength(1)
  })

  it("accepts an empty page", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 0,
        page: 1,
        per_page: 25,
        total_pages: 0,
      })
    ).not.toThrow()
  })

  it("rejects a fractional counter", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 1.5,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    ).toThrow()
  })

  it("rejects a bare array — the endpoint is enveloped", () => {
    expect(() => CatalogListResponseSchema.parse([validListItem])).toThrow()
  })

  it("rejects an envelope missing total_pages", () => {
    expect(() =>
      CatalogListResponseSchema.parse({
        items: [],
        total: 0,
        page: 1,
        per_page: 25,
      })
    ).toThrow()
  })
})

describe("CreateCatalogRequestSchema", () => {
  it("accepts a product-specific payload", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_id: TEMPLATE_UUID,
        valid_from: "2026-08-01",
        valid_until: null,
        case_type: "refinancing_request",
      })
    ).not.toThrow()
  })

  it("accepts a global default payload with a null entity id", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Financing Default",
        catalog_layer: "global_default",
        entity_id: null,
        valid_from: "2026-08-01",
        valid_until: null,
        case_type: "refinancing_request",
      })
    ).not.toThrow()
  })

  // entity_type is no longer part of this request (PRD1042-1790 item 1) — the backend
  // derives it from case_type. A stray entity_type in the payload is silently stripped
  // rather than rejected, same as any other unrecognized key.
  it("strips a stray entity_type instead of rejecting it", () => {
    const parsed = CreateCatalogRequestSchema.parse({
      catalog_name: "Refinancing Rules",
      catalog_layer: "product_specific",
      entity_type: "refinancing_request",
      entity_id: TEMPLATE_UUID,
      valid_from: "2026-08-01",
      case_type: "refinancing_request",
    })
    expect(parsed).not.toHaveProperty("entity_type")
  })

  it("rejects a missing case_type", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_id: TEMPLATE_UUID,
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })

  it("rejects a case_type outside the documented enum", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_id: TEMPLATE_UUID,
        valid_from: "2026-08-01",
        case_type: "financing",
      })
    ).toThrow()
  })

  it("rejects an empty catalog name", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "",
        catalog_layer: "global_default",
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })

  it("rejects a catalog name over the 200-character wire limit", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "x".repeat(201),
        catalog_layer: "global_default",
        valid_from: "2026-08-01",
      })
    ).toThrow()
  })

  it("rejects a missing valid_from", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Financing Default",
        catalog_layer: "global_default",
      })
    ).toThrow()
  })

  // entity_id carries the Product Template UUID, so a template *name* must not pass —
  // that was the shell's placeholder shape and the BE would 422 on it.
  it("rejects a non-uuid entity id", () => {
    expect(() =>
      CreateCatalogRequestSchema.parse({
        catalog_name: "Refinancing Rules",
        catalog_layer: "product_specific",
        entity_id: "Mortgage Plus",
        valid_from: "2026-08-01",
        case_type: "refinancing_request",
      })
    ).toThrow()
  })
})

describe("CatalogResponseSchema", () => {
  it("accepts the documented shape and defaults warnings to an empty array", () => {
    const parsed = CatalogResponseSchema.parse(validCatalogResponse)
    expect(parsed.warnings).toEqual([])
    expect(parsed.current_version_id).toBeUndefined()
  })

  it("accepts a null case_type", () => {
    const parsed = CatalogResponseSchema.parse({
      ...validCatalogResponse,
      case_type: null,
    })
    expect(parsed.case_type).toBeNull()
  })

  it("keeps the no-global-default warning the BE returns on create", () => {
    const parsed = CatalogResponseSchema.parse({
      ...validCatalogResponse,
      current_version_id: CATALOG_UUID,
      warnings: [
        "No Global Default Catalog exists for this Tenant × Entity Type.",
      ],
    })
    expect(parsed.warnings).toHaveLength(1)
  })

  it("rejects a payload missing created_by", () => {
    const payload: Record<string, unknown> = { ...validCatalogResponse }
    delete payload.created_by
    expect(() => CatalogResponseSchema.parse(payload)).toThrow()
  })

  it("rejects a non-array warnings value", () => {
    expect(() =>
      CatalogResponseSchema.parse({
        ...validCatalogResponse,
        warnings: "no global default",
      })
    ).toThrow()
  })
})

// ─── Detail, audit trail and task authoring (PRD1042-1493 + US 15.3–15.6) ───

const VERSION_UUID = "7c1e5a90-2b3d-4f8e-9a11-6d5c4b3a2e10"
const TASK_UUID = "abcdefab-1234-4567-89ab-cdefabcdef12"
const PARENT_UUID = "fedcbafe-4321-4765-8ba9-21fedcbafedc"
const PHASE_UUID = "1c2d3e4f-5678-4901-abcd-ef1234567890"

// A `defined` row: the Global Default layer's own entry, so it carries real values.
const validDefinedTask = {
  id: TASK_UUID,
  catalog_version_id: VERSION_UUID,
  layer_action: "defined",
  task_number: 4,
  task_code: "LEG-001",
  task_name: "Legal notice of assignment",
  task_description: "Send the notice to the lessee.",
  category: "legal",
  responsible_role: "front_office",
  responsible_roles: ["front_office"],
  phase_id: PHASE_UUID,
  generated_document_ref: null,
  trigger_event: null,
  permitted_outcomes: null,
  lifecycle_entity: null,
  capture_section_name: null,
  is_mandatory: true,
  weight: "2.50",
  display_order: 10,
  stage_categorization: "stage_1_review",
  applicable_process_contexts: ["rr_submission"],
  is_active: true,
  parent_task_id: null,
  doc_requirement_ref: null,
  doc_requirement_pin_mode: null,
  conditional_trigger: null,
  task_type: "checkbox",
  applicability: "always",
  four_eyes: false,
  exclusion_task_ids: [],
  four_eyes_exclusion_wide: false,
  document_checks: [],
  condition_rows: [],
  created_by: USER_UUID,
  created_at: "2026-07-30T12:00:00Z",
  updated_at: "2026-07-30T12:00:00Z",
}

const validDetail = {
  ...validCatalogResponse,
  current_version_id: VERSION_UUID,
  tasks: [validDefinedTask],
}

describe("TaskDefinitionItemSchema", () => {
  it("accepts a fully populated defined task and coerces the decimal weight", () => {
    const parsed = TaskDefinitionItemSchema.parse(validDefinedTask)
    expect(parsed.weight).toBe(2.5)
  })

  // PRD1042-1892 item 13 — the role is a set of platform roles. Both carriers arrive: a row
  // authored before 17 Aug has only the retired singular, one authored after has only the set.
  it("accepts both responsible roles in one row", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      responsible_roles: ["front_office", "back_office"],
    })
    expect(parsed.responsible_roles).toEqual(["front_office", "back_office"])
  })

  it("accepts a post-17-Aug row that carries only the set", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      responsible_role: null,
      responsible_roles: ["back_office"],
    })
    expect(parsed.responsible_role).toBeNull()
    expect(parsed.responsible_roles).toEqual(["back_office"])
  })

  // Reading follows the wire, which declares `list[UserRole]` — the whole platform enum. The
  // narrowing belongs to the WRITE path (next test): a stored row outside the authorable pair is
  // not something this app may author, but refusing to *read* it turned one unexpected value into
  // a blank detail page against a 200 response.
  it("accepts a platform role outside the authorable pair", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      responsible_roles: ["system_admin"],
    })
    expect(parsed.responsible_roles).toEqual(["system_admin"])
  })

  it("still refuses to author a role outside the pair", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        responsible_roles: ["system_admin"],
      })
    ).toThrow()
  })

  // The retired accountability enum is a different domain and none of its extra values are roles
  // a step can be assigned to.
  it("rejects a retired accountability value in the set", () => {
    expect(() =>
      TaskDefinitionItemSchema.parse({
        ...validDefinedTask,
        responsible_roles: ["back_office_risk"],
      })
    ).toThrow()
  })

  it("requires the set to be present, even as null", () => {
    const withoutSet: Record<string, unknown> = { ...validDefinedTask }
    delete withoutSet.responsible_roles
    expect(() => TaskDefinitionItemSchema.parse(withoutSet)).toThrow()
  })

  // A deactivated entry only switches its parent off, so the BE legitimately returns null for
  // every descriptive field. Modelling those as optional rather than nullable would reject it.
  it("accepts a deactivated row whose descriptive fields are all null", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      layer_action: "deactivated",
      task_code: null,
      task_name: null,
      task_description: null,
      category: null,
      responsible_role: null,
      responsible_roles: null,
      phase_id: null,
      is_mandatory: null,
      weight: null,
      display_order: null,
      stage_categorization: null,
      applicable_process_contexts: null,
      parent_task_id: PARENT_UUID,
    })
    expect(parsed.weight).toBeNull()
    expect(parsed.task_name).toBeNull()
  })

  it("keeps a null weight null rather than coercing it to zero", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      weight: null,
    })
    expect(parsed.weight).not.toBe(0)
    expect(parsed.weight).toBeNull()
  })

  it("accepts an override row carrying its inherited global default values", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      layer_action: "override",
      parent_task_id: PARENT_UUID,
      is_mandatory: false,
      inherited: {
        task_code: "LEG-001",
        task_name: "Legal notice of assignment",
        task_description: null,
        category: "legal",
        applicable_process_contexts: null,
        is_mandatory: true,
        weight: "2.50",
        responsible_role: "front_office",
        responsible_roles: ["front_office"],
        display_order: 10,
        stage_categorization: "stage_1_review",
        doc_requirement_ref: null,
      },
    })
    expect(parsed.inherited?.is_mandatory).toBe(true)
    expect(parsed.is_mandatory).toBe(false)
    expect(parsed.inherited?.weight).toBe(2.5)
  })

  it("omits inherited entirely for a row with no parent", () => {
    expect(
      TaskDefinitionItemSchema.parse(validDefinedTask).inherited
    ).toBeUndefined()
  })

  it("rejects a layer_action the wire does not define", () => {
    // The pre-wiring shell used global/deactivate; the wire says defined/deactivated.
    expect(() =>
      TaskDefinitionItemSchema.parse({
        ...validDefinedTask,
        layer_action: "global",
      })
    ).toThrow()
    expect(() =>
      TaskDefinitionItemSchema.parse({
        ...validDefinedTask,
        layer_action: "deactivate",
      })
    ).toThrow()
  })

  it("rejects a non-numeric weight rather than yielding NaN", () => {
    expect(() =>
      TaskDefinitionItemSchema.parse({ ...validDefinedTask, weight: "heavy" })
    ).toThrow()
  })
})

describe("CatalogDetailResponseSchema", () => {
  it("accepts the documented shape", () => {
    const parsed = CatalogDetailResponseSchema.parse(validDetail)
    expect(parsed.tasks).toHaveLength(1)
    expect(parsed.current_version_id).toBe(VERSION_UUID)
  })

  // PRD1042-1790 item 1 — the detail carries the scope key. The list and create responses always
  // did; the detail did not, so Identity & Scope could show only the derived entity type.
  it("carries the case type alongside the derived entity type", () => {
    const parsed = CatalogDetailResponseSchema.parse(validDetail)
    expect(parsed.case_type).toBe("refinancing_request")
    expect(parsed.entity_type).toBe("refinancing_request")
  })

  it("requires the case type to be present", () => {
    const withoutCaseType: Record<string, unknown> = { ...validDetail }
    delete withoutCaseType.case_type
    expect(() => CatalogDetailResponseSchema.parse(withoutCaseType)).toThrow()
  })

  // Nullable rather than optional: a row predating the case-type migration has none, and the
  // screen must be able to render that instead of failing the parse.
  it("accepts a null case type for a pre-migration row", () => {
    const parsed = CatalogDetailResponseSchema.parse({
      ...validDetail,
      case_type: null,
    })
    expect(parsed.case_type).toBeNull()
  })

  // Null means no active version, which makes every task mutation unbuildable — the UI must be
  // able to see that state rather than have the parse reject it.
  it("accepts a null current_version_id", () => {
    const parsed = CatalogDetailResponseSchema.parse({
      ...validDetail,
      current_version_id: null,
    })
    expect(parsed.current_version_id).toBeNull()
  })

  it("accepts a catalogue with no tasks", () => {
    expect(
      CatalogDetailResponseSchema.parse({ ...validDetail, tasks: [] }).tasks
    ).toEqual([])
  })

  it("rejects a payload missing current_version_id", () => {
    const payload: Record<string, unknown> = { ...validDetail }
    delete payload.current_version_id
    expect(() => CatalogDetailResponseSchema.parse(payload)).toThrow()
  })

  it("rejects a payload missing tasks", () => {
    const payload: Record<string, unknown> = { ...validDetail }
    delete payload.tasks
    expect(() => CatalogDetailResponseSchema.parse(payload)).toThrow()
  })
})

describe("AuditTrailResponseSchema", () => {
  const validEvent = {
    id: CATALOG_UUID,
    event_type: "WTC_CATALOG_CREATED",
    action_type: "CREATE",
    actor_id: "USR-00002",
    actor_role_at_time: "bank_power_user",
    actor_display: "Test BankPowerUser",
    recorded_at: "2026-07-30T12:00:00Z",
    entity_display: "Refinancing Rules",
    old_data: null,
    new_data: { catalog_name: "Refinancing Rules" },
    changed_fields: ["catalog_name"],
  }

  it("accepts the cursor envelope", () => {
    const parsed = AuditTrailResponseSchema.parse({
      events: [validEvent],
      next_cursor: "eyJpZCI6MX0",
    })
    expect(parsed.events).toHaveLength(1)
    expect(parsed.next_cursor).toBe("eyJpZCI6MX0")
  })

  it("treats a missing next_cursor as the last page", () => {
    expect(
      AuditTrailResponseSchema.parse({ events: [] }).next_cursor
    ).toBeUndefined()
  })

  // actor_id is a display code like USR-00002 on this endpoint, not a UUID.
  it("accepts a non-uuid actor_id", () => {
    expect(() =>
      AuditTrailResponseSchema.parse({ events: [validEvent] })
    ).not.toThrow()
  })

  it("rejects the items/total/page envelope the catalogue list uses", () => {
    expect(() =>
      AuditTrailResponseSchema.parse({
        items: [validEvent],
        total: 1,
        page: 1,
        per_page: 25,
        total_pages: 1,
      })
    ).toThrow()
  })
})

describe("AddTaskRequestSchema", () => {
  it("accepts a payload carrying only layer_action", () => {
    expect(() =>
      AddTaskRequestSchema.parse({ layer_action: "deactivated" })
    ).not.toThrow()
  })

  it("rejects a payload with no layer_action", () => {
    expect(() => AddTaskRequestSchema.parse({ task_code: "LEG-001" })).toThrow()
  })

  // The BE declares responsible_roles with min_length=1 and counts it among the fields a
  // defined/supplement task must carry, so an empty set is refused rather than sent.
  it("rejects an empty responsible_roles set", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        responsible_roles: [],
      })
    ).toThrow()
  })

  it("accepts the authorable role set", () => {
    const parsed = AddTaskRequestSchema.parse({
      layer_action: "defined",
      responsible_roles: ["front_office", "back_office"],
    })
    expect(parsed.responsible_roles).toEqual(["front_office", "back_office"])
  })

  // The retired singular is no longer authorable, so it is not part of the request shape and
  // never reaches the wire — see toUpdateTaskBody, which derives its allowlist from this schema.
  it("drops the retired singular responsible_role", () => {
    const parsed = AddTaskRequestSchema.parse({
      layer_action: "defined",
      responsible_role: "compliance",
    })
    expect("responsible_role" in parsed).toBe(false)
  })

  it("rejects a negative weight", () => {
    expect(() =>
      AddTaskRequestSchema.parse({ layer_action: "defined", weight: -1 })
    ).toThrow()
  })

  it("rejects a task_code over the 100-character wire limit", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        task_code: "x".repeat(101),
      })
    ).toThrow()
  })
})

describe("UpdateTaskRequestSchema", () => {
  it("accepts an empty payload — a PATCH may change nothing", () => {
    expect(() => UpdateTaskRequestSchema.parse({})).not.toThrow()
  })

  it("accepts a single-field payload", () => {
    expect(UpdateTaskRequestSchema.parse({ is_mandatory: false })).toEqual({
      is_mandatory: false,
    })
  })

  // layer_action, task_code and parent_task_id are immutable once created and are absent from
  // UpdateTaskRequest — they must be stripped rather than smuggled through.
  it.each(["layer_action", "task_code", "parent_task_id"])(
    "strips the immutable field %s",
    field => {
      const parsed = UpdateTaskRequestSchema.parse({
        task_name: "Renamed",
        [field]: field === "layer_action" ? "override" : PARENT_UUID,
      }) as Record<string, unknown>
      expect(parsed[field]).toBeUndefined()
      expect(parsed.task_name).toBe("Renamed")
    }
  )
})

describe("TaskResponseWithWarningsSchema", () => {
  // The parse target for all three task mutations. Its `warnings` default is load-bearing:
  // TaskDefinitionSheet iterates `response.warnings` on create, which throws if the key is
  // absent and the default does not apply.
  it("defaults warnings to an empty array when the BE omits the key", () => {
    const parsed = TaskResponseWithWarningsSchema.parse(validDefinedTask)
    expect(parsed.warnings).toEqual([])
  })

  it("keeps the warnings the BE returns", () => {
    const parsed = TaskResponseWithWarningsSchema.parse({
      ...validDefinedTask,
      warnings: ["Weight exceeds the catalogue total."],
    })
    expect(parsed.warnings).toHaveLength(1)
  })

  // `inherited` is omitted from this shape — a mutation response never carries the parent's
  // values, only the task the caller just wrote.
  it("strips inherited rather than echoing it back", () => {
    const parsed = TaskResponseWithWarningsSchema.parse({
      ...validDefinedTask,
      inherited: { task_name: "Global default name" },
    }) as Record<string, unknown>
    expect(parsed.inherited).toBeUndefined()
  })

  it("rejects a non-array warnings value", () => {
    expect(() =>
      TaskResponseWithWarningsSchema.parse({
        ...validDefinedTask,
        warnings: "weight exceeds total",
      })
    ).toThrow()
  })

  it("still enforces the underlying task shape", () => {
    expect(() =>
      TaskResponseWithWarningsSchema.parse({
        ...validDefinedTask,
        layer_action: "banana",
      })
    ).toThrow()
  })
})

describe("CatalogOwningEntityTypeSchema", () => {
  it("accepts the two entity types that can own a catalogue", () => {
    expect(CatalogOwningEntityTypeSchema.parse("refinancing_request")).toBe(
      "refinancing_request"
    )
    expect(CatalogOwningEntityTypeSchema.parse("redemption_request")).toBe(
      "redemption_request"
    )
  })

  // The Financing has actions, not a workflow, so no case_type derives it and the BE rejects
  // it at catalogue save (InvalidCaseTypeError). It stays in CatalogEntityTypeSchema because
  // the list filter still needs the full set.
  it("rejects financing, which cannot own a catalogue", () => {
    expect(() => CatalogOwningEntityTypeSchema.parse("financing")).toThrow()
    expect(CatalogEntityTypeSchema.parse("financing")).toBe("financing")
  })

  it("rejects an unknown entity type", () => {
    expect(() => CatalogOwningEntityTypeSchema.parse("banana")).toThrow()
  })
})

describe("CatalogCaseTypeItemSchema", () => {
  // PRD1042-1790 item 1 — the create dialog reads the scopeable case types rather than carrying its
  // own list. AC-94 fails an implementation wired to a fixed count of case types, so there is
  // deliberately no assertion here on how many the backend returns.
  it("accepts a case type with the entity type it derives", () => {
    const parsed = CatalogCaseTypeItemSchema.parse({
      case_type: "refinancing_request",
      entity_type: "refinancing_request",
    })
    expect(parsed.case_type).toBe("refinancing_request")
    expect(parsed.entity_type).toBe("refinancing_request")
  })

  it("accepts a case type that derives no entity type", () => {
    // Four of the seven derive none (CASE_TYPE_ENTITY_TYPE in the BE's enums.py), and the route
    // sends `.get(ct)` — i.e. null — for those. Requiring the key non-null here is what broke the
    // create dialog's case-type list once all seven were returned.
    const parsed = CatalogCaseTypeItemSchema.parse({
      case_type: "object_swap",
      entity_type: null,
    })
    expect(parsed.case_type).toBe("object_swap")
    expect(parsed.entity_type).toBeNull()
  })

  it("rejects the retired main_process value", () => {
    // The exact QA-reported failure: a 200 response the frontend turned into a ZodError, so the
    // whole catalogue list rendered its generic error state.
    expect(() =>
      CatalogCaseTypeItemSchema.parse({
        case_type: "main_process",
        entity_type: "refinancing_request",
      })
    ).toThrow()
  })

  it("rejects a case type outside the wire enum", () => {
    expect(() =>
      CatalogCaseTypeItemSchema.parse({
        case_type: "not_a_case_type",
        entity_type: "refinancing_request",
      })
    ).toThrow()
  })

  it("parses the list as a bare array", () => {
    const parsed = CatalogCaseTypeListSchema.parse([
      { case_type: "refinancing_request", entity_type: "refinancing_request" },
      { case_type: "package_redemption", entity_type: "redemption_request" },
    ])
    expect(parsed).toHaveLength(2)
  })
})

describe("CatalogOwningEntityTypeSchema", () => {
  // Financing is not a case type (PRD1042-1790), so no case type derives it and no catalogue can
  // carry it — which is why the list filter must not offer it.
  it("excludes financing", () => {
    expect(CatalogOwningEntityTypeSchema.options).not.toContain("financing")
    expect(() => CatalogOwningEntityTypeSchema.parse("financing")).toThrow()
  })
})

describe("TaskTypeSchema", () => {
  // PRD1042-1892 item 5 retired four_eyes_sign_off as a type: four eyes is a flag on the task plus
  // its exclusion set. The BE enum carries seven values and rejects the eighth, so offering it
  // could only ever produce a 422.
  it("carries the seven element types and not the retired sign-off", () => {
    expect(TaskTypeSchema.options).toHaveLength(7)
    expect(TaskTypeSchema.options).not.toContain("four_eyes_sign_off")
  })

  it("rejects the retired four_eyes_sign_off value", () => {
    expect(() => TaskTypeSchema.parse("four_eyes_sign_off")).toThrow()
  })

  it("still accepts checkbox, which is what a four-eyes sign-off now is", () => {
    expect(TaskTypeSchema.parse("checkbox")).toBe("checkbox")
  })
})

describe("CataloguePhaseSchema", () => {
  const validPhase = {
    id: PHASE_UUID,
    catalog_version_id: VERSION_UUID,
    name: "Phase A",
    position: 1,
    created_at: "2026-08-26T10:00:00Z",
    updated_at: "2026-08-26T10:00:00Z",
  }

  it("accepts a stage as the BE returns it", () => {
    const parsed = CataloguePhaseSchema.parse(validPhase)
    expect(parsed.name).toBe("Phase A")
    expect(parsed.position).toBe(1)
  })

  it("rejects a fractional position", () => {
    expect(() =>
      CataloguePhaseSchema.parse({ ...validPhase, position: 1.5 })
    ).toThrow()
  })

  // GET .../phases returns a bare array, not an envelope-wrapped page.
  it("parses the list as a bare array", () => {
    expect(CataloguePhaseListSchema.parse([validPhase])).toHaveLength(1)
    expect(CataloguePhaseListSchema.parse([])).toEqual([])
  })
})

describe("CreatePhaseRequestSchema", () => {
  it("accepts a name alone, letting the BE append at the end", () => {
    const parsed = CreatePhaseRequestSchema.parse({ name: "Phase B" })
    expect(parsed.position).toBeUndefined()
  })

  it("rejects an empty name", () => {
    expect(() => CreatePhaseRequestSchema.parse({ name: "" })).toThrow()
  })

  it("rejects a name past the BE's 80-character limit", () => {
    expect(() =>
      CreatePhaseRequestSchema.parse({ name: "x".repeat(81) })
    ).toThrow()
  })

  // The BE declares position with ge=1, so zero is not a valid first slot.
  it("rejects a zero position", () => {
    expect(() =>
      CreatePhaseRequestSchema.parse({ name: "Phase B", position: 0 })
    ).toThrow()
  })
})

describe("ReorderPhasesRequestSchema", () => {
  it("accepts a permutation of ids", () => {
    const parsed = ReorderPhasesRequestSchema.parse({
      ordered_phase_ids: [PHASE_UUID, PARENT_UUID],
    })
    expect(parsed.ordered_phase_ids).toHaveLength(2)
  })

  it("rejects an empty order", () => {
    expect(() =>
      ReorderPhasesRequestSchema.parse({ ordered_phase_ids: [] })
    ).toThrow()
  })
})

describe("RemovePhaseResponseSchema", () => {
  // removed=false with a task count is the BE asking for confirm=true, not a failure.
  it("accepts the unconfirmed response that reports a task count", () => {
    const parsed = RemovePhaseResponseSchema.parse({
      phase_id: PHASE_UUID,
      tasks_in_phase: 3,
      removed: false,
    })
    expect(parsed.removed).toBe(false)
    expect(parsed.tasks_in_phase).toBe(3)
  })

  it("accepts the confirmed removal of an empty stage", () => {
    const parsed = RemovePhaseResponseSchema.parse({
      phase_id: PHASE_UUID,
      tasks_in_phase: 0,
      removed: true,
    })
    expect(parsed.removed).toBe(true)
  })
})

describe("AddTaskRequestSchema — phase_id", () => {
  // task_service.py refuses a defined/supplement task with no phase_id
  // (422 WTC_TASK_PHASE_REQUIRED), which is why the form treats it as mandatory.
  it("accepts a phase_id", () => {
    const parsed = AddTaskRequestSchema.parse({
      layer_action: "defined",
      phase_id: PHASE_UUID,
    })
    expect(parsed.phase_id).toBe(PHASE_UUID)
  })

  it("rejects a non-uuid phase_id", () => {
    expect(() =>
      AddTaskRequestSchema.parse({ layer_action: "defined", phase_id: "A" })
    ).toThrow()
  })

  // Override and deactivated inherit the parent's stage, so the key is optional on the request.
  it("accepts an override with no phase_id", () => {
    expect(() =>
      AddTaskRequestSchema.parse({ layer_action: "override" })
    ).not.toThrow()
  })
})

describe("task type parameters (PRD1042-1894 Block 5)", () => {
  // The endpoint accepts a task with none of these, and `_activation_blockers` then refuses the
  // whole catalogue — so the frontend had to be able to author them or the catalogue was a dead
  // end with nothing on screen to fix.
  it("exposes the four state-transition outcomes", () => {
    expect(StateTransitionOutcomeSchema.options).toEqual([
      "committed",
      "rejected",
      "missing_information",
      "rework",
    ])
  })

  it("reads a generate task's document and trigger event", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      task_type: "generated_document",
      generated_document_ref: TEMPLATE_UUID,
      trigger_event: "offer_approved",
    })
    expect(parsed.generated_document_ref).toBe(TEMPLATE_UUID)
    expect(parsed.trigger_event).toBe("offer_approved")
  })

  it("reads a state-transition task's outcomes and entity", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      task_type: "state_transition",
      permitted_outcomes: ["committed", "rejected"],
      lifecycle_entity: "refinancing_request",
    })
    expect(parsed.permitted_outcomes).toEqual(["committed", "rejected"])
    expect(parsed.lifecycle_entity).toBe("refinancing_request")
  })

  it("rejects an outcome outside the enum", () => {
    expect(() =>
      TaskDefinitionItemSchema.parse({
        ...validDefinedTask,
        permitted_outcomes: ["approved"],
      })
    ).toThrow()
  })

  it("requires every type parameter to be present, even as null", () => {
    for (const field of [
      "generated_document_ref",
      "trigger_event",
      "permitted_outcomes",
      "lifecycle_entity",
      "capture_section_name",
    ]) {
      const payload: Record<string, unknown> = { ...validDefinedTask }
      delete payload[field]
      expect(() => TaskDefinitionItemSchema.parse(payload)).toThrow()
    }
  })

  it("accepts the parameters on an add request", () => {
    const parsed = AddTaskRequestSchema.parse({
      layer_action: "defined",
      task_type: "state_transition",
      permitted_outcomes: ["rework"],
      lifecycle_entity: "financing",
    })
    expect(parsed.permitted_outcomes).toEqual(["rework"])
  })

  // min(1): the activation blocker refuses `not t.permitted_outcomes`, so an empty array is the
  // same defect as omitting it.
  it("rejects an empty permitted_outcomes on an add request", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        permitted_outcomes: [],
      })
    ).toThrow()
  })

  it("rejects a trigger event past the BE's 50-character limit", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        trigger_event: "x".repeat(51),
      })
    ).toThrow()
  })
})

// --- PRD1042-1790 items 3/4 + PRD1042-1894 Block 3: the task fields the wire added ---

describe("TaskApplicabilitySchema", () => {
  it("accepts exactly the three wire values", () => {
    expect(TaskApplicabilitySchema.options).toEqual([
      "always",
      "rule",
      "person",
    ])
  })

  it("rejects anything else", () => {
    expect(() => TaskApplicabilitySchema.parse("sometimes")).toThrow()
  })
})

describe("ConditionOperatorSchema", () => {
  it("accepts exactly the six wire values", () => {
    expect(ConditionOperatorSchema.options).toEqual([
      "is",
      "is_not",
      "greater_than",
      "less_than",
      "at_least",
      "at_most",
    ])
  })
})

describe("DocumentCheckItemSchema", () => {
  it("accepts a documented row", () => {
    const parsed = DocumentCheckItemSchema.parse({
      document_ref: TEMPLATE_UUID,
      position: 0,
    })
    expect(parsed.position).toBe(0)
  })

  it("rejects a non-integer position", () => {
    expect(() =>
      DocumentCheckItemSchema.parse({
        document_ref: TEMPLATE_UUID,
        position: 1.5,
      })
    ).toThrow()
  })
})

describe("ConditionRowItemSchema", () => {
  it("accepts a row comparing against a literal", () => {
    const parsed = ConditionRowItemSchema.parse({
      field_registry_id: TEMPLATE_UUID,
      operator: "at_least",
      value_raw: "50000",
      value_config_ref: null,
    })
    expect(parsed.operator).toBe("at_least")
    expect(parsed.value_raw).toBe("50000")
  })

  it("accepts a row comparing against a configured value", () => {
    const parsed = ConditionRowItemSchema.parse({
      field_registry_id: TEMPLATE_UUID,
      operator: "is",
      value_raw: null,
      value_config_ref: CATALOG_UUID,
    })
    expect(parsed.value_config_ref).toBe(CATALOG_UUID)
  })

  it("rejects an unknown operator", () => {
    expect(() =>
      ConditionRowItemSchema.parse({
        field_registry_id: TEMPLATE_UUID,
        operator: "roughly",
      })
    ).toThrow()
  })
})

describe("FieldRegistryItemSchema", () => {
  const validField = {
    id: TEMPLATE_UUID,
    field_key: "financing_amount",
    field_type: "decimal",
    label: "Financing amount",
    data_available: true,
  }

  it("accepts the documented shape", () => {
    expect(FieldRegistryItemSchema.parse(validField).label).toBe(
      "Financing amount"
    )
  })

  it("requires data_available rather than defaulting it", () => {
    const withoutFlag: Record<string, unknown> = { ...validField }
    delete withoutFlag.data_available
    expect(() => FieldRegistryItemSchema.parse(withoutFlag)).toThrow()
  })

  it("parses the list as a bare array", () => {
    expect(FieldRegistryListSchema.parse([validField])).toHaveLength(1)
  })
})

describe("TaskDefinitionItemSchema — added wire fields", () => {
  // All non-nullable on the wire, so a missing key is a contract break rather than "no value" —
  // exactly the class of drift that produced the QA report this work started from.
  it.each([
    "four_eyes",
    "exclusion_task_ids",
    "four_eyes_exclusion_wide",
    "document_checks",
    "condition_rows",
  ])("requires %s to be present", key => {
    const without: Record<string, unknown> = { ...validDefinedTask }
    delete without[key]
    expect(() => TaskDefinitionItemSchema.parse(without)).toThrow()
  })

  it("accepts a null task_number for a row created before they existed", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      task_number: null,
    })
    expect(parsed.task_number).toBeNull()
  })

  it("reads a four-eyes step with both kinds of exclusion", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      four_eyes: true,
      four_eyes_exclusion_wide: true,
      exclusion_task_ids: [PARENT_UUID],
    })
    expect(parsed.four_eyes).toBe(true)
    expect(parsed.four_eyes_exclusion_wide).toBe(true)
    expect(parsed.exclusion_task_ids).toEqual([PARENT_UUID])
  })

  it("reads the document checks and condition rows it is sent", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      task_type: "typed_upload",
      applicability: "rule",
      document_checks: [{ document_ref: TEMPLATE_UUID, position: 1 }],
      condition_rows: [
        {
          field_registry_id: TEMPLATE_UUID,
          operator: "greater_than",
          value_raw: "100000",
          value_config_ref: null,
        },
      ],
    })
    expect(parsed.document_checks).toHaveLength(1)
    expect(parsed.condition_rows[0].operator).toBe("greater_than")
    expect(parsed.applicability).toBe("rule")
  })

  it("accepts a null applicability", () => {
    const parsed = TaskDefinitionItemSchema.parse({
      ...validDefinedTask,
      applicability: null,
    })
    expect(parsed.applicability).toBeNull()
  })
})

describe("AddTaskRequestSchema — added authorable fields", () => {
  it("accepts applicability and the two four-eyes flags", () => {
    const parsed = AddTaskRequestSchema.parse({
      layer_action: "defined",
      applicability: "person",
      four_eyes: true,
      four_eyes_exclusion_wide: true,
    })
    expect(parsed.applicability).toBe("person")
    expect(parsed.four_eyes).toBe(true)
  })

  // Every one of them is optional: the BE stores `always` / false for a task that omits them, and
  // the sheet deliberately omits applicability on an override, where the key is refused outright.
  it("accepts a payload carrying none of them", () => {
    const parsed = AddTaskRequestSchema.parse({ layer_action: "defined" })
    expect(parsed.applicability).toBeUndefined()
    expect(parsed.four_eyes).toBeUndefined()
  })

  it("rejects an unknown applicability", () => {
    expect(() =>
      AddTaskRequestSchema.parse({
        layer_action: "defined",
        applicability: "occasionally",
      })
    ).toThrow()
  })

  // The PATCH shape is derived from this one, so the new fields must reach it too.
  it("carries the new fields through to UpdateTaskRequestSchema", () => {
    const parsed = UpdateTaskRequestSchema.parse({
      applicability: "always",
      four_eyes: false,
      four_eyes_exclusion_wide: false,
    })
    expect(parsed.applicability).toBe("always")
  })
})

// PRD1042-2148 — suspend is the one lifecycle transition with its own response shape: it reports
// the cases already resolved against the catalogue rather than returning the catalogue.
describe("SuspendCatalogResponseSchema", () => {
  const valid = {
    catalog_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    catalog_state: "suspended",
    product_template_id: null,
    affected_case_ids: [],
  }

  it("accepts the documented shape", () => {
    const parsed = SuspendCatalogResponseSchema.parse(valid)
    expect(parsed.catalog_state).toBe("suspended")
    expect(parsed.affected_case_ids).toEqual([])
  })

  it("accepts affected case ids and a product template", () => {
    const parsed = SuspendCatalogResponseSchema.parse({
      ...valid,
      product_template_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3302",
      affected_case_ids: ["3f2504e0-4f89-41d3-9a0c-0305e82c3303"],
    })
    expect(parsed.affected_case_ids).toHaveLength(1)
  })

  it("rejects a catalog_state outside the enum", () => {
    expect(() =>
      SuspendCatalogResponseSchema.parse({ ...valid, catalog_state: "paused" })
    ).toThrow()
  })

  it("rejects a non-uuid in affected_case_ids", () => {
    expect(() =>
      SuspendCatalogResponseSchema.parse({
        ...valid,
        affected_case_ids: ["not-a-uuid"],
      })
    ).toThrow()
  })

  it("rejects a missing affected_case_ids", () => {
    expect(() =>
      SuspendCatalogResponseSchema.parse({
        catalog_id: valid.catalog_id,
        catalog_state: valid.catalog_state,
        product_template_id: valid.product_template_id,
      })
    ).toThrow()
  })
})
