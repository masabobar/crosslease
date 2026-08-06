import { describe, it, expect } from "vitest"
import { requiredEnum, requiredNumber } from "@/lib/zodHelpers"

describe("requiredEnum", () => {
  const schema = requiredEnum(["draft", "active", "archived"])

  it("accepts every option it was given", () => {
    expect(schema.parse("draft")).toBe("draft")
    expect(schema.parse("active")).toBe("active")
    expect(schema.parse("archived")).toBe("archived")
  })

  it("rejects a value outside the options", () => {
    expect(schema.safeParse("banana").success).toBe(false)
  })

  it("rejects undefined — the unselected-field case", () => {
    expect(schema.safeParse(undefined).success).toBe(false)
  })

  it("rejects null", () => {
    expect(schema.safeParse(null).success).toBe(false)
  })

  it("rejects a non-string type", () => {
    expect(schema.safeParse(1).success).toBe(false)
  })

  it("emits the 'required' message code instead of Zod's default", () => {
    const result = schema.safeParse(undefined)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("required")
    }
  })

  it("emits the 'required' message code for an out-of-range value too", () => {
    const result = schema.safeParse("banana")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("required")
    }
  })

  it("exposes the original options for reuse", () => {
    expect(schema.options).toEqual(["draft", "active", "archived"])
  })
})

describe("requiredNumber", () => {
  const schema = requiredNumber()

  it("accepts a number", () => {
    expect(schema.parse(25_000_000)).toBe(25_000_000)
  })

  it("emits the 'required' message code for NaN — the emptied-input case", () => {
    const result = schema.safeParse(Number.NaN)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("required")
    }
  })

  it("emits the 'required' message code for undefined", () => {
    const result = schema.safeParse(undefined)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("required")
    }
  })

  it("emits the 'required' message code for a numeric string", () => {
    const result = schema.safeParse("42")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("required")
    }
  })

  // The type-level message must not swallow a bound's own message code.
  it("keeps a chained constraint's message", () => {
    const bounded = requiredNumber().gt(0, "mustBePositive")
    const result = bounded.safeParse(-3)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("mustBePositive")
    }
  })
})
