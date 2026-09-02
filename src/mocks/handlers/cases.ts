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

export const caseHandlers = [
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
