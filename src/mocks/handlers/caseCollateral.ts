/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The case's collateral (DAT data) and its four-eyes re-check.
 *
 * The state machine is modelled honestly because the screen's correctness depends on it: the
 * re-check clears through **three acts by two roles**, and `confirm` is refused unless the figure
 * has actually been re-determined. A mock that let confirm clear a `needs_recheck` state would make
 * the panel look right while hiding the exact bug the rule exists to prevent.
 *
 * The case starts in `needs_recheck` so the whole flow is reachable on first open.
 */
import { http } from "msw"
import { CollateralResponseSchema } from "@/features/cases/api/schema"
import type {
  CollateralRecheckState,
  CollateralType,
} from "@/features/cases/api/schema"
import { envelope, errorEnvelope } from "@/mocks/envelope"
import { API } from "@/mocks/apiBase"
import { mockUuid } from "@/mocks/uuid"
import { getMockRole } from "@/mocks/role"
import { BACK_OFFICE_ROLE } from "@/features/users/types"

const FRONT_OFFICE_USER = mockUuid("5")
// A different person, so `confirm` can succeed for a back-office session without the same id
// supplying both pairs of eyes.
const BACK_OFFICE_USER = mockUuid("6")

type CollateralState = {
  collateral_type: CollateralType | null
  current_total_eur: string | null
  evidence_document_id: string | null
  recheck_state: CollateralRecheckState
  redetermined_by: string | null
  redetermined_at: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  value_history: { total_eur: string; set_by: string; set_at: string }[]
}

const byCaseId: Record<string, CollateralState> = {}

function state(caseId: string): CollateralState {
  byCaseId[caseId] ??= {
    collateral_type: "chattel_mortgage",
    current_total_eur: "385000.00",
    // The design's "Evidence · DAT_valuation.pdf". Nullable on the wire; a case can carry a figure
    // with no document attached yet.
    evidence_document_id: mockUuid("eb01"),
    // Starts outstanding: the composition changed, so the figure must be determined again.
    recheck_state: "needs_recheck",
    redetermined_by: null,
    redetermined_at: null,
    confirmed_by: null,
    confirmed_at: null,
    value_history: [
      {
        total_eur: "385000.00",
        set_by: FRONT_OFFICE_USER,
        set_at: "2026-06-19T09:00:00Z",
      },
    ],
  }
  return byCaseId[caseId]
}

function response(caseId: string) {
  const s = state(caseId)
  return CollateralResponseSchema.parse({
    id: mockUuid("c01a"),
    case_id: caseId,
    ...s,
  })
}

function actingUser(): string {
  return getMockRole() === BACK_OFFICE_ROLE
    ? BACK_OFFICE_USER
    : FRONT_OFFICE_USER
}

export const caseCollateralHandlers = [
  http.get(`${API}/cases/:caseId/collateral`, ({ params }) =>
    envelope(response(params.caseId as string))
  ),

  http.put(
    `${API}/cases/:caseId/collateral/total`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as { total_eur: string | number }
      const s = state(caseId)
      const total = String(body.total_eur)
      s.current_total_eur = total
      s.value_history = [
        ...s.value_history,
        {
          total_eur: total,
          set_by: actingUser(),
          set_at: new Date().toISOString(),
        },
      ]
      return envelope(response(caseId))
    }
  ),

  http.put(
    `${API}/cases/:caseId/collateral/type`,
    async ({ params, request }) => {
      const body = (await request.json()) as { collateral_type: CollateralType }
      state(params.caseId as string).collateral_type = body.collateral_type
      return envelope(response(params.caseId as string))
    }
  ),

  http.put(
    `${API}/cases/:caseId/collateral/evidence`,
    async ({ params, request }) => {
      const body = (await request.json()) as {
        evidence_document_id: string | null
      }
      state(params.caseId as string).evidence_document_id =
        body.evidence_document_id
      return envelope(response(params.caseId as string))
    }
  ),

  http.post(`${API}/cases/:caseId/collateral/recheck`, ({ params }) => {
    const s = state(params.caseId as string)
    s.recheck_state = "needs_recheck"
    s.redetermined_by = null
    s.redetermined_at = null
    s.confirmed_by = null
    s.confirmed_at = null
    return envelope(response(params.caseId as string))
  }),

  // A NEW figure, not an acknowledgement — which is why this endpoint takes an amount at all.
  http.post(
    `${API}/cases/:caseId/collateral/redetermine`,
    async ({ params, request }) => {
      const caseId = params.caseId as string
      const body = (await request.json()) as { total_eur: string | number }
      const s = state(caseId)
      const total = String(body.total_eur)
      s.current_total_eur = total
      s.recheck_state = "redetermined"
      s.redetermined_by = actingUser()
      s.redetermined_at = new Date().toISOString()
      s.value_history = [
        ...s.value_history,
        {
          total_eur: total,
          set_by: s.redetermined_by,
          set_at: s.redetermined_at,
        },
      ]
      return envelope(response(caseId))
    }
  ),

  http.post(`${API}/cases/:caseId/collateral/confirm`, ({ params }) => {
    const caseId = params.caseId as string
    const s = state(caseId)
    // The rule, enforced rather than assumed: confirming the OLD figure is impossible.
    if (s.recheck_state !== "redetermined") {
      return errorEnvelope(
        "VALIDATION_ERROR",
        "Collateral must be re-determined before it can be confirmed",
        422
      )
    }
    const actor = actingUser()
    if (actor === s.redetermined_by) {
      return errorEnvelope(
        "PERMISSION_DENIED",
        "The person who re-determined the value cannot confirm it",
        403
      )
    }
    s.recheck_state = "clear"
    s.confirmed_by = actor
    s.confirmed_at = new Date().toISOString()
    return envelope(response(caseId))
  }),
]
