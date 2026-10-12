import { describe, expect, it } from "vitest"
import {
  FinancingCollateralSchema,
  FinancingDetailSchema,
} from "@/features/financing/api/financingDetailSchema"

const BASE = {
  id: "00000000-0000-4000-8000-00000000f100",
  case_id: "00000000-0000-4000-8000-00000000c001",
  financing_reference: "FIN-2026-071",
  framework_agreement_id: null,
  product_template_id: null,
  product_template_version: null,
  kind: "single",
  refinancing_rate: "4.650",
  refinancing_quota_override: null,
  effective_quota: "97.00",
  value_date: "2026-08-01",
  first_instalment_date: "2026-09-01",
  instalment_day: 1,
  rate_quoted_on: "2026-07-24",
  agreed_loan_amount: "423171.22",
  committed_rate: "4.650",
  committed_rate_expiry: "2026-07-31",
  rate_lock_days: 7,
  settlement_ready: true,
  calculation_state: "calculated",
  calculation_version: 1,
  loan_number: null,
  loan_account: null,
  loan_values_editable: false,
  status: "active",
  created_by: "00000000-0000-4000-8000-000000000005",
  created_at: "2026-07-10T09:00:00Z",
  case_reference: "RR-2026-104",
  lc_partner_id: null,
  lc_partner_name: null,
  framework_agreement_name: null,
  product_template_name: null,
  soll_amount: null,
  soll_date: null,
  haben_amount: null,
  haben_date: null,
  updated_at: "2026-08-06T14:22:00Z",
  counts: { contracts: 1, collaterals: 2, covenants: 1, redemptions: 0 },
  balance: {
    outstanding: "372868.01",
    as_of: "2026-08-28",
    payout: "423171.22",
    approved_loan_amount: "423171.22",
    provisional: false,
  },
  repayment: null,
}

describe("FinancingDetailSchema", () => {
  it("accepts a record with no repayment plan yet", () => {
    expect(() => FinancingDetailSchema.parse(BASE)).not.toThrow()
  })

  // Decimal STRING. Coercing it would turn a null outstanding balance into a convincing 0 —
  // which on this screen reads as "nothing owed" rather than "not recorded".
  it("rejects a numeric outstanding balance", () => {
    expect(() =>
      FinancingDetailSchema.parse({
        ...BASE,
        balance: { ...BASE.balance, outstanding: 372868.01 },
      })
    ).toThrow()
  })

  // The optimistic-lock token. Without it a maintained-values write cannot be sent at all, so a
  // record missing it must fail here rather than at the PATCH.
  it("rejects a record with no updated_at", () => {
    const withoutToken: Record<string, unknown> = { ...BASE }
    delete withoutToken.updated_at
    expect(() => FinancingDetailSchema.parse(withoutToken)).toThrow()
  })

  it("accepts a schedule row flagged as today's position", () => {
    expect(() =>
      FinancingDetailSchema.parse({
        ...BASE,
        repayment: {
          rows: [
            {
              due_date: "2026-08-01",
              payment: "6253.22",
              principal: "5857.52",
              interest: "395.70",
              closing_balance: "372868.01",
              kind: null,
              is_current: true,
              is_future: false,
            },
          ],
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
      })
    ).not.toThrow()
  })
})

describe("FinancingCollateralSchema", () => {
  const COLLATERAL = {
    id: "00000000-0000-4000-8000-0000000c0110",
    financing_id: BASE.id,
    collateral_type: "chattel_mortgage",
    current_total_eur: "498000.00",
    proposed_total_eur: null,
    evidence: [],
    recheck_state: "needs_recheck",
    redetermined_by: null,
    redetermined_by_name: null,
    redetermined_at: null,
    confirmed_by: null,
    confirmed_by_name: null,
    confirmed_at: null,
    decision_block: null,
    value_history: [],
  }

  it("accepts a total flagged for recheck", () => {
    expect(() => FinancingCollateralSchema.parse(COLLATERAL)).not.toThrow()
  })

  // The three reasons the backend can give for refusing a confirmation. An unrecognised one must
  // fail here rather than render as an empty explanation beside a proposal.
  it("rejects an unknown decision block", () => {
    expect(() =>
      FinancingCollateralSchema.parse({
        ...COLLATERAL,
        decision_block: "because_i_said_so",
      })
    ).toThrow()
  })
})
