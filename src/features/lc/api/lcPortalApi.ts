import { api } from "@/lib/api"
import { LCPortalFAListResponseSchema } from "@/features/lc/api/schema"
import type { LCPortalFAListResponse } from "@/features/lc/api/schema"

export const LC_PORTAL_QUERY_KEYS = {
  frameworkAgreements: () => ["lc-portal", "framework-agreements"] as const,
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
