import { describe, expect, it } from "vitest"
import {
  ChecklistCloseActorSchema,
  ChecklistItemCheckResponseSchema,
  ChecklistItemResponseSchema,
  ChecklistItemStatusSchema,
  DocumentCheckMarkSchema,
  PhaseGateResponseSchema,
  PhaseGateStatusSchema,
  RequiredProjectionResponseSchema,
  SetItemStatusRequestSchema,
  SetPhaseGateRequestSchema,
  SettableChecklistItemStatusSchema,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"

// Several tests assert that an ABSENT key throws, which is a different claim from a null one —
// every key on these responses is required-but-nullable. Built by deleting from a copy rather than
// by destructuring-and-discarding, because the project's no-unused-vars rule exempts only function
// arguments, not unused destructured bindings.
function omitKey<T extends object, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  const copy: Partial<T> = { ...obj }
  delete copy[key]
  return copy as Omit<T, K>
}

const ITEM_ID = "11111111-1111-4111-8111-111111111111"
const CASE_ID = "22222222-2222-4222-8222-222222222222"
const TASK_ID = "33333333-3333-4333-8333-333333333333"
const USER_ID = "44444444-4444-4444-8444-444444444444"

// Mirrors ChecklistItemResponse as openapi.json documents it: all eleven keys present, most
// nullable, and `weight` arriving as a decimal string rather than a number.
const validItem = {
  id: ITEM_ID,
  business_object_id: CASE_ID,
  source_catalog_task_id: TASK_ID,
  task_code: "WTC-001",
  task_name: "Contact Treasury",
  is_mandatory: true,
  weight: "2.50",
  status: "open",
  note: null,
  checked_by: null,
  checked_at: null,
}

describe("ChecklistItemStatusSchema", () => {
  it("accepts the three documented statuses", () => {
    expect(ChecklistItemStatusSchema.parse("open")).toBe("open")
    expect(ChecklistItemStatusSchema.parse("checked")).toBe("checked")
    expect(ChecklistItemStatusSchema.parse("not_applicable")).toBe(
      "not_applicable"
    )
  })

  it("rejects a status the wire does not define", () => {
    expect(() => ChecklistItemStatusSchema.parse("waived")).toThrow()
  })
})

describe("SettableChecklistItemStatusSchema", () => {
  // `open` is excluded deliberately: set_item_status refuses it (and any other re-set) with
  // WTC_CHECKLIST_ITEM_IMMUTABLE, so it must not be offerable.
  it("excludes open, which is not settable", () => {
    expect(() => SettableChecklistItemStatusSchema.parse("open")).toThrow()
  })

  it("still accepts checked and not_applicable", () => {
    expect(SettableChecklistItemStatusSchema.parse("checked")).toBe("checked")
    expect(SettableChecklistItemStatusSchema.parse("not_applicable")).toBe(
      "not_applicable"
    )
  })
})

describe("ChecklistItemResponseSchema", () => {
  it("parses the documented shape", () => {
    const parsed = ChecklistItemResponseSchema.parse(validItem)
    expect(parsed.task_code).toBe("WTC-001")
    expect(parsed.is_mandatory).toBe(true)
  })

  it("coerces weight from the wire's decimal string to a number", () => {
    expect(ChecklistItemResponseSchema.parse(validItem).weight).toBe(2.5)
  })

  it("accepts null for every nullable key", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      task_code: null,
      task_name: null,
      weight: null,
      note: null,
      checked_by: null,
      checked_at: null,
    })
    expect(parsed.task_name).toBeNull()
    expect(parsed.weight).toBeNull()
  })

  // responsible_role and display_order arrived 2026-08-07 (PRD1042-1790) and closed Q-052. They are
  // absent from the contract's `required` array, so a missing key is as valid as an explicit null.
  it("reads responsible_role and display_order when the wire sends them", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      responsible_role: "back_office_risk",
      display_order: 3,
    })
    expect(parsed.responsible_role).toBe("back_office_risk")
    expect(parsed.display_order).toBe(3)
  })

  it("accepts both omitted, since neither is required on the wire", () => {
    const parsed = ChecklistItemResponseSchema.parse(validItem)
    expect(parsed.responsible_role).toBeUndefined()
    expect(parsed.display_order).toBeUndefined()
  })

  it("accepts an explicit null for both", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      responsible_role: null,
      display_order: null,
    })
    expect(parsed.responsible_role).toBeNull()
    expect(parsed.display_order).toBeNull()
  })

  // TaskResponsibleRole is not UserRole — they overlap only on front_office. A UserRole value that
  // is not a task role must not slip through, or a role-scoped gate would silently compare across
  // two vocabularies.
  it("rejects a UserRole value that is not a TaskResponsibleRole", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({
        ...validItem,
        responsible_role: "bank_power_user",
      })
    ).toThrow()
  })

  it("rejects a non-integer display_order", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({ ...validItem, display_order: 1.5 })
    ).toThrow()
  })

  it("accepts a settled item with actor and timestamp", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      status: "checked",
      note: "Confirmed by phone",
      checked_by: USER_ID,
      checked_at: "2026-08-03T09:33:04.107000Z",
    })
    expect(parsed.checked_by).toBe(USER_ID)
  })

  // Nullable is not the same as optional — these keys are required on the wire, so an absent key
  // is bad data and must throw rather than silently become undefined.
  it("rejects an absent nullable key", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse(omitKey(validItem, "task_name"))
    ).toThrow()
  })

  it("rejects a missing required key", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse(omitKey(validItem, "is_mandatory"))
    ).toThrow()
  })

  it("rejects is_mandatory sent as a string", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({ ...validItem, is_mandatory: "true" })
    ).toThrow()
  })

  it("rejects a non-uuid id", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({ ...validItem, id: "not-a-uuid" })
    ).toThrow()
  })

  it("rejects an unknown status value", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({ ...validItem, status: "banana" })
    ).toThrow()
  })
})

