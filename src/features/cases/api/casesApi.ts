import { z } from "zod"
import { api } from "@/lib/api"
import {
  CaseDataMetaSchema,
  CaseListResponseSchema,
  CaseProgressResponseSchema,
  CaseResponseSchema,
} from "@/features/cases/api/schema"
import type {
  CaseDataMeta,
  CaseListResponse,
  CaseProgressResponse,
  CaseResponse,
  CaseType,
} from "@/features/cases/api/schema"

// GET /document-requirement-catalogs/case-types/startable — the case types the caller's bank has at
// least one requirement configured for. A case cannot be started for a type with no requirement
// (the backend refuses it), so the Start-case / Raise-proposal dialogs use this to disable the rest.
// Parsed as plain strings (not the CaseType enum) so a case type added on the backend widens the set
// instead of being dropped.
const StartableCaseTypesResponseSchema = z.object({
  startable_case_types: z.array(z.string()),
})

export async function fetchStartableCaseTypes(): Promise<string[]> {
  const data = await api.get(
    `/document-requirement-catalogs/case-types/startable`
  )
  return StartableCaseTypesResponseSchema.parse(data).startable_case_types
}

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
  // The list endpoint pages with limit+offset and returns `total`, which is what the design's
  // "Previous 1 2 3 … Next" pager is driven from.
  offset?: number
}

export const CASE_QUERY_KEYS = {
  all: ["cases"] as const,
  list: (params?: CaseListParams) => ["cases", "list", params] as const,
  lcList: (params?: Pick<CaseListParams, "oldest_first" | "limit">) =>
    ["cases", "lc-list", params] as const,
  detail: (caseId: string) => ["cases", "detail", caseId] as const,
  dataMeta: (caseId: string) => ["cases", "data-meta", caseId] as const,
  progress: (caseId: string) => ["cases", "progress", caseId] as const,
  startableCaseTypes: ["cases", "startable-case-types"] as const,
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

// GET /cases/{business_object_id}/progress — the phase stepper and the overall counter the design's
// progress band renders. Keyed by case id: the route param IS the business object id for a case.
export async function fetchCaseProgress(
  caseId: string
): Promise<CaseProgressResponse> {
  const data = await api.get(`/cases/${caseId}/progress`)
  return CaseProgressResponseSchema.parse(data)
}

// GET /cases/{case_id}/data — read for the workspace header's contract count only; see
// CaseDataMetaSchema for why the shape is narrowed rather than modelled in full.
export async function fetchCaseDataMeta(caseId: string): Promise<CaseDataMeta> {
  const data = await api.get(`/cases/${caseId}/data`)
  return CaseDataMetaSchema.parse(data)
}

// POST /cases — start a case. The backend (StartCaseRequest) asks only for the case type; it sets the
// reference, creator and creation time itself. FO / BO / LC users may start one (routes/cases.py
// _CASE_WRITE_ROLES); the response is the new case, which the caller navigates straight to.
export async function createCase(caseType: CaseType): Promise<CaseResponse> {
  const data = await api.post(`/cases`, { case_type: caseType })
  return CaseResponseSchema.parse(data)
}

// GET /lc/cases — the leasing company's own cases (its raised proposals and any the bank has since
// taken over). The backend scopes to the caller's LC, so no scoping param is needed here.
export async function fetchLcCases(
  params?: Pick<CaseListParams, "oldest_first" | "limit">
): Promise<CaseListResponse> {
  const data = await api.get(`/lc/cases`, { params })
  return CaseListResponseSchema.parse(data)
}

// POST /cases/{id}/claim — Front Office takes over an unclaimed case (an LC proposal). Returns the
// now-owned case.
export async function claimCase(caseId: string): Promise<CaseResponse> {
  const data = await api.post(`/cases/${caseId}/claim`)
  return CaseResponseSchema.parse(data)
}

// POST /cases/{id}/reject — the bank declines an unclaimed LC proposal. The request moves to
// rejected and the leasing company sees it on its own case. Returns the updated case.
export async function rejectCase(caseId: string): Promise<CaseResponse> {
  const data = await api.post(`/cases/${caseId}/reject`)
  return CaseResponseSchema.parse(data)
}
