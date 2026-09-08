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

export const financingHandlers = [
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
          id: "00000000-0000-4000-8000-00000000wa01".replace("wa", "aa"),
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
