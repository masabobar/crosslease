import { describe, expect, it } from "vitest"
import {
  initialsFromName,
  isCommercialRegisterApplicable,
} from "@/features/partners/utils"

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
