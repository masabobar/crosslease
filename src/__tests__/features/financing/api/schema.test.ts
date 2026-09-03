import { describe, expect, it } from "vitest"
import {
  FinancingOverviewResponseSchema,
  FinancingRemainingBalanceResponseSchema,
  FinancingStatusSchema,
} from "@/features/financing/api/schema"

// The narrowest response the contract permits: every nullable field null, every array empty. This
// is a real state — a financing exists from approval, before any figure is computed — so it must
// parse, not throw.
const minimalOverview = {
  id: "00000000-0000-4000-8000-00000000f001",
  case_id: "00000000-0000-4000-8000-00000000c001",
  financing_reference: "FIN-2026-001",
  status: "calculating",
  kind: "single",
  framework_agreement_id: null,
  product_template_id: null,
  lc_partner_id: null,
  loan_number: null,
  loan_account: null,
  refinancing_rate: null,
  effective_quota: null,
  collateral_total: null,
  contract_count: 0,
  object_count: 0,
  nominal_claim: null,
  present_value: null,
  financing_amount: null,
  financing_quote_pct: null,
  figures_pending: true,
  bank_figures_visible: false,
  contracts: [],
  originating_decision: null,
  covenants: [],
  open_covenant_count: 0,
  financing_history: [],
}

describe("FinancingOverviewResponseSchema", () => {
  it("accepts a financing whose figures are all still null", () => {
    expect(() =>
      FinancingOverviewResponseSchema.parse(minimalOverview)
    ).not.toThrow()
  })

  it("keeps monetary amounts as strings rather than coercing them to numbers", () => {
    const parsed = FinancingOverviewResponseSchema.parse({
      ...minimalOverview,
      financing_amount: "423171.22",
    })
    // The guard against the `max_volume_eur` defect: coercion would make this a number here, and
    // would turn a null amount into 0 — rendering "€ 0,00" for "not calculated yet".
    expect(parsed.financing_amount).toBe("423171.22")
    expect(typeof parsed.financing_amount).toBe("string")
  })

  it("preserves null for an uncalculated amount instead of defaulting it", () => {
    const parsed = FinancingOverviewResponseSchema.parse(minimalOverview)
    expect(parsed.financing_amount).toBeNull()
    expect(parsed.nominal_claim).toBeNull()
  })

  it("rejects an unknown financing status", () => {
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        status: "live",
      })
    ).toThrow()
  })

  it("rejects an unknown financing kind", () => {
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        kind: "bundle",
      })
    ).toThrow()
  })

  it("rejects a non-UUID case id", () => {
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        case_id: "c001",
      })
    ).toThrow()
  })

  it("rejects a missing visibility gate rather than defaulting it to visible", () => {
    const withoutGate: Record<string, unknown> = { ...minimalOverview }
    delete withoutGate.bank_figures_visible
    expect(() => FinancingOverviewResponseSchema.parse(withoutGate)).toThrow()
  })

  it("rejects a contract count sent as a string", () => {
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        contract_count: "3",
      })
    ).toThrow()
  })

  it("parses a covenant with each valid state and rejects an invalid one", () => {
    const covenant = {
      id: "00000000-0000-4000-8000-0000000dd001",
      condition_text: "Provide the notarised transfer of title.",
      due_date: "2026-09-30",
      step_reference: "Step 24",
    }
    for (const state of ["open", "met", "waived", "expired"]) {
      expect(() =>
        FinancingOverviewResponseSchema.parse({
          ...minimalOverview,
          covenants: [{ ...covenant, state }],
        })
      ).not.toThrow()
    }
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        covenants: [{ ...covenant, state: "breached" }],
      })
    ).toThrow()
  })

  it("accepts a contract type outside the spec's two-value set", () => {
    // Deliberate: the design shows three contract types and the spec has two — an unreconciled
    // conflict. Parsing as a plain string means whichever vocabulary the backend sends renders.
    expect(() =>
      FinancingOverviewResponseSchema.parse({
        ...minimalOverview,
        contracts: [
          {
            contract_id: "00000000-0000-4000-8000-0000000acc01",
            short_name: null,
            leasing_company_contract_number: null,
            contract_type: "Operating lease",
            status: "Active",
            financing_amount_share: null,
            objects: [],
          },
        ],
      })
    ).not.toThrow()
  })
})

describe("FinancingStatusSchema", () => {
  it("covers exactly the six states the contract declares", () => {
    expect(FinancingStatusSchema.options).toEqual([
      "calculating",
      "ready_for_setup",
      "disbursed",
      "active",
      "ended",
      "cancelled",
    ])
  })
})

describe("FinancingRemainingBalanceResponseSchema", () => {
  it("accepts a balance with its as-of date", () => {
    expect(() =>
      FinancingRemainingBalanceResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        as_of: "2026-09-03",
        remaining_balance: "372868.01",
      })
    ).not.toThrow()
  })

  it("rejects a balance with no as-of date", () => {
    // A computed balance without its date cannot be reconciled against anything, so the contract
    // makes it required and this asserts we do not silently accept it missing.
    expect(() =>
      FinancingRemainingBalanceResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        remaining_balance: "372868.01",
      })
    ).toThrow()
  })

  it("keeps the balance as a string", () => {
    const parsed = FinancingRemainingBalanceResponseSchema.parse({
      case_id: "00000000-0000-4000-8000-00000000c005",
      as_of: "2026-09-03",
      remaining_balance: "372868.01",
    })
    expect(parsed.remaining_balance).toBe("372868.01")
  })
})
