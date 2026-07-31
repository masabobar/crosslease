import { describe, it, expect } from "vitest"
import {
  getFrameworkAgreementDisplayStatus,
  isFrameworkAgreementExpiredByDate,
} from "@/features/frameworkAgreements/utils"

describe("getFrameworkAgreementDisplayStatus", () => {
  it("returns expired for an active agreement the BE reports as expired", () => {
    expect(getFrameworkAgreementDisplayStatus("active", true)).toBe("expired")
  })

  it("returns active when the BE does not report it as expired", () => {
    expect(getFrameworkAgreementDisplayStatus("active", false)).toBe("active")
  })

  it.each(["draft", "terminated"] as const)(
    "returns %s unchanged even when the BE reports it as expired",
    status => {
      expect(getFrameworkAgreementDisplayStatus(status, true)).toBe(status)
    }
  )
})

describe("isFrameworkAgreementExpiredByDate", () => {
  // valid_until is a date-only wire value and an agreement is valid through the whole
  // of that day — mirrors is_fa_expired() in refinext-api (valid_until < date.today()).
  it("is not expired on the valid_until day itself, whatever the time of day", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-27T00:01:00")
      )
    ).toBe(false)
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-27T23:59:00")
      )
    ).toBe(false)
  })

  it("is expired the day after valid_until", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-28T00:01:00")
      )
    ).toBe(true)
  })

  it("is not expired the day before valid_until", () => {
    expect(
      isFrameworkAgreementExpiredByDate(
        "2026-07-27",
        new Date("2026-07-26T23:59:00")
      )
    ).toBe(false)
  })

  it("is never expired when open-ended", () => {
    expect(
      isFrameworkAgreementExpiredByDate(null, new Date("2030-01-01T12:00:00"))
    ).toBe(false)
  })
})
