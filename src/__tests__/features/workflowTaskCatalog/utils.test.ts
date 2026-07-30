import { describe, it, expect } from "vitest"
import { deriveFieldDelta } from "@/features/workflowTaskCatalog/utils"
import type { AuditTrailEventItem } from "@/features/workflowTaskCatalog/api/schema"

function event(overrides: Partial<AuditTrailEventItem>): AuditTrailEventItem {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    event_type: "wtc_catalog.task_updated",
    action_type: "update",
    actor_id: "22222222-2222-2222-2222-222222222222",
    actor_role_at_time: "bank_power_user",
    actor_display: null,
    recorded_at: "2026-07-30T16:04:05.407580Z",
    entity_display: "RED-001",
    old_data: null,
    new_data: null,
    changed_fields: null,
    ...overrides,
  }
}

describe("deriveFieldDelta", () => {
  it("returns only the fields whose value actually differs", () => {
    // The shape the catalogue endpoint really sends for a task update: changed_fields is null
    // and the payloads carry the touched fields, only one of which moved.
    const delta = deriveFieldDelta(
      event({
        old_data: { weight: 9.75, is_active: true, is_mandatory: null },
        new_data: { weight: 9.75, is_active: true, is_mandatory: false },
      })
    )

    expect(delta).toEqual([
      { field: "is_mandatory", before: null, after: false },
    ])
  })

  it("returns no delta for a create, which has no old_data", () => {
    expect(
      deriveFieldDelta(
        event({
          event_type: "wtc_catalog.task_added",
          action_type: "create",
          new_data: { task_code: "RED-900", weight: 3 },
        })
      )
    ).toEqual([])
  })

  it("returns no delta when both payloads are absent", () => {
    expect(deriveFieldDelta(event({}))).toEqual([])
  })

  it("picks up a field present in only one payload", () => {
    const delta = deriveFieldDelta(
      event({
        old_data: {},
        new_data: { conditional_trigger: "financing_amount_over_threshold" },
      })
    )

    expect(delta).toEqual([
      {
        field: "conditional_trigger",
        before: undefined,
        after: "financing_amount_over_threshold",
      },
    ])
  })

  it("treats a null-to-undefined move as unchanged", () => {
    expect(
      deriveFieldDelta(event({ old_data: { weight: null }, new_data: {} }))
    ).toEqual([])
  })

  it("compares list values structurally", () => {
    const unchanged = deriveFieldDelta(
      event({
        old_data: { applicable_process_contexts: ["redemption"] },
        new_data: { applicable_process_contexts: ["redemption"] },
      })
    )
    expect(unchanged).toEqual([])

    const changed = deriveFieldDelta(
      event({
        old_data: { applicable_process_contexts: ["redemption"] },
        new_data: { applicable_process_contexts: ["redemption", "servicing"] },
      })
    )
    expect(changed).toEqual([
      {
        field: "applicable_process_contexts",
        before: ["redemption"],
        after: ["redemption", "servicing"],
      },
    ])
  })

  it("honours changed_fields when the writer populates it, still dropping equal values", () => {
    const delta = deriveFieldDelta(
      event({
        changed_fields: ["weight", "is_active"],
        old_data: { weight: 1.5, is_active: true, display_order: 10 },
        new_data: { weight: 2.5, is_active: true, display_order: 99 },
      })
    )

    // display_order moved but was not declared changed, so it is not reported; is_active was
    // declared but did not move, so it is dropped.
    expect(delta).toEqual([{ field: "weight", before: 1.5, after: 2.5 }])
  })
})
