import { api } from "@/lib/api"
import {
  CaseListResponseSchema,
  CaseResponseSchema,
} from "@/features/cases/api/schema"
import type {
  CaseListResponse,
  CaseResponse,
  CaseType,
} from "@/features/cases/api/schema"

// GET /cases query params, mirroring the backend list endpoint. `status` is the alias the backend
// accepts for display_status; the boolean flags are the work-list scoping toggles. All optional —
// an omitted param spans the whole list rather than narrowing it.
export type CaseListParams = {
  case_type?: string
  status?: string
  unclaimed?: boolean
  mine?: boolean
  unassigned?: boolean
  my_work_list?: boolean
  oldest_first?: boolean
  limit?: number
}

export const CASE_QUERY_KEYS = {
  all: ["cases"] as const,
  list: (params?: CaseListParams) => ["cases", "list", params] as const,
  detail: (caseId: string) => ["cases", "detail", caseId] as const,
} as const

// The endpoint caps limit server-side at 200; this is the widest useful page for the list view.
export const CASE_LIST_LIMIT = 200

export async function fetchCases(
  params?: CaseListParams
): Promise<CaseListResponse> {
  const data = await api.get(`/cases`, { params })
  return CaseListResponseSchema.parse(data)
}

export async function fetchCase(caseId: string): Promise<CaseResponse> {
  const data = await api.get(`/cases/${caseId}`)
  return CaseResponseSchema.parse(data)
}

// POST /cases — start a case. The backend (StartCaseRequest) asks only for the case type; it sets the
// reference, creator and creation time itself. FO / BO / LC users may start one (routes/cases.py
// _CASE_WRITE_ROLES); the response is the new case, which the caller navigates straight to.
export async function createCase(caseType: CaseType): Promise<CaseResponse> {
  const data = await api.post(`/cases`, { case_type: caseType })
  return CaseResponseSchema.parse(data)
}
