import { describe, expect, it } from "vitest"
import type { TFunction } from "i18next"
import {
  blankToUndefined,
  formatAnchorLabel,
  initialsFromName,
  isCommercialRegisterApplicable,
  isNotFutureDate,
  isValidBic,
  isValidIban,
  isValidLcNumber,
  isValidLei,
  normalizeIban,
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

  it("allows registered_sole_trader partners registered in DE", () => {
    expect(isCommercialRegisterApplicable("registered_sole_trader", "DE")).toBe(
      true
    )
  })

  it("is case-insensitive on the country code", () => {
    expect(isCommercialRegisterApplicable("legal_entity", "de")).toBe(true)
  })

  it("rejects legal_entity partners registered outside DE", () => {
    expect(isCommercialRegisterApplicable("legal_entity", "FR")).toBe(false)
  })

  it("rejects registered_sole_trader partners registered outside DE", () => {
    expect(isCommercialRegisterApplicable("registered_sole_trader", "FR")).toBe(
      false
    )
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

describe("isValidLcNumber", () => {
  it("accepts exactly 4 digits", () => {
    expect(isValidLcNumber("1234")).toBe(true)
    expect(isValidLcNumber("0000")).toBe(true)
  })

  it("trims surrounding whitespace before checking", () => {
    expect(isValidLcNumber("  1234  ")).toBe(true)
  })

  it("rejects fewer or more than 4 digits", () => {
    expect(isValidLcNumber("123")).toBe(false)
    expect(isValidLcNumber("12345")).toBe(false)
  })

  it("rejects non-digit characters", () => {
    expect(isValidLcNumber("12a4")).toBe(false)
    expect(isValidLcNumber("abcd")).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isValidLcNumber("")).toBe(false)
    expect(isValidLcNumber("   ")).toBe(false)
  })
})

describe("normalizeIban", () => {
  it("strips whitespace and upper-cases, matching the backend's canonical form", () => {
    expect(normalizeIban("de89 3704 0044 0532 0130 00")).toBe(
      "DE89370400440532013000"
    )
  })

  it("leaves an already-canonical value unchanged", () => {
    expect(normalizeIban("RS35220000000000341234")).toBe(
      "RS35220000000000341234"
    )
  })
})

describe("isValidIban", () => {
  it("accepts a well-formed IBAN", () => {
    expect(isValidIban("RS35220000000000341234")).toBe(true)
    expect(isValidIban("DE89370400440532013000")).toBe(true)
  })

  it("accepts an IBAN typed in groups, as users enter it", () => {
    expect(isValidIban("DE89 3704 0044 0532 0130 00")).toBe(true)
  })

  it("accepts lower case, since the value is normalised first", () => {
    expect(isValidIban("rs35220000000000341234")).toBe(true)
  })

  it("rejects the value reported in PRD1042-2076", () => {
    expect(isValidIban("1111")).toBe(false)
  })

  it("rejects a missing or malformed country prefix", () => {
    expect(isValidIban("3535220000000000341234")).toBe(false)
    expect(isValidIban("RSAB220000000000341234")).toBe(false)
  })

  it("rejects a BBAN outside the 11-30 character range", () => {
    expect(isValidIban("RS351234567890")).toBe(false)
    expect(isValidIban(`RS35${"1".repeat(31)}`)).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isValidIban("")).toBe(false)
    expect(isValidIban("   ")).toBe(false)
  })

  // The backend documents mod-97 as deliberately out of scope for the MVP, so a
  // structurally valid IBAN with wrong check digits must still pass here —
  // rejecting it would make the form stricter than the API.
  it("does not verify the mod-97 checksum", () => {
    expect(isValidIban("DE00370400440532013000")).toBe(true)
  })
})

describe("isValidBic", () => {
  it("accepts an 8-character BIC", () => {
    expect(isValidBic("XYZBRS22")).toBe(true)
  })

  it("accepts an 11-character BIC with a branch code", () => {
    expect(isValidBic("XYZBRS22XXX")).toBe(true)
  })

  it("trims and upper-cases before checking", () => {
    expect(isValidBic("  xyzbrs22  ")).toBe(true)
  })

  it("rejects the value reported in PRD1042-2076", () => {
    expect(isValidBic("XXXX")).toBe(false)
  })

  it("rejects lengths other than 8 or 11", () => {
    expect(isValidBic("XYZBRS2")).toBe(false)
    expect(isValidBic("XYZBRS22X")).toBe(false)
    expect(isValidBic("XYZBRS22XXXX")).toBe(false)
  })

  it("rejects digits in the bank and country codes", () => {
    expect(isValidBic("1YZBRS22")).toBe(false)
    expect(isValidBic("XYZB1S22")).toBe(false)
  })

  it("rejects an empty string", () => {
    expect(isValidBic("")).toBe(false)
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
