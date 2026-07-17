import { describe, it, expect } from "vitest"
import { countryName } from "@/lib/countries"

describe("countryName", () => {
  it("returns the display name for a known ISO2 code", () => {
    expect(countryName("DE")).toBe("Germany")
  })

  it("returns the display name for another known ISO2 code", () => {
    expect(countryName("US")).toBe("United States")
  })

  it("returns the raw code when the code is unknown", () => {
    expect(countryName("ZZ")).toBe("ZZ")
  })
})
