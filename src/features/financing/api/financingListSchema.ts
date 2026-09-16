import { z } from "zod"

/**
 * The financings list (`GET /financings`).
 *
 * This is the only financing surface that is NOT case-scoped — every other financing route hangs
 * off `/cases/{case_id}/financing/...`, and there is no `GET /financings/{id}`. So the list can be
 * built, and a row's way in is its case: `case_id` is what the detail endpoints need, and the case
 * workspace is where that content already lives.
 */
export const FinancingStatusSchema = z.enum([
  "draft",
  "calculating",
  "ready_for_setup",
  "disbursed",
  "active",
  "ended",
  "cancelled",
])
export type FinancingStatus = z.infer<typeof FinancingStatusSchema>

// A single financing covers one contract; a package covers several under one loan.
export const FinancingKindSchema = z.enum(["single", "package"])
export type FinancingKind = z.infer<typeof FinancingKindSchema>

export const FinancingListItemSchema = z.object({
  id: z.string().uuid(),
  // The case the financing came out of, and the only way to reach its detail.
  case_id: z.string().uuid(),
  case_reference: z.string(),
  financing_reference: z.string(),
  status: FinancingStatusSchema,
  kind: FinancingKindSchema,
  // Decimal strings rather than numbers, for the reason the rest of this feature's money fields
  // are: coercing a nullable decimal turns `null` into a convincing `0`.
  refinancing_rate: z.string().nullable(),
  value_date: z.string().nullable(),
  loan_number: z.string().nullable(),
  lc_number: z.string().nullable(),
  lc_partner_name: z.string().nullable(),
  contract_count: z.number().int(),
  // Free text on the wire — a calculation phase name, not a closed set.
  calculation_state: z.string(),
  created_at: z.string(),
})
export type FinancingListItem = z.infer<typeof FinancingListItemSchema>

export const FinancingListResponseSchema = z.object({
  items: z.array(FinancingListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  per_page: z.number().int(),
  total_pages: z.number().int(),
})
export type FinancingListResponse = z.infer<typeof FinancingListResponseSchema>