describe("SetItemStatusRequestSchema", () => {
  it("accepts a status with no note", () => {
    expect(SetItemStatusRequestSchema.parse({ status: "checked" })).toEqual({
      status: "checked",
    })
  })

  it("accepts an explicit null note", () => {
    const parsed = SetItemStatusRequestSchema.parse({
      status: "not_applicable",
      note: null,
    })
    expect(parsed.note).toBeNull()
  })

  it("rejects open as a target status", () => {
    expect(() => SetItemStatusRequestSchema.parse({ status: "open" })).toThrow()
  })

  it("rejects a missing status", () => {
    expect(() => SetItemStatusRequestSchema.parse({ note: "why" })).toThrow()
  })
})

describe("RequiredProjectionResponseSchema", () => {
  it("parses the documented shape", () => {
    const parsed = RequiredProjectionResponseSchema.parse({
      business_object_id: CASE_ID,
      all_required_done: false,
      required_items: [validItem],
    })
    expect(parsed.all_required_done).toBe(false)
    expect(parsed.required_items).toHaveLength(1)
  })

  it("accepts an empty required set", () => {
    const parsed = RequiredProjectionResponseSchema.parse({
      business_object_id: CASE_ID,
      all_required_done: true,
      required_items: [],
    })
    expect(parsed.required_items).toEqual([])
  })

  it("rejects all_required_done sent as a string", () => {
    expect(() =>
      RequiredProjectionResponseSchema.parse({
        business_object_id: CASE_ID,
        all_required_done: "false",
        required_items: [],
      })
    ).toThrow()
  })
})

describe("PhaseGateStatusSchema", () => {
  it("accepts the four documented statuses", () => {
    for (const status of ["open", "in_review", "approved", "rejected"]) {
      expect(PhaseGateStatusSchema.parse(status)).toBe(status)
    }
  })

  it("rejects a status the wire does not define", () => {
    expect(() => PhaseGateStatusSchema.parse("cancelled")).toThrow()
  })
})

describe("PhaseGateResponseSchema", () => {
  const validGate = {
    phase: "pre_submission",
    status: "approved",
    gate_approver: USER_ID,
    decided_at: "2026-08-03T09:33:04.107000Z",
    note: null,
  }

  it("parses the documented shape", () => {
    expect(PhaseGateResponseSchema.parse(validGate).phase).toBe(
      "pre_submission"
    )
  })

  it("accepts an undecided gate with null approver and timestamp", () => {
    const parsed = PhaseGateResponseSchema.parse({
      ...validGate,
      status: "open",
      gate_approver: null,
      decided_at: null,
    })
    expect(parsed.gate_approver).toBeNull()
  })

  // `phase` reuses StageCategorizationSchema rather than redeclaring the six values, so this also
  // guards that the import did not drift from the wire enum.
  it("rejects a phase outside StageCategorization", () => {
    expect(() =>
      PhaseGateResponseSchema.parse({ ...validGate, phase: "disbursement" })
    ).toThrow()
  })

  it("rejects a missing required key", () => {
    expect(() =>
      PhaseGateResponseSchema.parse(omitKey(validGate, "note"))
    ).toThrow()
  })
})

describe("SetPhaseGateRequestSchema", () => {
  // Unlike the checklist item, every gate status is settable — the terminal-approved rule is
  // enforced per gate at the call site, not by narrowing this enum.
  it("accepts every gate status", () => {
    for (const status of ["open", "in_review", "approved", "rejected"]) {
      expect(SetPhaseGateRequestSchema.parse({ status }).status).toBe(status)
    }
  })

  it("rejects a missing status", () => {
    expect(() => SetPhaseGateRequestSchema.parse({ note: "why" })).toThrow()
  })
})

