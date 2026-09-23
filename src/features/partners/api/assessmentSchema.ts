import { z } from "zod"

/**
 * Partner assessments — the credit-agency and internal reports held against a party.
 *
 * ── THE CATALOGUE IS THE FORM ──────────────────────────────────────────────────────────────────
 * There is no fixed field set. `GET /partners/assessment-catalogue` returns the source types a
 * tenant uses (CREFO, Schufa, an internal rating…), each with its own attributes, and the create
 * form is built from whichever one is chosen. That is why the value rows are `attribute_id` +
 * a value rather than named columns.
 */

// Free text on the wire — a hint for how to render the input, not a closed set the UI may switch
// on exhaustively. Anything unrecognised falls back to a text field.
export const AssessmentAttributeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  value_type: z.string(),
  // e.g. "1-6" or "0-100" — shown beside the input so the reader knows the scale expected.
  value_range: z.string().nullable(),
  scale_hint: z.string().nullable(),
})
export type AssessmentAttribute = z.infer<typeof AssessmentAttributeSchema>

export const AssessmentSourceTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  // A source that carries no structured attributes at all — the report is the note.
  free_text_only: z.boolean(),
  attributes: z.array(AssessmentAttributeSchema),
})
export type AssessmentSourceType = z.infer<typeof AssessmentSourceTypeSchema>

export const AssessmentCatalogueResponseSchema = z.object({
  source_types: z.array(AssessmentSourceTypeSchema),
})
export type AssessmentCatalogueResponse = z.infer<
  typeof AssessmentCatalogueResponseSchema
>

// `no_value_supplied` is a first-class answer, not the absence of one: "the agency returned no
// score" is a different fact from "nobody filled this in", and the record keeps them apart.
export const AssessmentValueSchema = z.object({
  attribute_id: z.string().uuid(),
  attribute_code: z.string(),
  attribute_name: z.string(),
  // Decimal string, like every other money-or-measure on this API.
  value_number: z.string().nullable(),
  value_text: z.string().nullable(),
  no_value_supplied: z.boolean(),
})
export type AssessmentValue = z.infer<typeof AssessmentValueSchema>

export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  partner_id: z.string().uuid(),
  source_type_id: z.string().uuid(),
  source_type_code: z.string(),
  source_type_name: z.string(),
  report_date: z.string(),
  source_reference: z.string().nullable(),
  // Where the assessment was taken, when it was taken for a particular piece of business.
  case_id: z.string().uuid().nullable(),
  contract_id: z.string().uuid().nullable(),
  role: z.string().nullable(),
  context_note: z.string().nullable(),
  // Cancelled rather than deleted — an assessment that informed a decision stays readable.
  cancelled_at: z.string().nullable(),
  cancel_reason: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  values: z.array(AssessmentValueSchema),
})
export type Assessment = z.infer<typeof AssessmentSchema>

export const AssessmentListResponseSchema = z.object({
  partner_id: z.string().uuid(),
  items: z.array(AssessmentSchema),
})
export type AssessmentListResponse = z.infer<
  typeof AssessmentListResponseSchema
>

/**
 * Where a party appears across the book — `GET /partners/{id}/connections`.
 *
 * One row per place the party is attached: a case, a contract, an object. `object_type` says
 * which, and `role` says what the party is there (lessee, guarantor, supplier). Read-only: the
 * connection is a consequence of the business record, not something authored here.
 */
export const PartnerConnectionSchema = z.object({
  object_type: z.string(),
  object_id: z.string(),
  label: z.string(),
  role: z.string(),
  case_id: z.string(),
  leasing_company_partner_id: z.string().nullable(),
  leasing_company_name: z.string().nullable(),
  status: z.string(),
})
export type PartnerConnection = z.infer<typeof PartnerConnectionSchema>

export const PartnerConnectionsResponseSchema = z.object({
  partner_id: z.string().uuid(),
  items: z.array(PartnerConnectionSchema),
})
export type PartnerConnectionsResponse = z.infer<
  typeof PartnerConnectionsResponseSchema
>

/**
 * A party's relationships — `GET /partners/{id}/relationships`.
 *
 * The edges of the borrower unit: who owns this party, who it owns, who directs it. `direction`
 * is what makes an edge readable in one sentence — the same row means "is the parent of" or "is a
 * subsidiary of" depending on which end you are standing at.
 */
export const PartnerRelationshipSchema = z.object({
  id: z.string(),
  relationship_type: z.string(),
  direction: z.string(),
  other_partner_id: z.string(),
  other_display_name: z.string(),
  // Decimal string — an ownership share, and the same rule as every other decimal here.
  share_percentage: z.string().nullable(),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  // False for an edge the registry derived rather than someone recorded.
  is_editable: z.boolean(),
})
export type PartnerRelationship = z.infer<typeof PartnerRelationshipSchema>

export const PartnerRelationshipsResponseSchema = z.object({
  partner_id: z.string().uuid(),
  items: z.array(PartnerRelationshipSchema),
})
export type PartnerRelationshipsResponse = z.infer<
  typeof PartnerRelationshipsResponseSchema
>

/**
 * Documents held against the party itself — `GET /partners/{id}/documents`.
 *
 * Distinct from a case's documents: these outlive any single case, which is the whole reason the
 * registry keeps them rather than the case does.
 */
export const PartnerDocumentSchema = z.object({
  id: z.string(),
  media_object_id: z.string(),
  file_name: z.string().nullable(),
  document_type_code: z.string().nullable(),
  document_type_name: z.string().nullable(),
  document_date: z.string().nullable(),
  label: z.string().nullable(),
  uploaded_at: z.string(),
  uploaded_by_name: z.string().nullable(),
})
export type PartnerDocument = z.infer<typeof PartnerDocumentSchema>

export const PartnerDocumentsResponseSchema = z.object({
  partner_id: z.string().uuid(),
  items: z.array(PartnerDocumentSchema),
})
export type PartnerDocumentsResponse = z.infer<
  typeof PartnerDocumentsResponseSchema
>

/**
 * The party's addresses — `GET /partners/{id}/addresses`.
 *
 * Several per party, each labelled: a registered office, an invoice address, a workshop. One is
 * the default. Retired rather than deleted, so an address a contract was written to stays
 * readable.
 */
export const PartnerAddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  street: z.string().nullable(),
  house_number: z.string().nullable(),
  address_line_2: z.string().nullable(),
  postal_code: z.string().nullable(),
  city: z.string().nullable(),
  state_region: z.string().nullable(),
  country: z.string().nullable(),
  is_default: z.boolean(),
  status: z.string(),
  created_at: z.string(),
})
export type PartnerAddress = z.infer<typeof PartnerAddressSchema>

export const PartnerAddressListResponseSchema = z.object({
  items: z.array(PartnerAddressSchema),
})
export type PartnerAddressListResponse = z.infer<
  typeof PartnerAddressListResponseSchema
>
