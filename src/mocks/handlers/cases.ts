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
  CaseContractListResponseSchema,
  CaseLeasingCompanyResponseSchema,
  CaseListResponseSchema,
  CaseProductTemplateResponseSchema,
  CaseProgressResponseSchema,
  CaseResponseSchema,
  CaseStatusSchema,
  CaseTypeSchema,
  ImportBatchPreviewResponseSchema,
  ImportBatchResponseSchema,
  ImportCommitResponseSchema,
  CaseContractSchema,
  GuarantorLinkResponseSchema,
  GuarantorListResponseSchema,
  LeaseObjectListResponseSchema,
  LeaseObjectReadSchema,
  LesseeLinkResponseSchema,
  PaymentPlanResponseSchema,
  BulkRemoveResponseSchema,
  CaseActivityResponseSchema,
  CaseCommentItemSchema,
  CaseCommentListResponseSchema,
  ObjectClassificationResponseSchema,
  PackageTotalsReadSchema,
  SubmitResultResponseSchema,
  type Case,
  type CaseLeasingCompanyResponse,
  type CaseProductTemplateResponse,
  type ImportBatchPreviewResponse,
  type GuarantorListItem,
  type LeaseObjectRead,
  type LesseeLinkResponse,
  type PaymentPlanResponse,
  type CaseActivityItem,
  type CaseCommentItem,
} from "@/features/cases/api/schema"
import { LcNumberListResponseSchema } from "@/features/partners/api/schema"
import { UserRoleSchema } from "@/features/users/api/schema"
import { mockCaseContractsByCaseId } from "@/mocks/fixtures/caseContracts"
import { mockObjectGroups } from "@/mocks/fixtures/objectClassification"
import {
  importedContracts,
  makeImportBatch,
  toBatchResponse,
} from "@/mocks/fixtures/contractImport"
import {
  boundLeasingCompany,
  mockLcNumbersByPartnerId,
} from "@/mocks/fixtures/caseWizard"
import { mockCases } from "@/mocks/fixtures/cases"
import { mockPartners } from "@/mocks/fixtures/partners"
import { getMockRole } from "@/mocks/role"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

const FRONT_OFFICE_USER = "00000000-0000-4000-8000-000000000005"

// Newly started cases live here for the session so that creating one, then landing on its detail
// page, works. Not persisted: a reload is a clean slate, which is what you want from a prototype.
const created: Case[] = []

// Wizard step 1's bindings, session-scoped for the same reason as `created`.
const boundByCaseId: Record<string, CaseLeasingCompanyResponse> = {}
const templateByCaseId: Record<string, CaseProductTemplateResponse> = {}

// Wizard step 2's import batches, likewise. Mutated in place on commit so `rows_committed` reflects
// that a batch is spent — re-opening a committed batch must not offer to commit it twice.
const importBatchesById: Record<string, ImportBatchPreviewResponse> = {}

// Manual-entry lease objects, keyed by contract. Session-scoped like everything else here.
const objectsByContractId: Record<string, LeaseObjectRead[]> = {}
const lesseeByContractId: Record<string, LesseeLinkResponse> = {}
const planByContractId: Record<string, PaymentPlanResponse> = {}
const commentsByCaseId: Record<string, CaseCommentItem[]> = {}

/**
 * The case activity trail. Seeded lazily on first read so a case that has had nothing done to it
 * still shows its creation, and appended to by the handlers that cause events.
 */
const activityByCaseId: Record<string, CaseActivityItem[]> = {}
let auditSeq = 1000

