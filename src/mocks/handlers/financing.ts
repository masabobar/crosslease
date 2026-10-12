/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Handlers for the financing overview and its remaining balance — the case workspace's Data tab.
 *
 * Both responses are parsed through the **real** Zod schemas on the way out, so a fixture that
 * drifts from the contract throws here rather than rendering a broken screen.
 *
 * A case with no entry in the fixture map answers **NOT_FOUND**, not an empty financing. That is
 * the honest shape: `FinancingDataPanel` treats NOT_FOUND as "no financing yet" and says so, while
 * an empty object would render a financing with every figure blank and read as a calculation
 * failure. Only an approved request produces a financing (BR-03).
 */
import { http } from "msw"
import {
  ApprovalConditionListResponseSchema,
  ContractContributionListResponseSchema,
  FinancingComponentListResponseSchema,
  FinancingReadSchema,
  ApprovalConditionResponseSchema,
  FinancingOverviewResponseSchema,
  FinancingRemainingBalanceResponseSchema,
} from "@/features/financing/api/schema"
import type { ApprovalConditionResponse } from "@/features/financing/api/schema"
import { GovernedActionSchema } from "@/features/governedActions/api/schema"
import {
  mockFinancingFor,
  isWizardCase,
  mockRemainingBalanceByCaseId,
} from "@/mocks/fixtures/financing"
import {
  FinancingListItemSchema,
  FinancingListResponseSchema,
} from "@/features/financing/api/financingListSchema"
import { mockCases } from "@/mocks/fixtures/cases"
import {
  FinancingCollateralSchema,
  FinancingDetailSchema,
  FinancingSecuritiesResponseSchema,
} from "@/features/financing/api/financingDetailSchema"
import { FinancingStatusSchema } from "@/features/financing/api/financingListSchema"
import { mockUuid } from "@/mocks/uuid"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

// US 1.21 — approval conditions. Session-scoped; seeded from the overview fixture's covenants so
// the Data tab's list is not empty on first open.
const conditionsByCaseId: Record<string, ApprovalConditionResponse[]> = {}

function seedConditions(caseId: string): ApprovalConditionResponse[] {
  if (conditionsByCaseId[caseId] !== undefined) {
    return conditionsByCaseId[caseId]
  }
  const financing = mockFinancingFor(caseId)
  conditionsByCaseId[caseId] = (financing?.covenants ?? []).map(c => ({
    id: c.id,
    financing_id: financing?.id ?? caseId,
    condition_text: c.condition_text,
    due_date: c.due_date,
    state: c.state,
    step_reference: c.step_reference,
    evidence_document_id: null,
    set_by: "00000000-0000-4000-8000-000000000005",
    set_at: "2026-07-24T09:12:00Z",
    settled_by: null,
    settled_at: null,
  }))
  return conditionsByCaseId[caseId]
}

let conditionSeq = 0

// ── US 1.15 — the Calculation area ───────────────────────────────────────────────────────────────
// Session-scoped calculation state. The rate starts EMPTY on purpose: US 1.15 forbids a default or
// a prefill, and the pending-figures state is only reachable if the fixture starts without one.

const LIVE_CASE = "00000000-0000-4000-8000-00000000c005"
// RR-2026-104 — the case the designs draw.
const DESIGN_CASE = "00000000-0000-4000-8000-00000000c001"

/** The cases that carry computed per-contract figures. */
const CASES_WITH_FIGURES = [LIVE_CASE, DESIGN_CASE]

function hasFigures(caseId: string): boolean {
  return CASES_WITH_FIGURES.includes(caseId) || isWizardCase(caseId)
}

type CalcState = {
  refinancing_rate: string | null
  refinancing_quota_override: string | null
  effective_quota: string
  value_date: string | null
  committed_rate: string | null
  committed_rate_expiry: string | null
  rate_lock_days: number | null
}

const calcByCaseId: Record<string, CalcState> = {}

