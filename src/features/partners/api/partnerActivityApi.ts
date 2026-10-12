import { api } from "@/lib/api"
import {
  CaseActivityResponseSchema,
  CaseCommentItemSchema,
  CaseCommentListResponseSchema,
} from "@/features/cases/api/schema"
import type {
  CaseActivityResponse,
  CaseCommentItem,
  CaseCommentListResponse,
} from "@/features/cases/api/schema"

/**
 * A partner's own history — `GET /partners/{id}/activity` and `/comments`.
 *
 * The response shapes are the case's, down to the field, so the case schemas are reused rather
 * than copied. Copying them would be a second definition of one contract, and the two would drift
 * the first time the backend added a field.
 *
 * What differs is the SCOPE, not the shape: these entries are written about the party — a bank
 * account retired, an assessment recorded, a duplicate check run — and they outlive every case the
 * party ever appears on.
 */

export const PARTNER_ACTIVITY_KEYS = {
  activity: (partnerId: string, page: number) =>
    ["partners", "activity", partnerId, page] as const,
  comments: (partnerId: string) => ["partners", "comments", partnerId] as const,
}

export async function fetchPartnerActivity(
  partnerId: string,
  page: number
): Promise<CaseActivityResponse> {
  const data = await api.get(`/partners/${partnerId}/activity`, {
    params: { page },
  })
  return CaseActivityResponseSchema.parse(data)
}

export async function fetchPartnerComments(
  partnerId: string
): Promise<CaseCommentListResponse> {
  const data = await api.get(`/partners/${partnerId}/comments`)
  return CaseCommentListResponseSchema.parse(data)
}

export async function addPartnerComment(
  partnerId: string,
  body: string
): Promise<CaseCommentItem> {
  const data = await api.post(`/partners/${partnerId}/comments`, { body })
  return CaseCommentItemSchema.parse(data)
}
