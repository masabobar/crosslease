/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Partner registry rows and one duplicate pair. Shaped so the screens show their real variation:
 * all three partner types, several statuses, and a UBO completeness spread — the columns are
 * pointless with uniform rows.
 *
 * The duplicate pair is the spec's own example (§5.5): two records for the same company differing
 * only in spelling, which is exactly the case a bank user has to resolve. Company names are the
 * design mockups' placeholders; no real person appears.
 */
import type {
  DuplicateCandidatePairResponse,
  PartnerListItem,
} from "@/features/partners/api/schema"

export const MUELLER_UMLAUT_ID = "00000000-0000-4000-8000-00000000b001"
export const MUELLER_PLAIN_ID = "00000000-0000-4000-8000-00000000b002"
export const LC_PARTNER_ID = "00000000-0000-4000-8000-00000000a001"
const TENANT_ID = "00000000-0000-4000-8000-0000000000ff"

export const mockPartners: PartnerListItem[] = [
  {
    partner_id: LC_PARTNER_ID,
    display_name: "Premium Leasing GmbH",
    partner_type: "legal_entity",
    status: "confirmed",
    country: "DE",
    ubo_completeness_status: "complete",
    roles: ["leasing_company"],
  },
  {
    partner_id: MUELLER_UMLAUT_ID,
    display_name: "Müller Nutzfahrzeuge GmbH",
    partner_type: "legal_entity",
    status: "confirmed",
    country: "DE",
    ubo_completeness_status: "partial",
    roles: ["lessee"],
  },
  // The duplicate of the row above — same entity, transliterated spelling.
  {
    partner_id: MUELLER_PLAIN_ID,
    display_name: "Mueller Nutzfahrzeuge GmbH",
    partner_type: "legal_entity",
    status: "draft",
    country: "DE",
    ubo_completeness_status: "missing",
    roles: ["lessee"],
  },
  {
    partner_id: "00000000-0000-4000-8000-00000000b003",
    display_name: "Baltic Machinery Leasing GmbH",
    partner_type: "legal_entity",
    status: "confirmed",
    country: "DE",
    ubo_completeness_status: "complete",
    roles: ["lessee"],
  },
  {
    partner_id: "00000000-0000-4000-8000-00000000b004",
    display_name: "Nordic Cold Chain AB",
    partner_type: "legal_entity",
    status: "confirmed",
    country: "SE",
    ubo_completeness_status: "partial",
    roles: ["lessee", "guarantor"],
  },
  {
    partner_id: "00000000-0000-4000-8000-00000000b005",
    display_name: "Alpine Equipment GmbH",
    partner_type: "registered_sole_trader",
    status: "pending_confirmation",
    country: "AT",
    ubo_completeness_status: "missing",
    roles: ["lessee"],
  },
  {
    partner_id: "00000000-0000-4000-8000-00000000b006",
    display_name: "Hofer, Katharina",
    partner_type: "natural_person",
    status: "confirmed",
    country: "AT",
    ubo_completeness_status: "complete",
    roles: ["guarantor"],
  },
  {
    partner_id: "00000000-0000-4000-8000-00000000b007",
    display_name: "Meridian Asset Finance Ltd",
    partner_type: "legal_entity",
    status: "archived",
    country: "IE",
    ubo_completeness_status: "complete",
    roles: ["supplier"],
  },
]

export const mockDuplicatePairs: DuplicateCandidatePairResponse[] = [
  {
    pair_id: "00000000-0000-4000-8000-00000000d001",
    tenant_id: TENANT_ID,
    partner_a_id: MUELLER_UMLAUT_ID,
    partner_b_id: MUELLER_PLAIN_ID,
    confidence: "probable",
    // `anchor` names the field compared; the spec's identity anchor is the Creditreform/Schufa
    // number, so a pair that matches on name but not on the anchor is the interesting case.
    matching_evidence: [
      {
        anchor: "display_name",
        a_value: "Müller Nutzfahrzeuge GmbH",
        b_value: "Mueller Nutzfahrzeuge GmbH",
        match: false,
      },
      {
        anchor: "creditreform_number",
        a_value: "2110445566",
        b_value: "2110445566",
        match: true,
      },
      { anchor: "country", a_value: "DE", b_value: "DE", match: true },
    ],
    status: "pending",
    detected_at: "2026-08-29T08:12:00Z",
    resolved_by: null,
    resolved_at: null,
    reason_code: null,
    resolution_note: null,
  },
]