// --- PRD1042-1894 / 1790: the fields the case item gained ---

describe("ChecklistCloseActorSchema", () => {
  it("accepts exactly the two wire values", () => {
    expect(ChecklistCloseActorSchema.options).toEqual(["person", "system"])
  })

  it("rejects anything else", () => {
    expect(() => ChecklistCloseActorSchema.parse("robot")).toThrow()
  })
})

describe("DocumentCheckMarkSchema", () => {
  it("accepts exactly the three wire values", () => {
    expect(DocumentCheckMarkSchema.options).toEqual([
      "in_order",
      "not_in_order",
      "not_applicable",
    ])
  })
})

describe("ChecklistItemCheckResponseSchema", () => {
  const validCheck = {
    id: ITEM_ID,
    source_document_check_id: TASK_ID,
    document_ref: CASE_ID,
    position: 1,
    mark: null,
    note: null,
    marked_by: null,
    marked_at: null,
  }

  it("accepts an unmarked check", () => {
    const parsed = ChecklistItemCheckResponseSchema.parse(validCheck)
    expect(parsed.mark).toBeNull()
    expect(parsed.position).toBe(1)
  })

  it("accepts a marked check", () => {
    const parsed = ChecklistItemCheckResponseSchema.parse({
      ...validCheck,
      mark: "in_order",
      marked_by: USER_ID,
      marked_at: "2026-08-27T09:00:00Z",
    })
    expect(parsed.mark).toBe("in_order")
  })

  it("rejects an unknown mark", () => {
    expect(() =>
      ChecklistItemCheckResponseSchema.parse({ ...validCheck, mark: "maybe" })
    ).toThrow()
  })
})

describe("ChecklistItemResponseSchema — added optional fields", () => {
  // These arrived after the original eleven and are absent from the contract's `required` array,
  // so a payload without any of them must still parse — that is what keeps the screen working
  // against an older backend.
  it("still parses a payload carrying none of them", () => {
    const parsed = ChecklistItemResponseSchema.parse(validItem)
    expect(parsed.stage_categorization).toBeUndefined()
    expect(parsed.task_type).toBeUndefined()
    expect(parsed.applicability).toBeUndefined()
    expect(parsed.checked_by_type).toBeUndefined()
  })

  it("defaults four_eyes to false and checks to an empty array", () => {
    const parsed = ChecklistItemResponseSchema.parse(validItem)
    expect(parsed.four_eyes).toBe(false)
    expect(parsed.checks).toEqual([])
  })

  it("reads the stage, type, applicability and four-eyes flag when sent", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      stage_categorization: "stage_1_review",
      task_type: "typed_upload",
      applicability: "rule",
      four_eyes: true,
      doc_requirement_ref: TASK_ID,
    })
    expect(parsed.stage_categorization).toBe("stage_1_review")
    expect(parsed.task_type).toBe("typed_upload")
    expect(parsed.applicability).toBe("rule")
    expect(parsed.four_eyes).toBe(true)
  })

  // The distinction the "Settled by" column depends on: a system close leaves checked_by null,
  // so without checked_by_type it is indistinguishable from an item nobody has touched.
  it("distinguishes a system close from an untouched item", () => {
    const systemClosed = ChecklistItemResponseSchema.parse({
      ...validItem,
      status: "checked",
      checked_by: null,
      checked_by_type: "system",
    })
    expect(systemClosed.checked_by).toBeNull()
    expect(systemClosed.checked_by_type).toBe("system")

    const untouched = ChecklistItemResponseSchema.parse(validItem)
    expect(untouched.checked_by_type).toBeUndefined()
  })

  it("reads the role set as the full platform enum", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      responsible_roles: ["bank_power_user"],
    })
    expect(parsed.responsible_roles).toEqual(["bank_power_user"])
  })

  it("rejects a role outside the platform enum", () => {
    expect(() =>
      ChecklistItemResponseSchema.parse({
        ...validItem,
        responsible_roles: ["back_office_risk"],
      })
    ).toThrow()
  })

  it("parses the nested checks it is sent", () => {
    const parsed = ChecklistItemResponseSchema.parse({
      ...validItem,
      checks: [
        {
          id: ITEM_ID,
          source_document_check_id: TASK_ID,
          document_ref: CASE_ID,
          position: 1,
          mark: "in_order",
          note: null,
          marked_by: USER_ID,
          marked_at: "2026-08-27T09:00:00Z",
        },
      ],
    })
    expect(parsed.checks).toHaveLength(1)
    expect(parsed.checks[0].mark).toBe("in_order")
  })
})
