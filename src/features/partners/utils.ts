import type { TFunction } from "i18next"
import { ANCHOR_LABEL_KEY_BY_FIELD } from "@/features/partners/constants"
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
// legal_entity/sole_proprietor only hold one when registered in DE. Shared
// across PartnerSubmitForm (create), ProposeIdentityChangeDialog (edit), and
// PartnerIdentityFields (read) so all three agree on where the field applies.
export function isCommercialRegisterApplicable(
  partnerType: PartnerType,
  country: string | null | undefined
): boolean {
  if (partnerType === "natural_person") return false
  return (country ?? "").toUpperCase() === COMMERCIAL_REGISTER_COUNTRY
}
