import { describe, it, expect } from "vitest"
import {
  formatLastLogin,
  formatDate,
  formatDateTime,
  getInitials,
  formatEventType,
  formatActionType,
  formatCurrency,
} from "@/lib/formatters"

function mockT(key: string, options?: Record<string, unknown>): string {
  const map: Record<string, string> = {
    "time.justNow": "just now",
    "time.yesterday": "yesterday",
  }
  if (key === "time.minutesAgo") return `${options?.count}m ago`
  if (key === "time.hoursAgo") return `${options?.count}h ago`
  if (key === "time.daysAgo") return `${options?.count}d ago`
  return map[key] ?? key
}

describe("formatLastLogin", () => {
  it("returns '—' for null input", () => {
    expect(formatLastLogin(null, mockT)).toBe("—")
  })

  it("returns 'just now' for a date less than 1 minute ago", () => {
    const date = new Date(Date.now() - 30 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("just now")
  })

  it("returns '5m ago' for a date 5 minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("5m ago")
  })

  it("returns '3h ago' for a date 3 hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("3h ago")
  })

  it("returns 'yesterday' for a date exactly 1 day ago", () => {
    const date = new Date(Date.now() - 25 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("yesterday")
  })

  it("returns '3d ago' for a date 3 days ago", () => {
    const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(formatLastLogin(date.toISOString(), mockT)).toBe("3d ago")
  })

  it("falls back to a locale date string for a date 10+ days ago", () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatLastLogin(date.toISOString(), mockT)
    expect(result).not.toBe("—")
    expect(result.length).toBeGreaterThan(0)
  })
})

describe("formatDate", () => {
  it("returns '—' for null input", () => {
    expect(formatDate(null)).toBe("—")
  })

  it("formats a valid ISO date string as 'D MMM YYYY'", () => {
    expect(formatDate("2026-01-15T12:00:00Z")).toBe("15 Jan 2026")
  })
})

describe("formatDateTime", () => {
  it("returns '—' for null input", () => {
    expect(formatDateTime(null)).toBe("—")
  })

  it("returns a date and time joined with ', '", () => {
    const result = formatDateTime("2026-03-20T14:30:00Z")
    expect(result).toContain(",")
    expect(result.startsWith("20 Mar 2026,")).toBe(true)
  })

  // The zone token itself is machine-dependent (CET, CEST, UTC, GMT+5:30 …) and TZ is not pinned
  // for the suite, so this asserts the shape rather than a literal zone. What must never regress
  // is that a time is emitted bare: an audit timestamp with no zone cannot be read as evidence.
  it("labels the timezone so an audit timestamp is never ambiguous (Q-047)", () => {
    expect(formatDateTime("2026-03-20T14:30:00Z")).toMatch(/\d{2}:\d{2} \S+$/)
  })
})

describe("getInitials", () => {
  it("returns 'AM' for ('Anna', 'Müller')", () => {
    expect(getInitials("Anna", "Müller")).toBe("AM")
  })

  it("uppercases single-character inputs: ('j', 'd') → 'JD'", () => {
    expect(getInitials("j", "d")).toBe("JD")
  })
})

describe("formatEventType", () => {
  it("strips the domain prefix and title-cases the action", () => {
    expect(formatEventType("auth.login_success")).toBe("Login Success")
  })

  it("title-cases a single-word action with no dot separator", () => {
    expect(formatEventType("login")).toBe("Login")
  })

  it("handles multiple dots by splitting on the first one only", () => {
    expect(formatEventType("audit.entity.updated")).toBe("Entity.updated")
  })
})

describe("formatActionType", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatActionType("state_transition")).toBe("State Transition")
  })

  it("title-cases a single word", () => {
    expect(formatActionType("created")).toBe("Created")
  })
})

describe("formatCurrency", () => {
  const fmt = (amount: number, code = "EUR") => formatCurrency(amount, code)

  it("formats the design's reference amount", () => {
    expect(fmt(25000000)).toBe("€ 25.000.000,00")
  })

  it("groups thousands with dots and separates decimals with a comma", () => {
    expect(fmt(3456)).toBe("€ 3.456,00")
  })

  it("always shows two decimal places", () => {
    expect(fmt(1)).toBe("€ 1,00")
    expect(fmt(0)).toBe("€ 0,00")
  })

  it("rounds to two decimals", () => {
    expect(fmt(1234.567)).toBe("€ 1.234,57")
  })

  it("keeps decimals the caller already provided", () => {
    expect(fmt(1234.5)).toBe("€ 1.234,50")
  })

  it("leads with the symbol rather than trailing it as de-DE would", () => {
    expect(fmt(100).startsWith("€")).toBe(true)
  })

  it("handles negative amounts", () => {
    expect(fmt(-500)).toBe("€ -500,00")
  })

  it("uses the symbol of the given currency code", () => {
    expect(fmt(10, "USD")).toBe("$ 10,00")
  })

  it("falls back to the raw code when it has no distinct symbol", () => {
    expect(fmt(10, "CHF")).toBe("CHF 10,00")
  })
})