function calcState(caseId: string): CalcState {
  const seeded = caseId === DESIGN_CASE || isWizardCase(caseId)
  calcByCaseId[caseId] ??= {
    // Empty everywhere except the design's case: US 1.15 forbids a default, and the pending state
    // is only reachable on a financing that has none.
    refinancing_rate: seeded ? "4.650" : null,
    refinancing_quota_override: null,
    // 98 % — the leasing company keeps two to five per cent of every instalment. The design's case
    // shows 97 %, which is the figure printed on its frames.
    effective_quota: seeded ? "0.97" : "0.98",
    value_date: seeded ? "2026-08-01" : "2026-10-01",
    committed_rate: seeded ? "4.650" : null,
    // Deliberately BEFORE the value date on the design's case, so the dummy's stale-rate warning
    // is reachable: the rate was held for seven days from the quote and ran out first.
    committed_rate_expiry: seeded ? "2026-07-24" : null,
    rate_lock_days: seeded ? 7 : null,
  }
  return calcByCaseId[caseId]
}

/**
 * Per-contract figures, already rounded to the cent — which is what the frontend then sums.
 * `share_final_instalment` and `financed_residual` deliberately differ by a cent in total, because
 * that difference is real and the screen must not present it as a fault.
 */
const COMPONENTS = [
  {
    id: "00000000-0000-4000-8000-00000000fc01",
    contract_id: "00000000-0000-4000-8000-0000000000c1",
    status: "calculated",
    financing_amount_share: "744621.03",
    financed_residual: "719779.83",
    share_running_instalment: "8322.91",
    share_final_instalment: "719779.78",
  },
  {
    id: "00000000-0000-4000-8000-00000000fc02",
    contract_id: "00000000-0000-4000-8000-0000000000c2",
    status: "calculated",
    financing_amount_share: "744621.03",
    financed_residual: "719779.83",
    share_running_instalment: "8322.91",
    share_final_instalment: "719779.84",
  },
]

function financingRecord(caseId: string) {
  const state = calcState(caseId)
  const financing = mockFinancingFor(caseId)
  return {
    id: financing?.id ?? "00000000-0000-4000-8000-00000000f001",
    case_id: caseId,
    financing_reference: financing?.financing_reference ?? "FIN-2026-0005",
    framework_agreement_id: null,
    product_template_id: null,
    product_template_version: null,
    kind: "package",
    refinancing_rate: state.refinancing_rate,
    refinancing_quota_override: state.refinancing_quota_override,
    effective_quota: state.effective_quota,
    value_date: state.value_date,
    committed_rate: state.committed_rate,
    committed_rate_expiry: state.committed_rate_expiry,
    rate_lock_days: state.rate_lock_days,
    settlement_ready: state.refinancing_rate !== null,
    calculation_state:
      state.refinancing_rate === null ? "pending" : "calculated",
    calculation_version: 1,
    // Null until the core banking system issues it — which is what keeps the rate field open.
    loan_number: null,
    loan_account: null,
    status: "active",
    created_by: "00000000-0000-4000-8000-000000000005",
    created_at: "2026-08-01T09:00:00Z",
  }
}

/**
 * The financing ids the list hands out, and the case each one belongs to.
 *
 * Built from the same derivation the list uses, so a row and the detail it opens can never
 * disagree about which case a financing came out of.
 */
function mockFinancingIndex(): Array<{ id: string; caseId: string }> {
  return mockCases
    .filter(row => mockFinancingFor(row.id) !== undefined)
    .map((row, index) => ({
      id: mockUuid(`f1${index.toString(16).padStart(2, "0")}`),
      caseId: row.id,
    }))
}

/** Session-scoped edits of the values a person maintains by hand. */
const maintainedByFinancingId: Record<
  string,
  {
    loan_number: string | null
    loan_account: string | null
    soll_amount: string | null
    soll_date: string | null
    haben_amount: string | null
    haben_date: string | null
    updated_at: string
  }
> = {}

