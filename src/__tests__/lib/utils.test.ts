import { describe, it, expect } from "vitest"
import { cn, optionalNumber, safeImageUrl } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    const active = false
    expect(cn("foo", active && "bar")).toBe("foo")
  })
})

describe("optionalNumber", () => {
  it("returns undefined for an emptied input", () => {
    expect(optionalNumber("")).toBeUndefined()
  })

  it("parses an integer", () => {
    expect(optionalNumber("42")).toBe(42)
  })

  it("parses a decimal", () => {
    expect(optionalNumber("0.75")).toBe(0.75)
  })

  it("parses a negative value — the bound belongs to the schema, not here", () => {
    expect(optionalNumber("-3")).toBe(-3)
  })

  it("yields NaN for non-numeric text, so the schema rejects it", () => {
    expect(optionalNumber("abc")).toBeNaN()
  })

  // The whole reason this exists: undefined passes an .optional() field, NaN does not.
  it("never returns NaN for the blank case", () => {
    expect(Number.isNaN(optionalNumber("") as number)).toBe(false)
  })
})

describe("safeImageUrl", () => {
  it("passes an https URL through", () => {
    expect(safeImageUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png"
    )
  })

  it("passes an own-origin path through", () => {
    expect(safeImageUrl("/static/avatar.png")).toBe("/static/avatar.png")
  })

  // The point of the helper: these two schemes must never reach an `src` attribute.
  it("drops a javascript: URL", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBeNull()
  })

  it("drops a data: URL", () => {
    expect(safeImageUrl("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull()
  })

  it("drops an unparseable value", () => {
    expect(safeImageUrl("not a url")).toBeNull()
  })

  // Null and undefined are passed straight back so callers keep their own empty-state check.
  it("returns null and undefined unchanged", () => {
    expect(safeImageUrl(null)).toBeNull()
    expect(safeImageUrl(undefined)).toBeUndefined()
  })
})
