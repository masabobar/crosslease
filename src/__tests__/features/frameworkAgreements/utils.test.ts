import { describe, it, expect } from "vitest"
import { getFrameworkAgreementDisplayStatus } from "@/features/frameworkAgreements/utils"

describe("getFrameworkAgreementDisplayStatus", () => {
  const now = new Date("2026-07-27T00:00:00Z")

  it("returns expired for an active agreement whose valid_until has passed", () => {
    expect(
      getFrameworkAgreementDisplayStatus("active", "2026-01-01", now)
    ).toBe("expired")
  })

  it("returns active for an active agreement whose valid_until is in the future", () => {
    expect(
      getFrameworkAgreementDisplayStatus("active", "2027-01-01", now)
    ).toBe("active")
  })

  it("returns active for an active agreement with no valid_until (open-ended)", () => {
    expect(getFrameworkAgreementDisplayStatus("active", null, now)).toBe(
      "active"
    )
  })

  it.each(["draft", "suspended", "terminated"] as const)(
    "returns %s unchanged regardless of a past valid_until",
    status => {
      expect(
        getFrameworkAgreementDisplayStatus(status, "2026-01-01", now)
      ).toBe(status)
    }
  )
})
