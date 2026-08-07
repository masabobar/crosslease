import { describe, it, expect } from "vitest"
import { partialMatchKey } from "@tanstack/react-query"
import { TENANTS_QUERY_KEYS } from "@/features/tenants/api/tenantsApi"

// React Query matches an invalidation filter against a query key by prefix, comparing
// each element of the filter key. `list()` with no argument still emits a third
// element — `undefined` — and `undefined` does not match a params object, so
// invalidating it silently misses every list query that carries params.
//
// mutations.test.ts cannot catch this: it mocks TENANTS_QUERY_KEYS, and
// `toHaveBeenCalledWith` ignores a trailing `undefined` anyway. These assertions run
// against the real factory and the real matcher.
describe("TENANTS_QUERY_KEYS", () => {
  const LIST_PARAMS = { page: 1, per_page: 20, status: ["active"] }

  it("emits a two-element prefix from lists()", () => {
    expect(TENANTS_QUERY_KEYS.lists()).toEqual(["tenants", "list"])
  })

  it("invalidating lists() matches a params-bearing list query", () => {
    expect(
      partialMatchKey(
        TENANTS_QUERY_KEYS.list(LIST_PARAMS),
        TENANTS_QUERY_KEYS.lists()
      )
    ).toBe(true)
  })

  it("invalidating lists() also matches the param-less list query", () => {
    expect(
      partialMatchKey(TENANTS_QUERY_KEYS.list(), TENANTS_QUERY_KEYS.lists())
    ).toBe(true)
  })

  // The regression itself: this is what the four lifecycle mutations used to do.
  it("invalidating list() would NOT match a params-bearing list query", () => {
    expect(
      partialMatchKey(
        TENANTS_QUERY_KEYS.list(LIST_PARAMS),
        TENANTS_QUERY_KEYS.list()
      )
    ).toBe(false)
  })

  it("scopes the per-tenant keys by id", () => {
    const id = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
    expect(TENANTS_QUERY_KEYS.detail(id)).toEqual(["tenants", "detail", id])
    expect(TENANTS_QUERY_KEYS.modules(id)).toEqual(["tenants", "modules", id])
    expect(TENANTS_QUERY_KEYS.grants(id)).toEqual(["tenants", "grants", id])
  })
})
