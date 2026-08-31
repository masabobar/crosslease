import { z } from "zod"
import {
  FADocumentTypeSchema,
  FALifecycleStatusSchema,
} from "@/features/frameworkAgreements/api/schema"

// An entry of `documents[]` on the list response below — matches
// LCPortalDocumentItem in refinext-api lc_portal_schemas.py exactly. The download
// endpoint returns a 302 to a presigned URL and no JSON body, so this shape is
// only ever received as part of the list.
export const LCPortalDocumentItemSchema = z.object({
  id: z.string().uuid(),
  file_name: z.string(),
  file_size_bytes: z.number().int(),
  mime_type: z.string(),
  document_type: FADocumentTypeSchema,
  document_label: z.string().nullable(),
  uploaded_at: z.string(),
})
export type LCPortalDocumentItem = z.infer<typeof LCPortalDocumentItemSchema>

export const LCPortalProductTemplateItemSchema = z.object({
  id: z.string().uuid(),
  template_name: z.string().nullable(),
})
export type LCPortalProductTemplateItem = z.infer<
  typeof LCPortalProductTemplateItemSchema
>

// GET /lc-portal/framework-agreements — matches LCPortalFAListItem exactly.
// available_volume_eur/new_financings_available are typed here (Limit
// Management/Epic 19 stub — always null today, per phase-9c Q-022) but are
// deliberately never rendered.
export const LCPortalFAListItemSchema = z.object({
  id: z.string().uuid(),
  agreement_name: z.string(),
  status: FALifecycleStatusSchema,
  valid_from: z.string(),
  valid_until: z.string().nullable(),
  max_volume_eur: z.coerce.number(),
  available_volume_eur: z.coerce.number().nullable(),
  new_financings_available: z.boolean().nullable(),
  product_templates: z.array(LCPortalProductTemplateItemSchema),
  documents: z.array(LCPortalDocumentItemSchema),
})
export type LCPortalFAListItem = z.infer<typeof LCPortalFAListItemSchema>

export const LCPortalFAListResponseSchema = z.object({
  items: z.array(LCPortalFAListItemSchema),
  total: z.number().int(),
})
export type LCPortalFAListResponse = z.infer<
  typeof LCPortalFAListResponseSchema
>

// ── D-12: this company's own obligations for one case (PRD1042-1796 item 9) ──────────────────
//
// Matches LCObligationItem / LCObligationResponse in refinext-api surface_schemas.py exactly (verify
// against src/generated/api.ts, the wire source of truth). What is NOT here is the point of the
// shape: no catalogue, no source layer, no condition, no classification and no blocking flag. Item 9
// forbids all of it on a leasing-company screen, and the backend does not send it — so there is
// nothing here to leak by accident.
export const LCObligationItemSchema = z.object({
  // PRD1042-1794 — the backend now names which catalogue requirement each obligation fulfils, so a
  // leasing company can upload against it via POST /cases/{case_id}/documents. It is an opaque handle
  // to the LC screen: nothing about the catalogue is rendered from it, only sent back on upload.
  requirement_definition_id: z.string().uuid(),
  document_type_name: z.string(),
  // Rendered as Required / Optional — what the company must send. Never as blocking: under CR
  // PRD1042-1794 membership carries "required", so this and blocking are derived from one fact, and
  // "we need this document" is item 9's own "what is still needed" while "your case is stuck on
  // this" is the bank-internal framing it forbids.
  is_mandatory: z.boolean(),
  // The LC vocabulary, not the internal one — the backend maps it (`_LC_STATUS_MAP`) before sending.
  // Parsed as a plain string so a status added there widens this screen instead of blanking it.
  fulfilment_status: z.string(),
  // True when the company still has to act on this obligation (outstanding/rejected). Drives whether
  // the upload control is offered — keyed off this rather than the status vocabulary so a status
  // added on the backend does not silently hide or mis-offer the control.
  action_needed: z.boolean(),
})
export type LCObligationItem = z.infer<typeof LCObligationItemSchema>

export const LCObligationResponseSchema = z.object({
  business_object_id: z.string().uuid(),
  // PRD1042-1794 DRC usability — the case type the obligation set was resolved for. The screen does
  // not render it (item 9 forbids showing a leasing company the bank-internal framing); parsed only
  // so the response shape matches the new contract. Nullable: the LC obligations endpoint takes no
  // case-type parameter, so the backend legitimately returns null here (contract is str | None).
  case_type: z.string().nullable(),
  documents_status_summary: z.string(),
  obligations: z.array(LCObligationItemSchema),
})
export type LCObligationResponse = z.infer<typeof LCObligationResponseSchema>
