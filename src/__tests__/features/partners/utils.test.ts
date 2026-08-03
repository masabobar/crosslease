import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import {
  formatAnchorLabel,
  initialsFromName,
  isCommercialRegisterApplicable,
} from "@/features/partners/utils"
import { ANCHOR_LABEL_KEY_BY_FIELD } from "@/features/partners/constants"

describe("formatAnchorLabel", () => {
  // Stands in for i18next: echoes the key so the test asserts which key was
  // looked up, and honours defaultValue the way a missing key would.
  const t = ((key: string, opts?: { defaultValue?: string }) =>
    ANCHOR_LABEL_KEY_BY_FIELD[key] === undefined && opts?.defaultValue
      ? key
      : key) as unknown as TFunction<"partners">

  it("resolves a known anchor through its ANCHOR_FIELDS label key", () => {
    expect(formatAnchorLabel(t, "legal_name")).toBe(
      "submit.identityStep.fields.legalName"
    )
  })

  it("resolves an anchor shared across partner types", () => {
    expect(formatAnchorLabel(t, "country")).toBe(
      "submit.identityStep.fields.country"
    )
  })

  it("returns the raw anchor when no label key is mapped", () => {
    expect(formatAnchorLabel(t, "inputs_hash")).toBe("inputs_hash")
  })

  it("covers every anchor declared in ANCHOR_FIELDS", () => {
    for (const anchor of Object.keys(ANCHOR_LABEL_KEY_BY_FIELD)) {
      expect(formatAnchorLabel(t, anchor)).toMatch(/^submit\.identityStep/)
    }
  })
})

describe("initialsFromName", () => {
  it("builds initials from first and last name", () => {
    expect(initialsFromName("Jane Doe")).toBe("JD")
  })
})

describe("isCommercialRegisterApplicable", () => {
  it("allows legal_entity partners registered in DE", () => {
    expect(isCommercialRegisterApplicable("legal_entity", "DE")).toBe(true)
  })

  it("allows sole_proprietor partners registered in DE", () => {
    expect(isCommercialRegisterApplicable("sole_proprietor", "DE")).toBe(true)
  })

  it("is case-insensitive on the country code", () => {
    expect(isCommercialRegisterApplicable("legal_entity", "de")).toBe(true)
  })

  it("rejects legal_entity partners registered outside DE", () => {
    expect(isCommercialRegisterApplicable("legal_entity", "FR")).toBe(false)
  })

  it("rejects sole_proprietor partners registered outside DE", () => {
    expect(isCommercialRegisterApplicable("sole_proprietor", "FR")).toBe(false)
  })

  it("rejects natural_person regardless of country", () => {
    expect(isCommercialRegisterApplicable("natural_person", "DE")).toBe(false)
  })

  it("rejects when country is missing", () => {
    expect(isCommercialRegisterApplicable("legal_entity", null)).toBe(false)
    expect(isCommercialRegisterApplicable("legal_entity", undefined)).toBe(
      false
    )
  })
})
