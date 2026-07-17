import { describe, it, expect } from "vitest"
import { buildPageNumbers } from "@/lib/pagination"

describe("buildPageNumbers", () => {
  it("returns all pages when totalPages is within the visible window (<= 5)", () => {
    expect(buildPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it("returns all pages when there is only 1 page", () => {
    expect(buildPageNumbers(1, 1)).toEqual([1])
  })

  it("adds an ellipsis after page 1 when current page is near the end", () => {
    expect(buildPageNumbers(10, 10)).toEqual([1, "...", 9, 10])
  })

  it("adds an ellipsis before the last page when current page is near the start", () => {
    expect(buildPageNumbers(1, 10)).toEqual([1, 2, "...", 10])
  })

  it("adds ellipses on both sides when current page is in the middle", () => {
    expect(buildPageNumbers(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10])
  })

  it("omits the leading ellipsis when current page is page 2 (adjacent to page 1)", () => {
    expect(buildPageNumbers(2, 10)).toEqual([1, 2, 3, "...", 10])
  })

  it("omits the trailing ellipsis when current page is second-to-last", () => {
    expect(buildPageNumbers(9, 10)).toEqual([1, "...", 8, 9, 10])
  })
})