function mockRepaymentRows(): unknown[] {
  // Six rows around today's position, which is what the schedule shows: the payout, three
  // instalments behind, the current one, and one still to come.
  const rows = [
    [
      "2026-06-01",
      "6253.22",
      "5812.40",
      "440.82",
      "385925.63",
      null,
      false,
      false,
    ],
    [
      "2026-07-01",
      "6253.22",
      "5834.90",
      "418.32",
      "380090.73",
      null,
      false,
      false,
    ],
    [
      "2026-08-01",
      "6253.22",
      "5857.52",
      "395.70",
      "372868.01",
      null,
      true,
      false,
    ],
    [
      "2026-09-01",
      "6253.22",
      "5880.26",
      "372.96",
      "366987.75",
      null,
      false,
      true,
    ],
    [
      "2026-10-01",
      "6253.22",
      "5903.13",
      "350.09",
      "361084.62",
      null,
      false,
      true,
    ],
    [
      "2026-11-01",
      "6253.22",
      "5926.12",
      "327.10",
      "355158.50",
      null,
      false,
      true,
    ],
  ] as const
  return rows.map(row => ({
    due_date: row[0],
    payment: row[1],
    principal: row[2],
    interest: row[3],
    closing_balance: row[4],
    kind: row[5],
    is_current: row[6],
    is_future: row[7],
  }))
}

function mockFinancingDetail(financingId: string, caseId: string) {
  const row = mockCases.find(entry => entry.id === caseId)
  const overview = mockFinancingFor(caseId)
  const held = maintainedByFinancingId[financingId]
  // The OS+ pair exists from the moment the loan is set up there — which on this fixture's own
  // status set means disbursed or later.
  const isSetUp =
    overview?.status === FinancingStatusSchema.enum.disbursed ||
    overview?.status === FinancingStatusSchema.enum.active

  return FinancingDetailSchema.parse({
    id: financingId,
    case_id: caseId,
    financing_reference:
      overview?.financing_reference ??
      (row?.case_reference ?? "RR-0000-000").replace("RR", "FIN"),
    framework_agreement_id: mockUuid("fa01"),
    product_template_id: null,
    product_template_version: null,
    kind: (row?.contract_count ?? 0) > 1 ? "package" : "single",
    refinancing_rate: overview?.refinancing_rate ?? "4.650",
    refinancing_quota_override: null,
    effective_quota: "97.00",
    value_date: "2026-08-01",
    first_instalment_date: "2026-09-01",
    instalment_day: 1,
    default_instalment_day: 1,
    rate_quoted_on: "2026-07-24",
    agreed_loan_amount: "423171.22",
    committed_rate: "4.650",
    committed_rate_expiry: "2026-07-31",
    rate_lock_days: 7,
    settlement_ready: true,
    calculation_blockers: [],
    calculation_state: "calculated",
    calculation_version: 1,
    calculated_at: "2026-07-24T10:00:00Z",

    // Only once the loan is set up in OS+ — which is the rule the record states rather than the
    // UI deriving it from the status.
    loan_number: held?.loan_number ?? (isSetUp ? "LIQ-88-014772" : null),
    loan_account: held?.loan_account ?? (isSetUp ? "0092 118 4471" : null),
    loan_values_editable: isSetUp,

    status: overview?.status ?? "active",
    ended_reason: null,
    created_by: "00000000-0000-4000-8000-000000000005",
    created_at: row?.created_at ?? "2026-07-10T09:00:00Z",

    case_reference: row?.case_reference ?? "—",
    lc_partner_id: "00000000-0000-4000-8000-00000000a001",
    lc_partner_name: row?.lc_partner_name ?? null,
    framework_agreement_name: "Premium Leasing — master refinancing 2025",
    product_template_name: "Standard lease refinancing, v4",
    product_template_version_number: "4",

    soll_amount: held?.soll_amount ?? "108500.00",
    soll_date: held?.soll_date ?? "2026-06-12",
    // Not recorded: the Outstanding case the prototype's list filters on — a debit booked with no
    // matching credit yet.
    haben_amount: held?.haben_amount ?? null,
    haben_date: held?.haben_date ?? null,

    updated_at: held?.updated_at ?? "2026-08-06T14:22:00Z",

    // Read off the same sources the tabs render, so a count can never disagree with the tab it
    // labels — a fixed number here said "Covenants 1" over a panel showing two.
    counts: {
      contracts: row?.contract_count ?? 1,
      collaterals: 2,
      covenants: seedConditions(caseId).length,
      redemptions: 0,
    },
    balance: {
      outstanding: "372868.01",
      as_of: "2026-08-28",
      payout: "423171.22",
      approved_loan_amount: "423171.22",
      provisional: overview?.status === "calculating",
    },
    repayment: {
      rows: mockRepaymentRows(),
      instalment: "6253.22",
      instalments_due: 11,
      instalment_count: 12,
      repayment_start: "2026-09-01",
      final_instalment: "372868.01",
      residual: "372868.00",
      maturity: "2027-08-01",
      total_interest: "18482.21",
      outstanding: "372868.01",
      adjusted_for_redemptions: false,
      early_redemption_case_id: null,
    },
    contract_shares: [],
  })
}

