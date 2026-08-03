import type {
  DuplicateResolutionReasonCode,
  MergeReasonCode,
  PartnerType,
  UboCompletenessStatus,
} from "@/features/partners/api/schema"

// Single source of truth for the UBO completeness status dot color — shared
// between the partner list table and the partner detail overview tab so the
// same status always renders the same color.
export const UBO_STATUS_DOT_COLOR: Record<UboCompletenessStatus, string> = {
  complete: "bg-success",
  partial: "bg-warning",
  missing: "bg-muted-foreground",
}

// Identity anchor fields eligible for a propose-identity-change request, per
// partner type — shared between the propose dialog and the identity changes
// history tab so both agree on the field label for a given anchor key.
export type AnchorField = { key: string; labelKey: string }

export const ANCHOR_FIELDS: Record<PartnerType, AnchorField[]> = {
  legal_entity: [
    { key: "legal_name", labelKey: "submit.identityStep.fields.legalName" },
    { key: "legal_form", labelKey: "submit.identityStep.fields.legalForm" },
    { key: "country", labelKey: "submit.identityStep.fields.country" },
    { key: "tax_id_vat", labelKey: "submit.identityStep.fields.taxIdVat" },
    { key: "lei", labelKey: "submit.identityStep.fields.lei" },
    {
      key: "commercial_register_no",
      labelKey: "submit.identityStep.fields.commercialRegisterNo",
    },
    {
      key: "foreign_identifier",
      labelKey: "submit.identityStep.fields.foreignIdentifier",
    },
  ],
  natural_person: [
    { key: "full_name", labelKey: "submit.identityStep.fields.fullName" },
    {
      key: "date_of_birth",
      labelKey: "submit.identityStep.fields.dateOfBirth",
    },
    {
      key: "place_of_birth",
      labelKey: "submit.identityStep.fields.placeOfBirth",
    },
    { key: "country", labelKey: "submit.identityStep.fields.country" },
    { key: "birth_name", labelKey: "submit.identityStep.fields.birthName" },
    { key: "national_id", labelKey: "submit.identityStep.fields.nationalId" },
  ],
  sole_proprietor: [
    { key: "full_name", labelKey: "submit.identityStep.fields.fullName" },
    {
      key: "date_of_birth",
      labelKey: "submit.identityStep.fields.dateOfBirth",
    },
    { key: "country", labelKey: "submit.identityStep.fields.country" },
    { key: "tax_id_vat", labelKey: "submit.identityStep.fields.taxIdVat" },
    {
      key: "commercial_register_no",
      labelKey: "submit.identityStep.fields.commercialRegisterNo",
    },
  ],
}

// Flat anchor-key → label-key lookup derived from ANCHOR_FIELDS above, for the
// read paths that receive a bare anchor key with no partner type to scope it
// (e.g. resolution candidates' matched_anchors). Keys shared across partner
// types resolve to the same label, so collapsing the per-type lists is safe.
export const ANCHOR_LABEL_KEY_BY_FIELD: Record<string, string> =
  Object.fromEntries(
    Object.values(ANCHOR_FIELDS).flatMap(fields =>
      fields.map(field => [field.key, field.labelKey])
    )
  )

// Shared between ResolveDuplicateDialog (US-13.8-9-FE) and the Duplication &
// merge queue's resolution history so both agree on the reason code list.
export const DUPLICATE_RESOLUTION_REASON_CODES: DuplicateResolutionReasonCode[] =
  [
    "identical_registry_identifiers",
    "same_legal_entity_different_name",
    "data_entry_error",
    "system_import_error",
    "legal_restructuring",
    "confirmed_different_entities",
    "subsidiary_not_duplicate",
    "insufficient_evidence",
  ]

// Shared between InitiateMergeDialog (US-13.10-FE) and MergeHistoryTab so both
// agree on the reason code list.
export const MERGE_REASON_CODES: MergeReasonCode[] = [
  "same_legal_entity_different_name",
  "identical_registry_identifiers",
  "data_entry_error",
  "system_import_error",
  "legal_restructuring",
]