function pushActivity(
  caseId: string,
  fields: {
    event_type: string
    action_type: string
    entity_type: string
    entity_display: string | null
    new_data: Record<string, unknown> | null
  }
): void {
  auditSeq += 1
  const rows = activityByCaseId[caseId] ?? []
  activityByCaseId[caseId] = [
    ...rows,
    {
      id: `00000000-0000-4000-8000-0000000ac${auditSeq.toString(16)}`,
      audit_seq: auditSeq,
      entity_id: null,
      actor_id: FRONT_OFFICE_USER,
      actor_type: "user",
      actor_display: "Front Office",
      actor_role_at_time: getMockRole(),
      old_data: null,
      changed_fields:
        fields.new_data === null ? null : Object.keys(fields.new_data),
      recorded_at: new Date().toISOString(),
      ...fields,
    },
  ]
}
const guarantorsByContractId: Record<string, GuarantorListItem[]> = {}

function hexPair(n: number): string {
  return n.toString(16).padStart(2, "0")
}

// Every nullable field of LeaseObjectRead, so a POST body carrying only a group still parses into
// the full read shape the schema requires.
const EMPTY_LEASE_OBJECT = {
  object_group: null,
  object_sub_group: null,
  object_description: null,
  manufacturer: null,
  brand: null,
  year_of_manufacture: null,
  chassis_or_serial_number: null,
  registration_plate: null,
  vehicle_registration_document_number: null,
  new_or_used: null,
  acquisition_cost: null,
  residual_value: null,
  special_payment: null,
  market_value: null,
  appraised_value: null,
  value_as_at: null,
  dat_evidence_status: null,
  dat_evidence_document_id: null,
  removed_at: null,
}

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

  return out
}