export const financingHandlers = [
  /**
   * The financing's own record — the route that gave the financing an address of its own.
   *
   * The detail is denormalised, so the header resolves no names: the case reference, the leasing
   * company, the framework agreement and the product template all arrive with it.
   */
  http.get(`${API}/financings/:financingId`, ({ params }) => {
    const financingId = params.financingId as string
    const match = mockFinancingIndex().find(entry => entry.id === financingId)
    if (match === undefined)
      return errorEnvelope("NOT_FOUND", "No such financing", 404)
    return envelope(mockFinancingDetail(financingId, match.caseId))
  }),

  /**
   * The values a person maintains by hand.
   *
   * `expected_updated_at` is the optimistic lock, and the mock enforces it: a stale token is
   * refused rather than overwritten, which is the only way the screen's conflict path can ever be
   * exercised before the real backend is reachable.
   */
  http.patch(
    `${API}/financings/:financingId/maintained-values`,
    async ({ params, request }) => {
      const financingId = params.financingId as string
      const match = mockFinancingIndex().find(entry => entry.id === financingId)
      if (match === undefined)
        return errorEnvelope("NOT_FOUND", "No such financing", 404)

      const body = (await request.json()) as Record<string, unknown>
      const current = maintainedByFinancingId[financingId]
      const expected = current?.updated_at ?? "2026-08-06T14:22:00Z"
      if (body.expected_updated_at !== expected)
        return errorEnvelope(
          "CONFLICT",
          "The financing has changed since this screen loaded. Reload and try again.",
          409
        )

      const before = mockFinancingDetail(financingId, match.caseId)
      const key = (field: string, fallback: string | null) =>
        field in body ? ((body[field] as string | null) ?? null) : fallback

      maintainedByFinancingId[financingId] = {
        loan_number: key("loan_number", before.loan_number),
        loan_account: key("loan_account", before.loan_account),
        soll_amount: key("soll_amount", before.soll_amount),
        soll_date: key("soll_date", before.soll_date),
        haben_amount: key("haben_amount", before.haben_amount),
        haben_date: key("haben_date", before.haben_date),
        updated_at: new Date().toISOString(),
      }
      return envelope(
        mockFinancingDetail(financingId, match.caseId),
        "MAINTAINED_VALUES_UPDATED"
      )
    }
  ),

  http.get(`${API}/financings/:financingId/collateral`, ({ params }) =>
    envelope(
      FinancingCollateralSchema.parse({
        id: mockUuid("c011"),
        financing_id: params.financingId as string,
        collateral_type: "chattel_mortgage",
        current_total_eur: "498000.00",
        // Nothing waiting: the proposal path is reached by re-determining, not seeded into it.
        proposed_total_eur: null,
        evidence: [
          {
            document_id: mockUuid("c0e1"),
            file_name: "DAT_Gutachten_M-MN8842.pdf",
            size: 284_112,
            uploaded_at_utc: "2026-07-22T08:14:00Z",
            uploaded_at_local: "2026-07-22T10:14:00",
          },
        ],
        // Raised by the partial redemption on this package — and only an approved
        // re-determination clears it.
        recheck_state: "needs_recheck",
        redetermined_by: null,
        redetermined_by_name: null,
        redetermined_at: null,
        confirmed_by: "00000000-0000-4000-8000-000000000003",
        confirmed_by_name: "Petra Lang",
        confirmed_at: "2026-07-22T11:02:00Z",
        decision_block: null,
        value_history: [
          {
            total_eur: "498000.00",
            set_by: "00000000-0000-4000-8000-000000000005",
            set_by_name: "A. Berger",
            set_at: "2026-07-22T10:40:00Z",
          },
        ],
      })
    )
  ),

  http.get(`${API}/financings/:financingId/securities`, ({ params }) =>
    envelope(
      FinancingSecuritiesResponseSchema.parse({
        financing_id: params.financingId as string,
        items: [
          {
            collateral_id: mockUuid("c0a1"),
            collateral_type: "guarantee",
            value: "150000.00",
            guarantor_partner_id: "00000000-0000-4000-8000-00000000a005",
            guarantor_display_name: "Josef Müller",
            evidence_document_id: mockUuid("c0a2"),
            evidence_document_name: "Buergschaftserklaerung.pdf",
            evidence_document_date: "2026-07-18",
            kind_of_obligation: "guarantor",
            contract_id: mockUuid("c0b1"),
            contract_number: "PL-2026-00412",
          },
          {
            // No proof filed — the row has to say so rather than read as complete.
            collateral_id: mockUuid("c0a3"),
            collateral_type: "assignment_of_receivables",
            value: null,
            guarantor_partner_id: null,
            guarantor_display_name: null,
            evidence_document_id: null,
            evidence_document_name: null,
            evidence_document_date: null,
            kind_of_obligation: null,
            contract_id: mockUuid("c0b1"),
            contract_number: "PL-2026-00412",
          },
        ],
      })
    )
  ),

  /**
   * The financings list — the one financing route that is not case-scoped.
   *
   * Derived from the cases rather than kept as a second fixture: a financing IS the outcome of a
   * case, so a list built from anything else would drift from the case it claims to have come out
   * of. Only cases that actually reached a financing are listed.
   */
  http.get(`${API}/financings`, ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get("page") ?? 1)
    const perPage = Number(url.searchParams.get("per_page") ?? 25)
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase()
    const status = url.searchParams.get("status")
    const kind = url.searchParams.get("kind")

    let rows = mockCases
      .filter(row => mockFinancingFor(row.id) !== undefined)
      .map((row, index) => {
        const overview = mockFinancingFor(row.id)
        return FinancingListItemSchema.parse({
          id: mockUuid(`f1${index.toString(16).padStart(2, "0")}`),
          case_id: row.id,
          case_reference: row.case_reference,
          financing_reference:
            overview?.financing_reference ??
            row.case_reference.replace("RR", "FIN"),
          // The case's own financing status is the financing's status — there is not a second one.
          status: overview?.status ?? "calculating",
          kind:
            overview?.kind ??
            ((row.contract_count ?? 0) > 1 ? "package" : "single"),
          refinancing_rate: overview?.refinancing_rate ?? null,
          // The overview carries no value date — the case's own rate due date is the closest
          // thing the fixtures hold, and the column shows a dash where there is none.
          value_date: row.rate_due_date,
          loan_number: overview?.loan_number ?? null,
          lc_number: null,
          lc_partner_name: row.lc_partner_name,
          contract_count: row.contract_count ?? 0,
          calculation_state: overview?.status ?? "not_started",
          created_at: row.created_at,
        })
      })

    if (search) {
      rows = rows.filter(
        row =>
          row.financing_reference.toLowerCase().includes(search) ||
          (row.lc_partner_name ?? "").toLowerCase().includes(search) ||
          (row.loan_number ?? "").toLowerCase().includes(search)
      )
    }
    if (status) rows = rows.filter(row => row.status === status)
    if (kind) rows = rows.filter(row => row.kind === kind)

    const start = (page - 1) * perPage
    return envelope(
      FinancingListResponseSchema.parse({
        items: rows.slice(start, start + perPage),
        total: rows.length,
        page,
        per_page: perPage,
        total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
      })
    )
  }),

  http.get(`${API}/cases/:caseId/financing`, ({ params }) => {
    const caseId = params.caseId as string
    if (mockFinancingFor(caseId) === undefined) {
      return errorEnvelope("NOT_FOUND", "No financing for this case", 404)
    }
    return envelope(FinancingReadSchema.parse(financingRecord(caseId)))
  }),

  http.get(`${API}/cases/:caseId/financing/components`, ({ params }) => {
    const caseId = params.caseId as string
    const hasRate = calcState(caseId).refinancing_rate !== null
    return envelope(
      FinancingComponentListResponseSchema.parse({
        case_id: caseId,
        // Nothing is computed before the rate exists, so there are no components either.
        components:
          hasRate && hasFigures(caseId)
            ? COMPONENTS.map(c => ({
                ...c,
                calculated_as_of: "2026-09-08T09:00:00Z",
                freeze_timestamp: null,
              }))
            : [],
      })
    )
  }),

  http.get(`${API}/cases/:caseId/financing/per-contract`, ({ params }) => {
    const caseId = params.caseId as string
    const hasRate = calcState(caseId).refinancing_rate !== null
    const rows =
      hasRate && hasFigures(caseId)
        ? COMPONENTS.map(c => ({
            contract_id: c.contract_id,
            status: c.status,
            financing_amount_share: c.financing_amount_share,
            // 48 instalments, 47 refinanced — the one on the value date is not.
            refinanced_instalments: 47,
          }))
        : []
    return envelope(
      ContractContributionListResponseSchema.parse({
        case_id: caseId,
        contributions: rows,
        contract_count: rows.length,
        contribution_sum: hasRate && rows.length > 0 ? "1489242.06" : null,
        figures_pending: !hasRate,
      })
    )
  }),

  http.put(
    `${API}/cases/:caseId/financing/rate`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as { rate: string | number }
      calcState(caseId).refinancing_rate = String(body.rate)
      return envelope(FinancingReadSchema.parse(financingRecord(caseId)))
    }
  ),

  http.put(
    `${API}/cases/:caseId/financing/quota`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as { quota: string | number }
      const state = calcState(caseId)
      state.refinancing_quota_override = String(body.quota)
      state.effective_quota = String(body.quota)
      return envelope(FinancingReadSchema.parse(financingRecord(caseId)))
    }
  ),

  http.put(
    `${API}/cases/:caseId/financing/value-date`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as { value_date: string }
      calcState(caseId).value_date = body.value_date
      return envelope(FinancingReadSchema.parse(financingRecord(caseId)))
    }
  ),

  http.post(`${API}/cases/:caseId/financing/recalculate`, ({ params }) =>
    envelope(
      FinancingReadSchema.parse(financingRecord(params.caseId as string))
    )
  ),

  http.post(
    `${API}/cases/:caseId/financing/commit-rate`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json().catch(() => ({}))) as {
        lock_days?: number
      }
      const state = calcState(caseId)
      const lockDays = body.lock_days ?? 7
      state.committed_rate = state.refinancing_rate
      state.rate_lock_days = lockDays
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + lockDays)
      state.committed_rate_expiry = expiry.toISOString().slice(0, 10)
      return envelope(FinancingReadSchema.parse(financingRecord(caseId)))
    }
  ),

  http.get(`${API}/cases/:caseId/financing/conditions`, ({ params }) => {
    const rows = seedConditions(params.caseId as string)
    const open = rows.filter(r => r.state === "open").length
    return envelope(
      ApprovalConditionListResponseSchema.parse({
        conditions: rows,
        open_count: open,
        // The backend's own readiness signal, which the UI reads rather than recomputes.
        all_settled: open === 0,
      })
    )
  }),

  http.post(
    `${API}/cases/:caseId/financing/conditions`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as {
        condition_text: string
        due_date: string
        step_reference: string | null
      }
      const rows = seedConditions(caseId)
      conditionSeq += 1

      const created = ApprovalConditionResponseSchema.parse({
        id: `00000000-0000-4000-8000-0000000ac${conditionSeq
          .toString(16)
          .padStart(3, "0")}`,
        financing_id: mockFinancingFor(caseId)?.id ?? caseId,
        condition_text: body.condition_text,
        due_date: body.due_date,
        state: "open",
        step_reference: body.step_reference,
        evidence_document_id: null,
        set_by: "00000000-0000-4000-8000-000000000005",
        set_at: new Date().toISOString(),
        settled_by: null,
        settled_at: null,
      })
      conditionsByCaseId[caseId] = [...rows, created]
      return envelope(created)
    }
  ),

  // Settling is immediate — the condition was met.
  http.post(
    `${API}/cases/:caseId/financing/conditions/:conditionId/settle`,
    ({ params }) => {
      const caseId = params.caseId as string
      const rows = seedConditions(caseId)
      const index = rows.findIndex(r => r.id === params.conditionId)
      if (index === -1) {
        return errorEnvelope("NOT_FOUND", "Condition not found", 404)
      }
      const settled = ApprovalConditionResponseSchema.parse({
        ...rows[index],
        state: "met",
        settled_by: "00000000-0000-4000-8000-000000000005",
        settled_at: new Date().toISOString(),
      })
      conditionsByCaseId[caseId] = [
        ...rows.slice(0, index),
        settled,
        ...rows.slice(index + 1),
      ]
      return envelope(settled)
    }
  ),

  /**
   * Waiving returns a GOVERNED ACTION, not the condition — a waiver needs a second approver. So
   * the condition is deliberately left `open` here: the mock must not model a waiver as applied,
   * or the screen would show a control lifted that in reality is only requested.
   */
  http.post(
    `${API}/cases/:caseId/financing/conditions/:conditionId/waive`,
    ({ params }) =>
      envelope(
        GovernedActionSchema.parse({
          id: "00000000-0000-4000-8000-00000000aa01",
          action_type: "financing_approval_condition_waive",
          subject_type: "approval_condition",
          subject_id: params.conditionId,
          tenant_id: null,
          status: "pending",
          initiator_id: "00000000-0000-4000-8000-000000000005",
          approver_id: null,
          display_snapshot: {},
          initiator_snapshot: {},
          approver_snapshot: null,
          execution_params: {},
          reason: null,
          approver_comment: null,
          expires_at: null,
          resolved_at: null,
          correlation_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      )
  ),

  http.get(`${API}/cases/:caseId/financing/overview`, ({ params }) => {
    const financing = mockFinancingFor(params.caseId as string)
    if (!financing) {
      return errorEnvelope("NOT_FOUND", "This case has no financing yet.", 404)
    }
    return envelope(FinancingOverviewResponseSchema.parse(financing))
  }),

  http.get(`${API}/cases/:caseId/financing/remaining-balance`, ({ params }) => {
    const balance = mockRemainingBalanceByCaseId[params.caseId as string]
    if (!balance) {
      return errorEnvelope(
        "NOT_FOUND",
        "No outstanding balance has been calculated for this case.",
        404
      )
    }
    return envelope(FinancingRemainingBalanceResponseSchema.parse(balance))
  }),
]
