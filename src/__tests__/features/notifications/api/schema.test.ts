import { describe, it, expect } from "vitest"
import { NotificationConfigSchema } from "@/features/notifications/api/schema"

const validConfig = {
  event_types: ["task.assigned", "task.reassigned"],
  categories: ["APPROVAL", "TASK"],
  priorities: ["HIGH", "STANDARD", "INFORMATIONAL"],
}

describe("NotificationConfigSchema", () => {
  it("accepts a valid config", () => {
    expect(() => NotificationConfigSchema.parse(validConfig)).not.toThrow()
  })

  it("accepts empty arrays", () => {
    expect(() =>
      NotificationConfigSchema.parse({
        event_types: [],
        categories: [],
        priorities: [],
      })
    ).not.toThrow()
  })

  it("rejects missing event_types", () => {
    expect(() =>
      NotificationConfigSchema.parse({
        categories: validConfig.categories,
        priorities: validConfig.priorities,
      })
    ).toThrow()
  })

  it("rejects non-string entries in event_types", () => {
    expect(() =>
      NotificationConfigSchema.parse({
        ...validConfig,
        event_types: [1, 2],
      })
    ).toThrow()
  })
})
