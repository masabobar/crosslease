import { describe, expect, it } from "vitest"
import enCases from "@/i18n/locales/en/cases.json"
import deCases from "@/i18n/locales/de/cases.json"
import {
  CASE_DISPLAY_STATUS_BADGE_VARIANT,
  caseDisplayStatusBadgeVariant,
  caseDisplayStatusSlug,
} from "@/features/cases/types"

// The exact strings the backend and the mock fixtures put on the wire — Title Case, with spaces.
// These are the inputs the old lookup silently failed on.
const WIRE_VALUES = [
  "Open",
  "Submitted",
  "Draft",
  "Missing information",
  "Ready for setup",
  "Approved",
  "Live",
  "Done",
  "Rejected",
  "Cancelled",
] as const

describe("caseDisplayStatusSlug", () => {
  it("lowercases and underscores a spaced wire value", () => {
    expect(caseDisplayStatusSlug("Missing information")).toBe(
      "missing_information"
    )
    expect(caseDisplayStatusSlug("Ready for setup")).toBe("ready_for_setup")
  })

  it("leaves an already-slugged value alone", () => {
    expect(caseDisplayStatusSlug("submitted")).toBe("submitted")
  })

  it("collapses runs of whitespace and trims", () => {
    expect(caseDisplayStatusSlug("  Missing   information ")).toBe(
      "missing_information"
    )
  })
})

describe("caseDisplayStatusBadgeVariant", () => {
  it("finds a map entry for every status the backend actually sends", () => {
    // The regression guard. Before the slug, every one of these missed the map and fell through to
    // the fallback, so the list rendered as a column of identical grey pills instead of the
    // design's colours. Asserted as map membership rather than "not neutral", because `neutral` is
    // itself the correct answer for Draft and Cancelled — a tone check could not tell a deliberate
    // grey from a failed lookup.
    for (const status of WIRE_VALUES) {
      expect(
        CASE_DISPLAY_STATUS_BADGE_VARIANT,
        `${status} does not resolve to a map entry`
      ).toHaveProperty(caseDisplayStatusSlug(status))
    }
  })

  it("keeps the two inert terminals grey", () => {
    expect(caseDisplayStatusBadgeVariant("Draft")).toBe("neutral")
    expect(caseDisplayStatusBadgeVariant("Cancelled")).toBe("neutral")
  })

  it("maps the design's colours onto the right statuses", () => {
    expect(caseDisplayStatusBadgeVariant("Submitted")).toBe("info")
    expect(caseDisplayStatusBadgeVariant("Missing information")).toBe("warning")
    expect(caseDisplayStatusBadgeVariant("Approved")).toBe("success")
    expect(caseDisplayStatusBadgeVariant("Ready for setup")).toBe("pending")
    expect(caseDisplayStatusBadgeVariant("Done")).toBe("accent")
    expect(caseDisplayStatusBadgeVariant("Rejected")).toBe("destructive")
  })

  it("distinguishes needs-you orange from waiting amber", () => {
    // They look similar but demand different people's attention, which is why both tones exist.
    expect(caseDisplayStatusBadgeVariant("Missing information")).not.toBe(
      caseDisplayStatusBadgeVariant("Ready for setup")
    )
  })

  it("falls back to neutral for a status the backend adds later", () => {
    expect(caseDisplayStatusBadgeVariant("Escalated to committee")).toBe(
      "neutral"
    )
  })
})

describe("display status i18n coverage", () => {
  it("has an en and de label for every status in the tone map", () => {
    // The same missed lookup meant `t()` always hit its defaultValue, so German silently rendered
    // the English wire string. Keys only resolve if they match the slug exactly.
    for (const slug of Object.keys(CASE_DISPLAY_STATUS_BADGE_VARIANT)) {
      expect(enCases.displayStatuses, `en is missing ${slug}`).toHaveProperty(
        slug
      )
      expect(deCases.displayStatuses, `de is missing ${slug}`).toHaveProperty(
        slug
      )
    }
  })

  it("resolves a label for every wire value once slugged", () => {
    for (const status of WIRE_VALUES) {
      expect(enCases.displayStatuses).toHaveProperty(
        caseDisplayStatusSlug(status)
      )
    }
  })

  it("actually translates — the de label differs from en where the words differ", () => {
    // Guards the defect being fixed: if the lookup regressed, German would fall back to English.
    expect(deCases.displayStatuses.approved).not.toBe(
      enCases.displayStatuses.approved
    )
  })
})
