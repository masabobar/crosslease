/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Handlers for the Case list and detail. The list honours the query params `fetchCases` actually
 * sends, so the screen's filters and sort visibly do something — a prototype whose filters are inert
 * teaches the reviewer the wrong thing about what is built.
 *
 * Responses are parsed through the real `CaseListResponseSchema` / `CaseResponseSchema` on the way out,
 * so a fixture that drifts from the contract fails here rather than in the screen.
 */
import { http } from "msw"
import {
  CaseListResponseSchema,
  CaseProgressResponseSchema,
  CaseResponseSchema,
  CaseTypeSchema,
  type Case,
} from "@/features/cases/api/schema"
import { UserRoleSchema } from "@/features/users/api/schema"
import { mockCases } from "@/mocks/fixtures/cases"
import { getMockRole } from "@/mocks/role"
import { envelope, errorEnvelope } from "@/mocks/envelope"

const API = "*/api/v1"

const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"

// Newly started cases live here for the session so that creating one, then landing on its detail
// page, works. Not persisted: a reload is a clean slate, which is what you want from a prototype.
const created: Case[] = []

function allCases(): Case[] {
  return [...created, ...mockCases]
}

function applyFilters(url: URL, rows: Case[]): Case[] {
  const caseType = url.searchParams.get("case_type")
  const status = url.searchParams.get("status")
  const flag = (name: string) => url.searchParams.get(name) === "true"

  let out = rows

  if (caseType) out = out.filter(c => c.case_type === caseType)

  // `status` is the backend's alias for display_status, so it is matched case-insensitively against
  // the derived value rather than against case_status.
  if (status) {
    const wanted = status.toLowerCase()
    out = out.filter(c => c.display_status.toLowerCase() === wanted)
  }

  // The work-list scoping toggles. `unclaimed` and `unassigned` both mean "nobody owns it" on this
  // surface; `mine` / `my_work_list` mean the signed-in user does.
  if (flag("unclaimed") || flag("unassigned")) {
    out = out.filter(c => c.owner_user_id === null)
  }
  if (flag("mine") || flag("my_work_list")) {
    // Only the Front Office fixture owns any case, so every other role's "mine" is empty.
    const mine =
      getMockRole() === UserRoleSchema.enum.front_office
        ? FRONT_OFFICE_USER
        : null
    out = out.filter(c => c.owner_user_id === mine)
  }

  // Age is a sort criterion the spec calls out explicitly (§5.1).
  const byCreated = (a: Case, b: Case) =>
    a.created_at.localeCompare(b.created_at)
  out = [...out].sort(
    flag("oldest_first") ? byCreated : (a, b) => byCreated(b, a)
  )

  const limit = Number(url.searchParams.get("limit") ?? "")
  return Number.isFinite(limit) && limit > 0 ? out.slice(0, limit) : out
}

// The design's A–E progress band (Add convenant.pdf / BO approval.pdf): five phases with the names
// and step counts the client's own frames show, summing to the 44-step catalogue. `is_current` marks
// phase A as the ringed node and `is_complete` fills its connector.
const PROGRESS_PHASES = [
  {
    phase_name: "Application & credit review",
    position: 1,
    steps_done: 3,
    steps_applicable: 4,
  },
  {
    phase_name: "Settlement documents",
    position: 2,
    steps_done: 0,
    steps_applicable: 8,
  },
  {
    phase_name: "Data entry & loan setup",
    position: 3,
    steps_done: 0,
    steps_applicable: 11,
  },
  {
    phase_name: "Approval & disbursement",
    position: 4,
    steps_done: 0,
    steps_applicable: 9,
  },
  {
    phase_name: "Post-processing & archive",
    position: 5,
    steps_done: 0,
    steps_applicable: 12,
  },
] as const

export const caseHandlers = [
  http.get(`${API}/cases/:businessObjectId/progress`, ({ params }) => {
    const phases = PROGRESS_PHASES.map(p => ({
      ...p,
      is_complete: p.steps_done >= p.steps_applicable,
      is_current: p.steps_done > 0 && p.steps_done < p.steps_applicable,
    }))
    const done = phases.reduce((t, p) => t + p.steps_done, 0)
    const applicable = phases.reduce((t, p) => t + p.steps_applicable, 0)
    return envelope(
      CaseProgressResponseSchema.parse({
        business_object_id: String(params.businessObjectId),
        phases,
        overall_done: done,
        overall_applicable: applicable,
        percent_complete: Math.round((done / applicable) * 100),
        all_complete: done === applicable,
      })
    )
  }),

  // Only the header's contract count is read from this aggregate; see CaseDataMetaSchema.
  http.get(`${API}/cases/:caseId/data`, ({ params }) =>
    envelope({ case_id: String(params.caseId), contract_count: 134 })
  ),

  // The Start-case dialog disables any type the bank has no requirement configured for. All seven are
  // startable here so the dialog is explorable.
  http.get(`${API}/document-requirement-catalogs/case-types/startable`, () =>
    envelope({ startable_case_types: [...CaseTypeSchema.options] })
  ),

  http.get(`${API}/cases`, ({ request }) => {
    const items = applyFilters(new URL(request.url), allCases())
    return envelope(
      CaseListResponseSchema.parse({ items, total: items.length })
    )
  }),

  // The leasing company's own cases. Scoped to portal-origin rows, which is the closest honest
  // approximation of the backend scoping to the caller's LC.
  http.get(`${API}/lc/cases`, ({ request }) => {
    const own = allCases().filter(c => c.origin === "portal")
    const items = applyFilters(new URL(request.url), own)
    return envelope(
      CaseListResponseSchema.parse({ items, total: items.length })
    )
  }),

  http.post(`${API}/cases`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      case_type?: unknown
    } | null
    const parsed = CaseTypeSchema.safeParse(body?.case_type)
    if (!parsed.success) {
      return errorEnvelope("VALIDATION_ERROR", "case_type is required", 422)
    }

    const seq = created.length + 1
    const next: Case = {
      id: `00000000-0000-4000-8000-0000000cf${String(seq).padStart(3, "0")}`,
      case_reference: `RR-2026-${String(200 + seq)}`,
      case_type: parsed.data,
      case_status: "open",
      display_status: "Draft",
      origin: "wizard",
      owner_user_id: FRONT_OFFICE_USER,
      lc_partner_id: "00000000-0000-4000-8000-00000000a001",
      routing_exception: false,
      created_by: "Front Office",
      created_at: new Date().toISOString(),
    }
    created.unshift(next)
    return envelope(CaseResponseSchema.parse(next), "CASE_STARTED")
  }),

  http.post(`${API}/cases/:caseId/claim`, ({ params }) => {
    const found = allCases().find(c => c.id === params.caseId)
    if (!found) return notFound()
    const claimed = { ...found, owner_user_id: FRONT_OFFICE_USER }
    return envelope(CaseResponseSchema.parse(claimed), "CASE_CLAIMED")
  }),

  http.post(`${API}/cases/:caseId/reject`, ({ params }) => {
    const found = allCases().find(c => c.id === params.caseId)
    if (!found) return notFound()
    const rejected = { ...found, display_status: "Rejected" }
    return envelope(CaseResponseSchema.parse(rejected), "CASE_REJECTED")
  }),

  // Declared last so the literal paths above are not shadowed by the parameterised one.
  http.get(`${API}/cases/:caseId`, ({ params }) => {
    const found = allCases().find(c => c.id === params.caseId)
    return found ? envelope(CaseResponseSchema.parse(found)) : notFound()
  }),
]

function notFound() {
  return errorEnvelope("NOT_FOUND", "Case not found", 404)
}
