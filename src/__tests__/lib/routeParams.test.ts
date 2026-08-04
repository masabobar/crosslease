import { describe, it, expect } from "vitest"
import { isUuidRouteParam, isVersionNumberRouteParam } from "@/lib/routeParams"

describe("isUuidRouteParam", () => {
  it("accepts a lowercase UUID", () => {
    expect(isUuidRouteParam("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true)
  })

  it("accepts an uppercase UUID", () => {
    expect(isUuidRouteParam("3F2504E0-4F89-41D3-9A0C-0305E82C3301")).toBe(true)
  })

  it("accepts the nil UUID", () => {
    expect(isUuidRouteParam("00000000-0000-0000-0000-000000000000")).toBe(true)
  })

  // The literal reason this guard exists: `/framework-agreements/create` is a mistyped
  // `/new`, and it matches the detail route's `:id`.
  it("rejects a path segment mistaken for an id", () => {
    expect(isUuidRouteParam("create")).toBe(false)
  })

  it("rejects undefined", () => {
    expect(isUuidRouteParam(undefined)).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isUuidRouteParam("")).toBe(false)
  })

  it("rejects a UUID with a wrong segment length", () => {
    expect(isUuidRouteParam("3f2504e0-4f89-41d3-9a0c-0305e82c330")).toBe(false)
  })

  it("rejects a UUID missing its separators", () => {
    expect(isUuidRouteParam("3f2504e04f8941d39a0c0305e82c3301")).toBe(false)
  })

  it("rejects a brace-wrapped UUID", () => {
    expect(isUuidRouteParam("{3f2504e0-4f89-41d3-9a0c-0305e82c3301}")).toBe(
      false
    )
  })

  it("rejects a UUID with surrounding whitespace", () => {
    expect(isUuidRouteParam(" 3f2504e0-4f89-41d3-9a0c-0305e82c3301 ")).toBe(
      false
    )
  })

  it("rejects non-hex characters in an otherwise valid shape", () => {
    expect(isUuidRouteParam("3f2504e0-4f89-41d3-9a0c-0305e82c33zz")).toBe(false)
  })
})

describe("isVersionNumberRouteParam", () => {
  it("accepts a single-digit version", () => {
    expect(isVersionNumberRouteParam("1")).toBe(true)
  })

  it("accepts a multi-digit version", () => {
    expect(isVersionNumberRouteParam("42")).toBe(true)
  })

  it("rejects zero — versions start at 1", () => {
    expect(isVersionNumberRouteParam("0")).toBe(false)
  })

  it("rejects a leading zero", () => {
    expect(isVersionNumberRouteParam("01")).toBe(false)
  })

  it("rejects undefined", () => {
    expect(isVersionNumberRouteParam(undefined)).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isVersionNumberRouteParam("")).toBe(false)
  })

  it("rejects a negative number", () => {
    expect(isVersionNumberRouteParam("-1")).toBe(false)
  })

  it("rejects a decimal", () => {
    expect(isVersionNumberRouteParam("1.5")).toBe(false)
  })

  it("rejects a non-numeric string", () => {
    expect(isVersionNumberRouteParam("latest")).toBe(false)
  })

  // The old major/minor scheme wrote "0.1"; sequential versioning replaced it, so a
  // stale link carrying that shape must not resolve.
  it("rejects a legacy major/minor version number", () => {
    expect(isVersionNumberRouteParam("0.1")).toBe(false)
  })
})
