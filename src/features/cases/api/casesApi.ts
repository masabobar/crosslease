import { z } from "zod"
import { api } from "@/lib/api"
import {
  CaseContractListResponseSchema,
  CaseDataMetaSchema,
  CaseLeasingCompanyResponseSchema,
  CaseListResponseSchema,
  CaseProductTemplateResponseSchema,
  CaseProgressResponseSchema,
  CaseResponseSchema,
  ImportBatchPreviewResponseSchema,
  ImportBatchResponseSchema,
  ImportCommitResponseSchema,
} from "@/features/cases/api/schema"
import type {
  CaseContractListResponse,
  CaseDataMeta,
  CaseLeasingCompanyResponse,
  CaseListResponse,
  CaseProductTemplateResponse,
  CaseProgressResponse,
  CaseResponse,
  CaseType,
  ImportBatchPreviewResponse,
  ImportBatchResponse,
  ImportCommitResponse,
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
  contracts: (caseId: string) => ["cases", "contracts", caseId] as const,
  leasingCompany: (caseId: string) =>
    ["cases", "leasing-company", caseId] as const,
  productTemplate: (caseId: string) =>
    ["cases", "product-template", caseId] as const,
  importBatch: (caseId: string, batchId: string) =>
    ["cases", "import-batch", caseId, batchId] as const,
  startableCaseTypes: ["cases", "startable-case-types"] as const,
} as const

// The endpoint's own default page is 50. A refinancing request is a bundle of lease contracts rather
// than an unbounded collection, so one wide page backs the tab without paging controls the design
// does not show. If a real request ever exceeds this, `total` exposes it (see the panel's notice).
export const CASE_CONTRACT_LIMIT = 200

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

// GET /cases/{case_id}/contracts — the lease contracts in a refinancing request. Read by the
// financing workspace's Contracts tab, which joins these display fields onto the per-contract
// financing figures (the financing endpoints carry only ids and shares, not terms).
export async function fetchCaseContracts(
  caseId: string
): Promise<CaseContractListResponse> {
  const data = await api.get(`/cases/${caseId}/contracts`, {
    params: { limit: CASE_CONTRACT_LIMIT },
  })
  return CaseContractListResponseSchema.parse(data)
}

/**
 * GET /cases/{case_id}/leasing-company — wizard step 1.
 *
 * Answers `null` (not 404) for a case whose leasing company is not bound yet, which is every case
 * between `POST /cases` and the first bind. `null` is returned as-is rather than parsed, so callers
 * distinguish "not bound" from "failed to read".
 */
export async function fetchCaseLeasingCompany(
  caseId: string
): Promise<CaseLeasingCompanyResponse | null> {
  const data = await api.get(`/cases/${caseId}/leasing-company`)
  return data === null ? null : CaseLeasingCompanyResponseSchema.parse(data)
}

/**
 * PUT /cases/{case_id}/leasing-company — binds by **Händlernummer**, not by partner id.
 *
 * `BindLeasingCompanyRequest` takes `{ lc_number }` matching `^[0-9]{4}$`, while the search that
 * finds the company returns `{ id, legal_name }`. The two do not meet: the caller must resolve the
 * partner's LC numbers first (`/partners/{id}/lc-numbers`) and pick one. A company may hold up to
 * four, and no source says which is chosen — tracked as Q-014, and why step 1 carries a picker the
 * Figma frame does not show.
 */
export async function bindCaseLeasingCompany(
  caseId: string,
  lcNumber: string
): Promise<CaseLeasingCompanyResponse> {
  const data = await api.put(`/cases/${caseId}/leasing-company`, {
    lc_number: lcNumber,
  })
  return CaseLeasingCompanyResponseSchema.parse(data)
}

// GET /cases/{case_id}/product-template — nullable in the same way as the leasing company above.
export async function fetchCaseProductTemplate(
  caseId: string
): Promise<CaseProductTemplateResponse | null> {
  const data = await api.get(`/cases/${caseId}/product-template`)
  return data === null ? null : CaseProductTemplateResponseSchema.parse(data)
}

// PUT /cases/{case_id}/product-template — BindProductTemplateRequest { product_template_id }.
export async function bindCaseProductTemplate(
  caseId: string,
  productTemplateId: string
): Promise<CaseProductTemplateResponse> {
  const data = await api.put(`/cases/${caseId}/product-template`, {
    product_template_id: productTemplateId,
  })
  return CaseProductTemplateResponseSchema.parse(data)
}

/**
 * POST /cases/{case_id}/contracts/import — upload a bulk contract file (US 1.5).
 *
 * One multipart field, `file`. Creates a batch and assesses its rows; **nothing becomes a contract
 * until `commitContractImport`**, so this is safe to call and abandon.
 */
export async function uploadContractImport(
  caseId: string,
  file: File
): Promise<ImportBatchResponse> {
  const formData = new FormData()
  formData.append("file", file)
  const data = await api.post(`/cases/${caseId}/contracts/import`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return ImportBatchResponseSchema.parse(data)
}

// GET /cases/{case_id}/contracts/import/{batch_id} — the batch with its per-row verdicts.
export async function fetchContractImportBatch(
  caseId: string,
  batchId: string
): Promise<ImportBatchPreviewResponse> {
  const data = await api.get(`/cases/${caseId}/contracts/import/${batchId}`)
  return ImportBatchPreviewResponseSchema.parse(data)
}

// POST /cases/{case_id}/contracts/import/{batch_id}/commit — turns the valid and held rows into
// contracts. Failed rows are left behind, which is why the design's button counts valid + held.
export async function commitContractImport(
  caseId: string,
  batchId: string
): Promise<ImportCommitResponse> {
  const data = await api.post(
    `/cases/${caseId}/contracts/import/${batchId}/commit`
  )
  return ImportCommitResponseSchema.parse(data)
}

/**
 * The correction-file URL for a batch — the design's "Download error report".
 *
 * A URL rather than a fetch, deliberately. `openapi.json` declares this endpoint's 200 as
 * `application/json` with an **empty schema** (`{}`), which is what FastAPI emits when a handler
 * returns an unannotated `Response` — so the real body is undeclared and may well be a file. Rather
 * than parse an invented shape, the browser is handed the URL and deals with whatever comes back,
 * the same pattern the LC portal's document download uses (`getLcPortalDocumentDownloadUrl`). Auth
 * rides along because credentials are cookies, so a top-level navigation is authenticated.
 *
 * If the body turns out to be JSON rather than a file, this opens a JSON tab instead of saving a
 * report — visible and harmless, and better than guessing. Tracked as an open question.
 */
export function getContractImportCorrectionFileUrl(
  caseId: string,
  batchId: string
): string {
  return `${api.defaults.baseURL}/cases/${caseId}/contracts/import/${batchId}/correction-file`
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
