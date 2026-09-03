import { z } from "zod"

/**
 * Cases (PRD1042-1794 DRC usability) — wire schemas.
 *
 * A case is the operational business object a refinancing/redemption/etc. flow runs on. Front
 * Office and Back Office reach a case's document surface through the Case list → Case detail →
 * Documents tab, so these schemas mirror the backend CaseListItem / CaseResponse contracts
 * (routes/cases.py). Only the fields those two responses actually carry are declared here; the
 * enums are kept as Zod enums so a value the backend adds fails the parse loudly rather than
 * silently rendering unstyled.
 */

// Mirrors the backend CaseType enum exactly.
export const CaseTypeSchema = z.enum([
  "refinancing_request",
  "package_redemption",
  "single_redemption",
  "lessee_change",
  "object_swap",
  "extension",
  "asset_event",
])
export type CaseType = z.infer<typeof CaseTypeSchema>

// The persisted lifecycle state (case_status). Distinct from display_status below, which is the
// richer status the list/detail surfaces render.
export const CaseStatusSchema = z.enum(["open", "waiting", "done", "cancelled"])
export type CaseStatus = z.infer<typeof CaseStatusSchema>

// display_status is the operational status the UI shows and the `status` query param aliases. The
// backend widens it independently of case_status, so it is parsed as a plain string: a value added
// there must widen this screen's rendering (via a defaulted badge/label) rather than fail its parse.
export const CaseDisplayStatusSchema = z.string()
export type CaseDisplayStatus = z.infer<typeof CaseDisplayStatusSchema>

// Shared field shape behind both CaseListItem and CaseResponse — the two describe the same wire
// entity, so the detail response composes from the list item rather than duplicating fields.
export const CaseSchema = z.object({
  id: z.string().uuid(),
  case_reference: z.string(),
  case_type: CaseTypeSchema,
  case_status: CaseStatusSchema,
  display_status: CaseDisplayStatusSchema,
  origin: z.string(),
  owner_user_id: z.string().uuid().nullable(),
  lc_partner_id: z.string().uuid().nullable(),
  routing_exception: z.boolean(),
  created_by: z.string(),
  created_at: z.string(),
})
export type Case = z.infer<typeof CaseSchema>

// GET /cases — mirrors CaseListResponse. The list item and the detail response share a shape, so
// the same schema drives both the table rows and the detail header.
export const CaseListItemSchema = CaseSchema
export type CaseListItem = z.infer<typeof CaseListItemSchema>

export const CaseListResponseSchema = z.object({
  items: z.array(CaseListItemSchema),
  total: z.number(),
})
export type CaseListResponse = z.infer<typeof CaseListResponseSchema>

// GET /cases/{case_id} — mirrors CaseResponse. Same field set as the list item today; kept as its
// own alias so a field the detail endpoint adds later does not have to widen the list row.
export const CaseResponseSchema = CaseSchema
export type CaseResponse = z.infer<typeof CaseResponseSchema>

// GET /cases/{business_object_id}/progress — mirrors CaseProgressResponse, added with the
// 2026-09-02 contract refresh.
//
// This is what the design's progress band reads: `Progress · {done}/{applicable} ({percent}%)` above
// a phase stepper. `phase_name` and `position` are nullable on the wire, so a phase the backend
// cannot name still counts toward the totals rather than breaking the row.
export const PhaseProgressResponseSchema = z.object({
  phase_name: z.string().nullable(),
  position: z.number().int().nullable(),
  steps_done: z.number().int(),
  steps_applicable: z.number().int(),
  is_complete: z.boolean(),
  is_current: z.boolean(),
})
export type PhaseProgressResponse = z.infer<typeof PhaseProgressResponseSchema>

export const CaseProgressResponseSchema = z.object({
  business_object_id: z.string().uuid(),
  phases: z.array(PhaseProgressResponseSchema),
  overall_done: z.number().int(),
  overall_applicable: z.number().int(),
  percent_complete: z.number().int(),
  all_complete: z.boolean(),
})
export type CaseProgressResponse = z.infer<typeof CaseProgressResponseSchema>

// GET /cases/{case_id}/data — narrowed deliberately.
//
// `CaseDataResponse` is a wide, deeply nested aggregate (leasing_company, contracts, financing,
// collateral, absent_blocks). The workspace header needs one number from it, so only that is
// declared: Zod strips unknown keys, so this parses the full response and keeps the meta fields.
// Modelling the rest before a screen consumes it would be inventing a contract we do not read.
export const CaseDataMetaSchema = z.object({
  case_id: z.string().uuid(),
  contract_count: z.number().int(),
})
export type CaseDataMeta = z.infer<typeof CaseDataMetaSchema>
