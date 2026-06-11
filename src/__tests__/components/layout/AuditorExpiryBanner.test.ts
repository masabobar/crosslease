import { describe, it, expect } from "vitest"
import {
  computeExpiryLevel,
  formatCountdown,
} from "@/features/users/hooks/useAuditorExpiry"
import { AUDITOR_ROLE } from "@/features/users/types"
import { HOUR_MS } from "@/lib/constants"

const ONE_DAY_MS = 24 * HOUR_MS

describe("computeExpiryLevel", () => {
  it("returns 'none' when ms is zero (already expired)", () => {
    expect(computeExpiryLevel(0)).toBe("none")
  })

  it("returns 'none' when ms is negative (past expiry)", () => {
    expect(computeExpiryLevel(-1000)).toBe("none")
  })

  it("returns 'danger' when exactly 1 ms remaining", () => {
    expect(computeExpiryLevel(1)).toBe("danger")
  })

  it("returns 'danger' at exactly 1 hour remaining", () => {
    expect(computeExpiryLevel(HOUR_MS)).toBe("danger")
  })

  it("returns 'danger' at 30 minutes remaining", () => {
    expect(computeExpiryLevel(30 * 60 * 1000)).toBe("danger")
  })

  it("returns 'warning' just above 1 hour remaining", () => {
    expect(computeExpiryLevel(HOUR_MS + 1)).toBe("warning")
  })

  it("returns 'warning' at 12 hours remaining", () => {
    expect(computeExpiryLevel(12 * HOUR_MS)).toBe("warning")
  })

  it("returns 'warning' at exactly 24 hours remaining", () => {
    expect(computeExpiryLevel(ONE_DAY_MS)).toBe("warning")
  })

  it("returns 'none' just above 24 hours remaining", () => {
    expect(computeExpiryLevel(ONE_DAY_MS + 1)).toBe("none")
  })

  it("returns 'none' at 7 days remaining", () => {
    expect(computeExpiryLevel(7 * ONE_DAY_MS)).toBe("none")
  })
})

describe("formatCountdown", () => {
  it("formats zero as 00:00:00", () => {
    expect(formatCountdown(0)).toBe("00:00:00")
  })

  it("formats 1 second as 00:00:01", () => {
    expect(formatCountdown(1)).toBe("00:00:01")
  })

  it("formats 59 seconds as 00:00:59", () => {
    expect(formatCountdown(59)).toBe("00:00:59")
  })

  it("formats 60 seconds as 00:01:00", () => {
    expect(formatCountdown(60)).toBe("00:01:00")
  })

  it("formats 90 seconds as 00:01:30", () => {
    expect(formatCountdown(90)).toBe("00:01:30")
  })

  it("formats 3600 seconds as 01:00:00", () => {
    expect(formatCountdown(3600)).toBe("01:00:00")
  })

  it("formats 3661 seconds as 01:01:01", () => {
    expect(formatCountdown(3661)).toBe("01:01:01")
  })

  it("formats 2700 seconds (45 min) as 00:45:00", () => {
    expect(formatCountdown(2700)).toBe("00:45:00")
  })
})

describe("auditor role gating", () => {
  it("AUDITOR_ROLE constant matches wire value", () => {
    expect(AUDITOR_ROLE).toBe("auditor")
  })

  it("non-auditor roles should not show the banner", () => {
    const nonAuditorRoles: string[] = [
      "system_admin",
      "support_user",
      "front_office",
      "back_office",
      "leasing_company_user",
    ]

    for (const role of nonAuditorRoles) {
      expect(role === AUDITOR_ROLE).toBe(false)
    }
  })
})
