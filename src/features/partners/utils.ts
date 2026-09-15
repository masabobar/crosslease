import type { TFunction } from "i18next"
import { endOfToday } from "date-fns"
import { ANCHOR_LABEL_KEY_BY_FIELD } from "@/features/partners/constants"
import { PartnerTypeSchema } from "@/features/partners/api/schema"
import type { PartnerType } from "@/features/partners/api/schema"

// Identity anchors reach several read paths as bare wire keys with no partner
// type to scope them (resolution candidates, match candidates). Shared so the
// same anchor always renders the same label, and an unmapped key degrades to
// itself rather than to a bare i18n path.
export function formatAnchorLabel(
  t: TFunction<"partners">,
  anchor: string
): string {
  const labelKey = ANCHOR_LABEL_KEY_BY_FIELD[anchor]
  return labelKey
    ? t(labelKey as "submit.identityStep.fields.legalName", {
        defaultValue: anchor,
      })
    : anchor
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.charAt(0) ?? ""}${
    parts[parts.length - 1]?.charAt(0) ?? ""
  }`.toUpperCase()
}

const COMMERCIAL_REGISTER_COUNTRY = "DE"

// HRB/HRA (Handelsregister) numbers are a German-specific concept (US 13.1 /
// PRD1042-747 field spec) — natural persons never have this anchor, and
// legal_entity/sole_trader only hold one when registered in DE. Shared
// across PartnerSubmitForm (create), ProposeIdentityChangeDialog (edit), and
// PartnerIdentityFields (read) so all three agree on where the field applies.
/**
 * Whether a partner type is one of the two **person** shapes.
 *
 * `natural_person` became `person_commercial` (a freelancer, not registered) and `person_private`
 * (a consumer) on 14 Sep. They carry the identical identity shape — `PersonIdentityInput` — and
 * differ only in what the party *is*, so every rule that used to ask "is this a natural person"
 * asks this instead. Spelling both values out at each branch is how one of them gets forgotten.
 */
export function isPersonType(partnerType: PartnerType): boolean {
  return (
    partnerType === PartnerTypeSchema.enum.person_commercial ||
    partnerType === PartnerTypeSchema.enum.person_private
  )
}

export function isCommercialRegisterApplicable(
  partnerType: PartnerType,
  country: string | null | undefined
): boolean {
  if (isPersonType(partnerType)) return false
  return (country ?? "").toUpperCase() === COMMERCIAL_REGISTER_COUNTRY
}

const LEI_FORMAT = /^[A-Z0-9]{20}$/

/** ISO 7064 MOD 97-10 over a string, letters counted as A=10 … Z=35. */
function mod97(value: string): number {
  let remainder = 0
  for (const char of value) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }
  return remainder
}

/** Whether a string is 20 alphanumeric characters — the shape of a LEI, before its check digits. */
export function hasLeiFormat(raw: string): boolean {
  return LEI_FORMAT.test(raw.trim().toUpperCase())
}

/**
 * Whether a LEI's two check digits are right — ISO 17442, ISO 7064 MOD 97-10 over the **whole
 * twenty characters**.
 *
 * ── THE BUG THIS REPLACES ──────────────────────────────────────────────────────────────────────
 * This used to move the first four characters to the end before taking the remainder. That is
 * **IBAN's** rule, not a LEI's, and it made the field reject every real LEI there is: five
 * published ones — 5493001KJTIIGC8Y1R12, 529900T8BM49AURSDO55, 213800QILIUD4ROSUO03,
 * 7LTWFZYICNSX8D621K86, 549300GKFG0RYRRQ1414 — all give a remainder of 1 as written and none give
 * 1 rearranged. An optional field that cannot accept a single valid value is a field you can only
 * leave empty.
 *
 * The old unit test hedged — *"whichever verdict the checksum reaches"* — which is the tell: it
 * was written without a known-good LEI to check against, so it asserted nothing about the maths.
 *
 * The comment it carried claimed to mirror `validate_lei` in the backend's `partner_schemas.py`.
 * That repository is not on this machine, so whether the backend rearranges too is unverified —
 * if it does, a valid LEI will now pass here and be refused there, which is a backend defect to
 * file rather than a reason to keep rejecting valid input.
 */
export function isValidLei(raw: string): boolean {
  const lei = raw.trim().toUpperCase()
  if (!LEI_FORMAT.test(lei)) return false
  return mod97(lei) === 1
}

// RHF returns "" (not undefined) for optional text inputs the user never touched.
// refinext-api's optional-field validators (e.g. validate_lei) only skip on None —
// an explicit "" still fails their format checks — so blank fields must be omitted.
export function blankToUndefined(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === "" ? undefined : value
  }
  return result
}

// Mirrors LcNumberCreateRequest.lc_number in refinext-api — exactly 4 digits.
const LC_NUMBER_REGEX = /^[0-9]{4}$/

export function isValidLcNumber(raw: string): boolean {
  return LC_NUMBER_REGEX.test(raw.trim())
}

// Mirrors _normalize_iban in refinext-api's partner_schemas.py: the backend strips
// all whitespace and upper-cases before it validates or stores, so the same canonical
// form has to be produced here or the form would reject a spaced-out IBAN the API
// accepts. Users routinely type IBANs in 4-character groups.
export function normalizeIban(raw: string): string {
  return raw.split(/\s+/).join("").toUpperCase()
}

// Mirrors _IBAN_RE in refinext-api's partner_schemas.py — country code, two check
// digits, then 11-30 alphanumeric BBAN characters. Structural only: the backend
// deliberately skips mod-97 for the MVP, so validating the checksum here would
// reject IBANs the API accepts.
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/

export function isValidIban(raw: string): boolean {
  return IBAN_REGEX.test(normalizeIban(raw))
}

// ISO 9362 per PRD1042-2076: 4-letter bank code, 2-letter country code, 2-character
// location code, and an optional 3-character branch code — so 8 or 11 characters.
// The backend caps BIC at 11 characters but checks no format (it treats BIC as
// display data), which makes this check deliberately stricter than the API.
const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/

export function isValidBic(raw: string): boolean {
  return BIC_REGEX.test(raw.trim().toUpperCase())
}

// A date of birth cannot be in the future. The submit form's calendar already caps
// at today, but a value can still arrive from browser autofill, a form reset, or a
// programmatic setValue — so the rule has to exist in the schema too
// (.claude/rules/date-inputs.md §1).
export function isNotFutureDate(isoDate: string): boolean {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed <= endOfToday()
}
