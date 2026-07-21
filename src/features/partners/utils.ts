import type { PartnerType } from "@/features/partners/api/schema"

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
