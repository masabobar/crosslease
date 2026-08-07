import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import {
  blankToUndefined,
  formatAnchorLabel,
  initialsFromName,
  isCommercialRegisterApplicable,
  isNotFutureDate,
  isValidLei,
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

describe("isValidLei", () => {
  it("rejects anything that is not 20 alphanumeric characters", () => {
    expect(isValidLei("")).toBe(false)
    expect(isValidLei("ABC")).toBe(false)
    expect(isValidLei("7LTWFZYICNSX8D621K8")).toBe(false) // 19
    expect(isValidLei("7LTWFZYICNSX8D621K866")).toBe(false) // 21
    expect(isValidLei("7LTWFZYICNSX8D621K8-")).toBe(false) // non-alphanumeric
  })

  it("trims and upper-cases before validating", () => {
    // Same string, three ways — whichever verdict the checksum reaches, the
    // normalisation must not change it.
    const verdict = isValidLei("529900T8BM49AURSDO55")
    expect(isValidLei("  529900T8BM49AURSDO55  ")).toBe(verdict)
    expect(isValidLei("529900t8bm49aursdo55")).toBe(verdict)
  })

  // CHARACTERIZATION TEST — pins current behaviour, which is WRONG on purpose.
  // isValidLei mirrors refinext-api's `_lei_checksum_valid()`, and both apply the
  // IBAN rearrangement (first 4 chars moved to the end) that ISO 17442 does not
  // use. The consequence is that every real LEI fails. See Q-065 in
  // .project-management/input/open-questions.md.
  //
  // When the BE drops the rearrangement, flip these two expectations together
  // with the one-line fix in utils.ts — this test failing is the signal, not a
  // regression.
  it("currently rejects real LEIs (mirrors the BE's rearrangement bug — Q-065)", () => {
    expect(isValidLei("7LTWFZYICNSX8D621K86")).toBe(false)
    expect(isValidLei("5493001KJTIIGC8Y1R12")).toBe(false)
  })
})

describe("isNotFutureDate", () => {
  it("accepts a past date", () => {
    expect(isNotFutureDate("1990-05-17")).toBe(true)
  })

  it("accepts today", () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(isNotFutureDate(today)).toBe(true)
  })

  it("rejects a future date", () => {
    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    expect(isNotFutureDate(nextYear.toISOString().slice(0, 10))).toBe(false)
  })

  it("rejects an unparseable value", () => {
    expect(isNotFutureDate("")).toBe(false)
    expect(isNotFutureDate("not-a-date")).toBe(false)
  })
})

describe("blankToUndefined", () => {
  it("converts empty strings to undefined so the BE's optional validators skip them", () => {
    expect(blankToUndefined({ lei: "", tax_id_vat: "DE123" })).toEqual({
      lei: undefined,
      tax_id_vat: "DE123",
    })
  })

  it("leaves non-string and non-empty values untouched", () => {
    expect(
      blankToUndefined({ n: 0, f: false, nil: null, u: undefined, s: "x" })
    ).toEqual({ n: 0, f: false, nil: null, u: undefined, s: "x" })
  })

  it("keeps the key present rather than deleting it", () => {
    expect(Object.keys(blankToUndefined({ lei: "" }))).toEqual(["lei"])
  })
})
