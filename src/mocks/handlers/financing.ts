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
  FinancingOverviewResponseSchema,
  FinancingRemainingBalanceResponseSchema,
} from "@/features/financing/api/schema"
import {
  mockFinancingByCaseId,
  mockRemainingBalanceByCaseId,
} from "@/mocks/fixtures/financing"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"

export const financingHandlers = [
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
