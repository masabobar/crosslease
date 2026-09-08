import { PartnerStatusSchema } from "@/features/partners/api/schema"
import type { PartnerListItem } from "@/features/partners/api/schema"

/**
 * Party linking rules for the manual-entry modal's Lessee tab (US 1.6, US 1.7).
 *
 * Pure so the eligibility rule and the obligation vocabulary are testable without a partner search.
 */

/**
 * The kinds of obligation a guarantor link can carry.
 *
 * `kind_of_obligation` is **unconstrained on the wire** — `GuarantorAddRequest` types it as a
 * nullable string with no enum, so the backend declares no vocabulary. These two are the ones US 1.7
 * names ("guarantors and co-obligors"); they are a UI-side vocabulary, which is why they live here
 * rather than being presented as a wire enum. If the backend later declares a set, this list is the
 * one place to reconcile.
 */
export const KIND_OF_OBLIGATION_OPTIONS = ["guarantor", "co_obligor"] as const

export type KindOfObligation = (typeof KIND_OF_OBLIGATION_OPTIONS)[number]

/**
 * Whether a registry partner may be linked as a party to a contract.
 *
 * Only `confirmed`. The API would accept a draft or pending-confirmation partner, but the case then
 * stalls later on a party that is not yet a real counterparty — so the restriction moves that
 * failure to the moment of choosing, where it is explicable, instead of to a downstream step where
 * it is not.
 *
 * An archived or merged partner is excluded for the obvious reason: it is not a counterparty any
 * more, and merged records point somewhere else.
 */
export function isPartnerUsableAsParty(partner: PartnerListItem): boolean {
  return partner.status === PartnerStatusSchema.enum.confirmed
}
