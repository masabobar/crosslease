import { describe, it, expect } from "vitest"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
  getUserActionVisibility,
} from "@/features/users/utils"

// ---------------------------------------------------------------------------
// formatLastLogin
// ---------------------------------------------------------------------------
describe("formatLastLogin", () => {
  it("returns '—' for null input", () => {
    expect(formatLastLogin(null)).toBe("—")
  })

  it("returns 'just now' for a date less than 1 minute ago", () => {
    const date = new Date(Date.now() - 30 * 1000) // 30 seconds ago
    expect(formatLastLogin(date.toISOString())).toBe("just now")
  })

  it("returns '5m ago' for a date 5 minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("5m ago")
  })

  it("returns '3h ago' for a date 3 hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("3h ago")
  })

  it("returns 'yesterday' for a date between 24 and 48 hours ago", () => {
    const date = new Date(Date.now() - 25 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("yesterday")
  })

  it("returns '3d ago' for a date 3 days ago", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString())).toBe("3d ago")
  })

  it("returns a non-empty locale date string for a date 10 days ago", () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatLastLogin(date.toISOString())
    expect(result).not.toBe("—")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it("returns '—' for null input", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("returns a non-empty, non-dash string for a valid ISO date string", () => {
    const result = formatDate("2026-01-15T00:00:00Z")
    expect(result).not.toBe("—")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe("formatDateTime", () => {
  it("returns '—' for null input", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("returns a string containing a comma (date and time joined with ', ')", () => {
    const result = formatDateTime("2026-03-20T14:30:00Z")
    expect(result).toContain(",")
    expect(result.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe("getInitials", () => {
  it("returns 'AM' for ('Anna', 'Müller')", () => {
    expect(getInitials("Anna", "Müller")).toBe("AM")
  })

  it("uppercases single-character inputs: ('j', 'd') → 'JD'", () => {
    expect(getInitials("j", "d")).toBe("JD")
  })

  it("returns 'XY' for ('X', 'Y')", () => {
    expect(getInitials("X", "Y")).toBe("XY")
  })
})

// ---------------------------------------------------------------------------
// getUserActionVisibility — additional cases
// ---------------------------------------------------------------------------
describe("getUserActionVisibility — additional cases", () => {
  it("returns canApprove: true when viewer=system_admin, status=pending_activation, role=system_admin (FOUR_EYES_ROLE)", () => {
    const result = getUserActionVisibility(
      "pending_activation",
      "system_admin",
      "system_admin"
    )
    expect(result.canApprove).toBe(true)
  })

  it("returns canApprove: false when viewer=system_admin, status=pending_activation, role=front_office (not a FOUR_EYES_ROLE)", () => {
    const result = getUserActionVisibility(
      "pending_activation",
      "front_office",
      "system_admin"
    )
    expect(result.canApprove).toBe(false)
  })

  it("returns all action flags false when status=deactivated and viewer=system_admin", () => {
    const result = getUserActionVisibility(
      "deactivated",
      "front_office",
      "system_admin"
    )
    expect(result.canSuspend).toBe(false)
    expect(result.canReactivate).toBe(false)
    expect(result.canDeactivate).toBe(false)
  })

  it("returns hasAnyAction: false when viewerRole is null", () => {
    const result = getUserActionVisibility("active", "front_office", null)
    expect(result.hasAnyAction).toBe(false)
  })

  it("returns hasAnyAction: false when viewerRole is front_office (non-admin)", () => {
    const result = getUserActionVisibility(
      "active",
      "front_office",
      "front_office"
    )
    expect(result.hasAnyAction).toBe(false)
  })
})
