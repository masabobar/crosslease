import { describe, expect, it } from "vitest"
import {
  canRemove,
  headerCheckState,
  pruneSelection,
  toggleAll,
  toggleOne,
} from "@/features/cases/contractSelection"

const IDS = ["a", "b", "c"]

describe("headerCheckState", () => {
  it("is false when nothing is selected", () => {
    expect(headerCheckState(new Set(), IDS)).toBe(false)
  })

  it("is true when everything is selected", () => {
    expect(headerCheckState(new Set(IDS), IDS)).toBe(true)
  })

  it("is mixed for a partial selection", () => {
    expect(headerCheckState(new Set(["a"]), IDS)).toBe("mixed")
  })

  it("is false for an empty list, whatever was selected before", () => {
    expect(headerCheckState(new Set(["a"]), [])).toBe(false)
  })

  // A selection can outlive its rows — a removal, a filter, a refetch. Ids no longer present must
  // not count toward "all selected", or the header would read full over a shorter list.
  it("ignores selected ids that are no longer in the list", () => {
    expect(headerCheckState(new Set(["a", "zzz"]), IDS)).toBe("mixed")
  })
})

describe("toggleAll", () => {
  it("selects everything from empty", () => {
    expect([...toggleAll(new Set(), IDS)].sort()).toEqual(IDS)
  })

  it("clears everything from full", () => {
    expect([...toggleAll(new Set(IDS), IDS)]).toEqual([])
  })

  // Partial means "select the rest", which is what every table in this app does — clearing from
  // partial would lose the user's work on a click meant to extend it.
  it("selects the rest from a partial selection", () => {
    expect([...toggleAll(new Set(["a"]), IDS)].sort()).toEqual(IDS)
  })
})

describe("toggleOne", () => {
  it("adds and removes", () => {
    expect([...toggleOne(new Set(), "a")]).toEqual(["a"])
    expect([...toggleOne(new Set(["a"]), "a")]).toEqual([])
  })

  it("does not mutate the set it was given", () => {
    const before = new Set(["a"])
    toggleOne(before, "b")
    expect([...before]).toEqual(["a"])
  })
})

describe("pruneSelection", () => {
  it("drops ids that are gone", () => {
    expect([...pruneSelection(new Set(["a", "gone"]), IDS)]).toEqual(["a"])
  })

  it("empties when the list does", () => {
    expect([...pruneSelection(new Set(IDS), [])]).toEqual([])
  })
})

describe("canRemove", () => {
  // `reason` is required by BulkRemoveRequest — the case is evidence, so a contract removed from
  // it has to say why. Refused here rather than sent for the backend to reject.
  it("requires both a selection and a reason", () => {
    expect(canRemove(new Set(["a"]), "Duplicate of CT-1000")).toBe(true)
    expect(canRemove(new Set(["a"]), "")).toBe(false)
    expect(canRemove(new Set(["a"]), "   ")).toBe(false)
    expect(canRemove(new Set(), "Duplicate")).toBe(false)
  })
})
