import { api } from "@/lib/api"
import {
  LCObligationResponseSchema,
  LCPortalFAListResponseSchema,
} from "@/features/lc/api/schema"
import type {
  LCObligationResponse,
  LCPortalFAListResponse,
} from "@/features/lc/api/schema"

export const LC_PORTAL_QUERY_KEYS = {
  frameworkAgreements: () => ["lc-portal", "framework-agreements"] as const,
  obligations: (businessObjectId: string) =>
    ["lc-portal", "obligations", businessObjectId] as const,
} as const

export async function fetchLcPortalFrameworkAgreements(): Promise<LCPortalFAListResponse> {
  const data = await api.get("/lc-portal/framework-agreements")
  return LCPortalFAListResponseSchema.parse(data)
}

// The BE returns a 302 redirect to a presigned file URL, not JSON — bypass the
// `api` client (which unwraps a JSON body) and let the browser follow the
// redirect natively via window.open, same as the internal presigned-URL flow.
export function getLcPortalDocumentDownloadUrl(
  faId: string,
  docId: string
): string {
  return `${api.defaults.baseURL}/lc-portal/framework-agreements/${faId}/documents/${docId}/download`
}

// D-12 (PRD1042-1796 item 9) — this company's obligations for one case. Sent with the object id and
// nothing else: a leasing company cannot name a catalogue (that read is bank-only, and item 9 forbids
// showing it one), the object type narrows nothing, and a checkpoint is not a property of the object.
export async function fetchLcObligations(
  businessObjectId: string
): Promise<LCObligationResponse> {
  const data = await api.get(`/lc/obligations/${businessObjectId}`)
  return LCObligationResponseSchema.parse(data)
}
