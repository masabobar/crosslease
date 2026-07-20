import { describe, it, expect } from "vitest"
import { getEventTypeDisplay } from "@/features/notifications/constants"

describe("getEventTypeDisplay", () => {
  it("returns the mapped keys for a known event type", () => {
    const result = getEventTypeDisplay("task.assigned")
    expect(result.titleKey).toBe("eventType.taskAssigned")
    expect(result.groupKey).toBe("group.workflow")
  })

  it("falls back to the raw event type for an unmapped value", () => {
    const result = getEventTypeDisplay("some.future_event")
    expect(result.titleKey).toBeNull()
    expect(result.groupKey).toBeNull()
    expect(result.fallback).toBe("some.future_event")
  })
})
