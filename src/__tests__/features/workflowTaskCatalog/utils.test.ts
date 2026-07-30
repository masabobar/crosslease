import { describe, it, expect } from "vitest"
import {
  deriveFieldDelta,
  toUpdateTaskBody,
} from "@/features/workflowTaskCatalog/utils"
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

describe("toUpdateTaskBody", () => {
  // The sheet builds one payload for both create and edit, so an edit payload still carries the
  // immutable fields. The UpdateTaskRequest annotation does not remove them at runtime — this does.
  it.each(["layer_action", "task_code", "parent_task_id"])(
    "drops the immutable field %s",
    field => {
      const body = toUpdateTaskBody({
        task_name: "Renamed",
        [field]: field === "layer_action" ? "override" : "RED-001",
      } as never) as Record<string, unknown>

      expect(field in body).toBe(false)
      expect(body.task_name).toBe("Renamed")
    }
  )

  it("keeps every mutable field an override edit sends", () => {
    // The exact shape toWirePayload produces for an override, plus the parent it must not send.
    const body = toUpdateTaskBody({
      parent_task_id: "54415cbd-e2a4-4a8f-ae45-2a2b8247f6b8",
      is_mandatory: false,
      weight: 8.25,
      responsible_role: "back_office_risk",
      display_order: 20,
      stage_categorization: "redemption",
      is_active: true,
    } as never)

    expect(body).toEqual({
      is_mandatory: false,
      weight: 8.25,
      responsible_role: "back_office_risk",
      display_order: 20,
      stage_categorization: "redemption",
      is_active: true,
    })
  })

  it("passes out-of-range values through instead of validating them", () => {
    // Deliberate: the BE's VALIDATION_ERROR carries the field, which applyApiFieldErrors maps onto
    // the form. Validating here would throw a non-ApiError and degrade that to a generic toast.
    const body = toUpdateTaskBody({
      task_name: "x".repeat(301),
      weight: -5,
    } as never) as Record<string, unknown>

    expect((body.task_name as string).length).toBe(301)
    expect(body.weight).toBe(-5)
  })
})
