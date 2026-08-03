import { describe, expect, it } from "vitest"
import {
  ChecklistItemResponseSchema,
  ChecklistItemStatusSchema,
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
