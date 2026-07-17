import { describe, it, expect } from "vitest"
import { buildQueryString } from "@/lib/queryParams"

describe("buildQueryString", () => {
  it("returns an empty string when all params are undefined or null", () => {
    expect(buildQueryString({ a: undefined, b: null })).toBe("")
  })

  it("omits undefined and null values but keeps the rest", () => {
    expect(buildQueryString({ a: undefined, b: null, c: "x" })).toBe("?c=x")
  })

  it("includes a numeric 0 value instead of dropping it", () => {
    expect(buildQueryString({ page: 0 })).toBe("?page=0")
  })

  it("includes an empty string value instead of dropping it", () => {
    expect(buildQueryString({ search: "" })).toBe("?search=")
  })

  it("serializes boolean values as 'true'/'false'", () => {
    expect(buildQueryString({ active: true, archived: false })).toBe(
      "?active=true&archived=false"
    )
  })

  it("serializes string arrays as repeated keys", () => {
    expect(buildQueryString({ role: ["admin", "auditor"] })).toBe(
      "?role=admin&role=auditor"
    )
  })

  it("omits a key entirely for an empty array", () => {
    expect(buildQueryString({ role: [] })).toBe("")
  })

  it("serializes numbers and strings together", () => {
    expect(buildQueryString({ page: 2, per_page: 20, search: "acme" })).toBe(
      "?page=2&per_page=20&search=acme"
    )
  })
})
