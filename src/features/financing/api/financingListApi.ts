import { api } from "@/lib/api"
import {
  FinancingListResponseSchema,
  type FinancingListResponse,
} from "@/features/financing/api/financingListSchema"

export type FinancingListParams = {
  search?: string
  status?: string
  kind?: string
  sort?: string
  page?: number
  per_page?: number
}

export const FINANCING_LIST_QUERY_KEYS = {
  all: ["financings"] as const,
  list: (params: FinancingListParams) =>
    ["financings", "list", params] as const,
}

export async function fetchFinancings(
  params: FinancingListParams
): Promise<FinancingListResponse> {
  const data = await api.get("/financings", { params })
  return FinancingListResponseSchema.parse(data)
}

/**
 * The list as CSV.
 *
 * A plain navigation rather than a fetch: credentials are cookies, so the browser is already
 * authenticated, and the response is a file the browser should save rather than something this
 * code has any use for. It takes the same filters as the list so the export is what is on screen.
 */
export function financingsExportUrl(params: FinancingListParams): string {
  const query = new URLSearchParams()
  if (params.search) query.set("search", params.search)
  if (params.status) query.set("status", params.status)
  if (params.kind) query.set("kind", params.kind)
  if (params.sort) query.set("sort", params.sort)
  return `${import.meta.env.VITE_API_URL}/financings/export-csv?${query.toString()}`
}
