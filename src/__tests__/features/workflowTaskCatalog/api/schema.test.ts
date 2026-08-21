import { describe, it, expect } from "vitest"
import {
  AddTaskRequestSchema,
  AuditTrailResponseSchema,
  CaseTypeSchema,
  CatalogDetailResponseSchema,
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
  CatalogListItemSchema,
  CatalogListResponseSchema,
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
  case_type: "main_process",
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
  case_type: "main_process",
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
    // PRD1042-1790 item 1 — only main_process/package_redemption carry a checklist in the
    // November MVP; the other five are modeled because the wire sends them, not because
    // this app builds anything for them yet.
    expect(CaseTypeSchema.options).toEqual([
      "main_process",
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
        case_type: "main_process",
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
        case_type: "main_process",
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
      case_type: "main_process",
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
        case_type: "main_process",
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

// A `defined` row: the Global Default layer's own entry, so it carries real values.
const validDefinedTask = {
  id: TASK_UUID,
  catalog_version_id: VERSION_UUID,
  layer_action: "defined",
  task_code: "LEG-001",
  task_name: "Legal notice of assignment",
  task_description: "Send the notice to the lessee.",
  category: "legal",
  responsible_role: "front_office",
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
