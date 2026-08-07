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