// Paging is applied after filtering, and `total` is taken BEFORE the slice — otherwise the pager
// reads "1 of 1 page" no matter how many rows matched, and the design's "Previous 1 2 3 … Next"
// never appears.
function paginate(url: URL, rows: Case[]): { items: Case[]; total: number } {
  const total = rows.length
  const limit = Number(url.searchParams.get("limit") ?? "")
  const offset = Number(url.searchParams.get("offset") ?? "")
  const from = Number.isFinite(offset) && offset > 0 ? offset : 0
  const items =
    Number.isFinite(limit) && limit > 0
      ? rows.slice(from, from + limit)
      : rows.slice(from)
  return { items, total }
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

  // ── Wizard step 1 ─────────────────────────────────────────────────────────
  // The bind is session-scoped and in-memory, like `created` above: binding a company then walking
  // back to step 1 shows the bound state, and a reload starts clean. That is what a prototype
  // should do — persisting it would imply a durability the mock layer does not have.
  http.get(`${API}/cases/:caseId/leasing-company`, ({ params }) => {
    const bound = boundByCaseId[params.caseId as string]
    // `null` — not 404 — for an unbound case, matching the endpoint's `anyOf: [..., null]`. The
    // wizard distinguishes "not bound yet" from "failed to read", so this path must stay null.
    return envelope(bound ?? null)
  }),

  http.put(
    `${API}/cases/:caseId/leasing-company`,
    async ({ params, request }) => {
      const body = (await request.json()) as { lc_number?: string }
      const lcNumber = body.lc_number ?? ""

      // The backend's BindLeasingCompanyRequest constrains this to exactly four digits. Enforced
      // here so the wizard's error path is reachable without a real backend.
      if (!/^[0-9]{4}$/.test(lcNumber)) {
        return errorEnvelope(
          "VALIDATION_ERROR",
          "lc_number must be exactly four digits.",
          422
        )
      }

      const bound = boundLeasingCompany(lcNumber)
      boundByCaseId[params.caseId as string] = bound
      return envelope(CaseLeasingCompanyResponseSchema.parse(bound))
    }
  ),

  http.get(`${API}/cases/:caseId/product-template`, ({ params }) =>
    envelope(templateByCaseId[params.caseId as string] ?? null)
  ),

  http.put(
    `${API}/cases/:caseId/product-template`,
    async ({ params, request }) => {
      const body = (await request.json()) as { product_template_id?: string }
      const template = CaseProductTemplateResponseSchema.parse({
        product_template_id: body.product_template_id,
        template_code: "STD-LEASE-REFI",
        template_name: "Standard lease refinancing",
        version_number: "4",
        version_status: "effective",
        min_term_months: 12,
        max_term_months: 72,
        refinancing_form: "annuity",
      })
      templateByCaseId[params.caseId as string] = template
      return envelope(template)
    }
  ),

  // ── Wizard step 2: bulk contract import ───────────────────────────────────
  // The upload assesses rows and returns counts; nothing becomes a contract until the commit. Both
  // halves are session-scoped, so a reload starts clean.
  http.post(`${API}/cases/:caseId/contracts/import`, async ({ params }) => {
    const batch = makeImportBatch(params.caseId as string)
    importBatchesById[batch.batch_id] = batch
    return envelope(ImportBatchResponseSchema.parse(toBatchResponse(batch)))
  }),

  http.get(`${API}/cases/:caseId/contracts/import/:batchId`, ({ params }) => {
    const batch = importBatchesById[params.batchId as string]
    return batch
      ? envelope(ImportBatchPreviewResponseSchema.parse(batch))
      : errorEnvelope("NOT_FOUND", "Import batch not found", 404)
  }),

  http.post(
    `${API}/cases/:caseId/contracts/import/:batchId/commit`,
    ({ params }) => {
      const batch = importBatchesById[params.batchId as string]
      if (!batch) {
        return errorEnvelope("NOT_FOUND", "Import batch not found", 404)
      }

      // Valid AND held rows are committed; only failures remain behind. That is what makes the
      // design's "Continue with 11 valid contracts" add up against 8 valid and 3 duplicates.
      const committed = batch.rows_valid + batch.rows_held
      batch.rows_committed = committed
      batch.status = "committed"

      // The committed rows become the case's contracts, so step 2's list and step 3's guard both
      // change — without this the wizard would commit and still show an empty case.
      const caseId = params.caseId as string
      mockCaseContractsByCaseId[caseId] = [
        ...(mockCaseContractsByCaseId[caseId] ?? []),
        ...importedContracts(committed),
      ]

      return envelope(
        ImportCommitResponseSchema.parse({
          batch_id: batch.batch_id,
          status: batch.status,
          committed,
          remaining_failed: batch.rows_failed,
        })
      )
    }
  ),

  // ── Wizard step 3: summary + submit ───────────────────────────────────────
  // The totals the summary card reads. Derived from the case's own contracts so the count matches
  // the list on step 2 — a fixed number here would let the two screens disagree.
  http.get(`${API}/cases/:caseId/contracts/totals`, ({ params }) => {
    const items = mockCaseContractsByCaseId[params.caseId as string] ?? []
    return envelope(
      PackageTotalsReadSchema.parse({
        contract_count: items.length,
        residual_sum: "41200.00",
        acquisition_cost_sum: "1875000.00",
        special_payment_sum: null,
      })
    )
  }),

  http.post(`${API}/cases/:caseId/submit`, ({ params }) => {
    const caseId = params.caseId as string
    const found = allCases().find(c => c.id === caseId)
    if (!found) {
      return errorEnvelope("NOT_FOUND", "Case not found", 404)
    }

    // Submission moves the request out of draft, which is what the case list's derived display
    // status renders. Mutating the fixture means the list actually changes after a submit rather
    // than still showing a draft.
    found.display_status = "submitted"

    return envelope(
      SubmitResultResponseSchema.parse({
        case: found,
        submitted_by: FRONT_OFFICE_USER,
        submitted_at: "2026-09-07T12:00:00Z",
      })
    )
  }),

  // ── Manual contract entry (US 1.8) ────────────────────────────────────────
  http.get(`${API}/object-classification`, () =>
    envelope(
      ObjectClassificationResponseSchema.parse({ groups: mockObjectGroups })
    )
  ),

  http.get(`${API}/contracts/:contractId/objects`, ({ params }) => {
    const contractId = params.contractId as string
    return envelope(
      LeaseObjectListResponseSchema.parse({
        contract_id: contractId,
        objects: objectsByContractId[contractId] ?? [],
      })
    )
  }),

  http.post(
    `${API}/contracts/:contractId/objects`,
    async ({ params, request }) => {
      const contractId = params.contractId as string
      const body = (await request.json()) as Record<string, unknown>
      const existing = objectsByContractId[contractId] ?? []

      const created = LeaseObjectReadSchema.parse({
        ...EMPTY_LEASE_OBJECT,
        ...body,
        id: `00000000-0000-4000-8000-0000000e${hexPair(existing.length + 1)}01`,
        contract_id: contractId,
        // The backend numbers objects within their contract; the form never sends this.
        object_number: existing.length + 1,
      })

      objectsByContractId[contractId] = [...existing, created]
      return envelope(created)
    }
  ),

  // POST /cases/{case_id}/contracts — creates an empty contract for manual entry. `ContractCreate`
  // requires no field, so the modal creates the shell and the tabs fill it; without this the whole
  // manual-entry route dead-ends on the fallback (found by driving the browser).
  http.post(`${API}/cases/:caseId/contracts`, async ({ params, request }) => {
    const caseId = params.caseId as string
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    const rows = mockCaseContractsByCaseId[caseId] ?? []

    const created = CaseContractSchema.parse({
      id: `00000000-0000-4000-8000-0000000d${(rows.length + 1)
        .toString(16)
        .padStart(2, "0")}01`,
      leasing_company_contract_number: null,
      lessee_partner_id: null,
      short_name: null,
      contract_type: null,
      amortisation_type: null,
      term_months: null,
      net_instalment: null,
      residual_value: null,
      contract_start: null,
      deferred_state: "active",
      ...body,
    })

    mockCaseContractsByCaseId[caseId] = [...rows, created]
    return envelope(created)
  }),

  // ── Manual entry: parties and terms (US 1.6, 1.7, 1.9) ────────────────────
  http.get(`${API}/contracts/:contractId/lessee`, ({ params }) =>
    envelope(lesseeByContractId[params.contractId as string] ?? null)
  ),

  http.post(
    `${API}/contracts/:contractId/lessee`,
    async ({ params, request }) => {
      const contractId = params.contractId as string
      const body = (await request.json()) as { existing_partner_id?: string }
      const link = LesseeLinkResponseSchema.parse({
        contract_id: contractId,
        lessee_partner_id: body.existing_partner_id,
        // False because this path links an EXISTING partner. The `identity` branch would set it
        // true, and the tab surfaces that — but that branch is not built.
        is_new: false,
        partner_status: "confirmed",
      })
      lesseeByContractId[contractId] = link
      return envelope(link)
    }
  ),

  http.get(`${API}/contracts/:contractId/guarantors`, ({ params }) => {
    const contractId = params.contractId as string
    const rows = guarantorsByContractId[contractId] ?? []
    return envelope(
      GuarantorListResponseSchema.parse({
        contract_id: contractId,
        count: rows.length,
        guarantors: rows,
      })
    )
  }),

  http.post(
    `${API}/contracts/:contractId/guarantors`,
    async ({ params, request }) => {
      const contractId = params.contractId as string
      const body = (await request.json()) as {
        existing_partner_id?: string
        kind_of_obligation?: string
      }
      const rows = guarantorsByContractId[contractId] ?? []
      const linkId = `00000000-0000-4000-8000-0000000f${(rows.length + 1)
        .toString(16)
        .padStart(2, "0")}01`

      // The list carries a display name, so the mock has to supply one — the real backend resolves
      // it from the partner. Taken from the registry fixture so the row is not a bare id.
      const partner = mockPartners.find(
        pp => pp.partner_id === body.existing_partner_id
      )

      guarantorsByContractId[contractId] = [
        ...rows,
        {
          link_id: linkId,
          guarantor_partner_id: body.existing_partner_id as string,
          kind_of_obligation: body.kind_of_obligation ?? null,
          display_name: partner?.display_name ?? "Unknown partner",
        },
      ]

      return envelope(
        GuarantorLinkResponseSchema.parse({
          link_id: linkId,
          contract_id: contractId,
          guarantor_partner_id: body.existing_partner_id,
          kind_of_obligation: body.kind_of_obligation ?? null,
          is_new: false,
          partner_status: "confirmed",
        })
      )
    }
  ),

  http.post(
    `${API}/contracts/:contractId/guarantors/:linkId/remove`,
    ({ params }) => {
      const contractId = params.contractId as string
      guarantorsByContractId[contractId] = (
        guarantorsByContractId[contractId] ?? []
      ).filter(g => g.link_id !== params.linkId)
      return envelope(null)
    }
  ),

  // PATCH /contracts/{contract_id} — the Contract details tab. Merges into whichever case holds
  // the contract, so step 2's list and step 3's derived figures both reflect the edit.
  http.patch(`${API}/contracts/:contractId`, async ({ params, request }) => {
    const contractId = params.contractId as string
    const body = (await request.json()) as Record<string, unknown>

    for (const [caseId, rows] of Object.entries(mockCaseContractsByCaseId)) {
      const index = rows.findIndex(r => r.id === contractId)
      if (index === -1) continue
      const merged = CaseContractSchema.parse({
        ...rows[index],
        ...body,
        // Money comes back as decimal strings on a read even though the edit accepts numbers.
        net_instalment:
          body.net_instalment === null || body.net_instalment === undefined
            ? rows[index].net_instalment
            : String(body.net_instalment),
        residual_value:
          body.residual_value === null || body.residual_value === undefined
            ? rows[index].residual_value
            : String(body.residual_value),
      })
      mockCaseContractsByCaseId[caseId] = [
        ...rows.slice(0, index),
        merged,
        ...rows.slice(index + 1),
      ]
      return envelope(merged)
    }

    return errorEnvelope("NOT_FOUND", "Contract not found", 404)
  }),

  // ── Manual entry: the payment plan (US 1.11) ──────────────────────────────
  // 404 until a plan exists, which is what the tab treats as "no plan yet" rather than as an error
  // — a contract with no financing component genuinely has none.
  http.get(
    `${API}/cases/:caseId/contracts/:contractId/payment-plan`,
    ({ params }) => {
      const plan = planByContractId[params.contractId as string]
      return plan
        ? envelope(PaymentPlanResponseSchema.parse(plan))
        : errorEnvelope("NOT_FOUND", "No payment plan for this contract", 404)
    }
  ),

  // Derives a plan from the contract's terms. Twelve equal instalments plus a final line, which is
  // enough to exercise the screen — the real arithmetic (annuity, discounting, the broken-period
  // factor) is the engine's and is specified in Refinancing-Calculation-Specification.html.
  http.post(
    `${API}/cases/:caseId/contracts/:contractId/payment-plan/generate`,
    ({ params }) => {
      const contractId = params.contractId as string
      const entries = Array.from({ length: 12 }, (_u, i) => ({
        due_date: `2026-${String(i + 1).padStart(2, "0")}-01`,
        amount: "1250.00",
        is_final: false,
        origin: "generated",
      }))
      entries.push({
        due_date: "2027-01-01",
        amount: "41200.00",
        is_final: true,
        origin: "generated",
      })

      const plan = {
        component: {
          id: "00000000-0000-4000-8000-00000000fc01",
          contract_id: contractId,
          status: "calculated",
          calculated_as_of: "2026-09-08T10:00:00Z",
          freeze_timestamp: null,
          financing_amount_share: "56200.00",
          financed_residual: "41200.00",
          share_running_instalment: "1250.00",
          share_final_instalment: "41200.00",
        },
        entries,
      }
      planByContractId[contractId] = plan
      return envelope(PaymentPlanResponseSchema.parse(plan))
    }
  ),

  http.put(
    `${API}/cases/:caseId/contracts/:contractId/payment-plan`,
    async ({ params, request }) => {
      const contractId = params.contractId as string
      const body = (await request.json()) as {
        rows: { due_date: string; amount: string | number; is_final: boolean }[]
      }
      const existing = planByContractId[contractId]

      const plan = {
        component: existing?.component ?? {
          id: "00000000-0000-4000-8000-00000000fc01",
          contract_id: contractId,
          status: "manual",
          calculated_as_of: null,
          freeze_timestamp: null,
          financing_amount_share: null,
          financed_residual: null,
          share_running_instalment: null,
          share_final_instalment: null,
        },
        // `origin` becomes `manual` — that is the whole point of the field, and the tab renders it.
        entries: body.rows.map(r => ({
          due_date: r.due_date,
          amount: String(r.amount),
          is_final: r.is_final,
          origin: "manual",
        })),
      }
      planByContractId[contractId] = plan
      return envelope(PaymentPlanResponseSchema.parse(plan))
    }
  ),

  // ── US 1.12 / US 1.28: removal, activity and comments ─────────────────────
  http.post(
    `${API}/cases/:caseId/contracts/bulk-remove`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as {
        contract_ids: string[]
        reason: string
      }
      const before = mockCaseContractsByCaseId[caseId] ?? []
      const ids = new Set(body.contract_ids)
      mockCaseContractsByCaseId[caseId] = before.filter(c => !ids.has(c.id))
      const removed = before.length - mockCaseContractsByCaseId[caseId].length

      // The removal is an event on the case, which is what makes the reason worth requiring —
      // recorded here so the Activity tab actually shows it.
      pushActivity(caseId, {
        event_type: "contracts_removed",
        action_type: "delete",
        entity_type: "contract",
        entity_display: `${removed} contract(s)`,
        new_data: { reason: body.reason },
      })

      return envelope(BulkRemoveResponseSchema.parse({ removed }))
    }
  ),

  http.get(`${API}/cases/:caseId/activity`, ({ params, request }) => {
    const url = new URL(request.url)
    const rows = [...(activityByCaseId[params.caseId as string] ?? [])]
      // Newest first for display, but the ordering key is audit_seq — two events can share a
      // timestamp, a sequence cannot tie.
      .sort((a, b) => b.audit_seq - a.audit_seq)
    const perPage = Number(url.searchParams.get("per_page") ?? "25") || 25
    const page = Number(url.searchParams.get("page") ?? "1") || 1
    const start = (page - 1) * perPage

    return envelope(
      CaseActivityResponseSchema.parse({
        activity: rows.slice(start, start + perPage),
        total: rows.length,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
      })
    )
  }),

  http.get(`${API}/cases/:caseId/comments`, ({ params }) => {
    const rows = commentsByCaseId[params.caseId as string] ?? []
    return envelope(
      CaseCommentListResponseSchema.parse({
        items: rows,
        total: rows.length,
        page: 1,
        per_page: 50,
      })
    )
  }),

  http.post(`${API}/cases/:caseId/comments`, async ({ params, request }) => {
    const caseId = params.caseId as string
    const body = (await request.json()) as { body: string }
    const rows = commentsByCaseId[caseId] ?? []

    const comment = CaseCommentItemSchema.parse({
      // 12 hex characters in the last segment. An earlier version used a `cm` prefix as a
      // mnemonic for "comment"; `m` is not hex, so every POST failed the schema and MSW 500'd.
      id: `00000000-0000-4000-8000-0000000c${(rows.length + 1)
        .toString(16)
        .padStart(4, "0")}`,
      case_id: caseId,
      author_id: FRONT_OFFICE_USER,
      // The role AT THE TIME of writing, which is what the schema keeps.
      author_role: getMockRole(),
      body: body.body,
      created_at: new Date().toISOString(),
    })

    commentsByCaseId[caseId] = [...rows, comment]
    pushActivity(caseId, {
      event_type: "comment_added",
      action_type: "create",
      entity_type: "comment",
      entity_display: null,
      new_data: null,
    })
    return envelope(comment)
  }),

  // POST /cases/{case_id}/decide — US 1.29. The outcome becomes the request status, which the
  // case's derived display status renders, so the list and the badge both change after a decision.
  http.post(`${API}/cases/:caseId/decide`, async ({ params, request }) => {
    const caseId = params.caseId as string
    const body = (await request.json()) as {
      outcome: string
      reason: string | null
    }
    const found = allCases().find(c => c.id === caseId)
    if (!found) return errorEnvelope("NOT_FOUND", "Case not found", 404)

    found.display_status = body.outcome
    pushActivity(caseId, {
      event_type: "request_decided",
      action_type: "update",
      entity_type: "request",
      entity_display: found.case_reference,
      new_data: { outcome: body.outcome, reason: body.reason },
    })
    return envelope(CaseResponseSchema.parse(found))
  }),

  // ── US 1.30 / US 1.31: the case lifecycle transitions ─────────────────────
  // All four are POST with no body. The mock moves display_status the way the real derivation
  // would, so the list, the badge and the offered transitions all change afterwards.
  ...(
    [
      ["resubmit", "submitted"],
      ["return-to-queue", "open"],
      ["reactivate", "open"],
      ["cancel", "cancelled"],
    ] as const
  ).map(([path, nextStatus]) =>
    http.post(`${API}/cases/:caseId/${path}`, ({ params }) => {
      const caseId = params.caseId as string
      const found = allCases().find(c => c.id === caseId)
      if (!found) return errorEnvelope("NOT_FOUND", "Case not found", 404)

      // Returning to the queue also drops the owner — that is what the queue is for.
      if (path === "return-to-queue") found.owner_user_id = null

      found.display_status = nextStatus
      found.case_status =
        nextStatus === "cancelled"
          ? CaseStatusSchema.enum.cancelled
          : CaseStatusSchema.enum.open

      pushActivity(caseId, {
        event_type: `case_${path.replace(/-/g, "_")}`,
        action_type: "update",
        entity_type: "case",
        entity_display: found.case_reference,
        new_data: { display_status: nextStatus },
      })
      return envelope(CaseResponseSchema.parse(found))
    })
  ),

  // GET /partners/{id}/lc-numbers — the bridge between the name search and the bind (Q-014).
  http.get(`${API}/partners/:partnerId/lc-numbers`, ({ params }) => {
    const partnerId = params.partnerId as string
    return envelope(
      LcNumberListResponseSchema.parse({
        partner_id: partnerId,
        items: mockLcNumbersByPartnerId[partnerId] ?? [],
      })
    )
  }),

  // GET /cases/{case_id}/contracts — the Contracts tab's terms half. A case with no fixture entry
  // answers an empty page rather than 404: every case has a contract set, possibly empty, so an
  // empty list is the honest shape and the tab's empty state is a real state.
  http.get(`${API}/cases/:caseId/contracts`, ({ params }) => {
    const items = mockCaseContractsByCaseId[params.caseId as string] ?? []
    return envelope(
      CaseContractListResponseSchema.parse({ items, total: items.length })
    )
  }),

  // The Start-case dialog disables any type the bank has no requirement configured for. All seven are
  // startable here so the dialog is explorable.
  http.get(`${API}/document-requirement-catalogs/case-types/startable`, () =>
    envelope({ startable_case_types: [...CaseTypeSchema.options] })
  ),

  http.get(`${API}/cases`, ({ request }) => {
    const url = new URL(request.url)
    const page = paginate(url, applyFilters(url, allCases()))
    return envelope(CaseListResponseSchema.parse(page))
  }),

  // The leasing company's own cases. Scoped to portal-origin rows, which is the closest honest
  // approximation of the backend scoping to the caller's LC.
  http.get(`${API}/lc/cases`, ({ request }) => {
    const url = new URL(request.url)
    const own = allCases().filter(c => c.origin === "portal")
    const page = paginate(url, applyFilters(url, own))
    return envelope(CaseListResponseSchema.parse(page))
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
