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
  mockFinancingByCaseId,
  mockRemainingBalanceByCaseId,
} from "@/mocks/fixtures/financing"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

// US 1.21 — approval conditions. Session-scoped; seeded from the overview fixture's covenants so
// the Data tab's list is not empty on first open.
const conditionsByCaseId: Record<string, ApprovalConditionResponse[]> = {}

function seedConditions(caseId: string): ApprovalConditionResponse[] {
  if (conditionsByCaseId[caseId] !== undefined) {
    return conditionsByCaseId[caseId]
  }
  const financing = mockFinancingByCaseId[caseId]
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
  const seeded = caseId === DESIGN_CASE
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
  const financing = mockFinancingByCaseId[caseId]
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

export const financingHandlers = [
  http.get(`${API}/cases/:caseId/financing`, ({ params }) => {
    const caseId = params.caseId as string
    if (mockFinancingByCaseId[caseId] === undefined) {
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
          hasRate && CASES_WITH_FIGURES.includes(caseId)
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
      hasRate && CASES_WITH_FIGURES.includes(caseId)
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
        financing_id: mockFinancingByCaseId[caseId]?.id ?? caseId,
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
    const financing = mockFinancingByCaseId[params.caseId as string]
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
