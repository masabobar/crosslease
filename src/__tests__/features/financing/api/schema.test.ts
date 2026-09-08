import { describe, expect, it } from "vitest"
import {
  ApprovalConditionListResponseSchema,
  ContractContributionListResponseSchema,
  FinancingComponentResponseSchema,
  FinancingReadSchema,
  ApprovalConditionResponseSchema,
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

// ── US 1.21 — approval conditions ────────────────────────────────────────────────────────────────

const openCondition = {
  id: "00000000-0000-4000-8000-0000000ac001",
  financing_id: "00000000-0000-4000-8000-00000000f001",
  condition_text: "Provide the signed guarantee",
  due_date: "2026-10-31",
  state: "open",
  step_reference: null,
  evidence_document_id: null,
  set_by: "00000000-0000-4000-8000-000000000005",
  set_at: "2026-09-08T09:12:00Z",
  settled_by: null,
  settled_at: null,
}

describe("ApprovalConditionResponseSchema", () => {
  it("parses an open condition with every nullable field null", () => {
    expect(ApprovalConditionResponseSchema.parse(openCondition).state).toBe(
      "open"
    )
  })

  it("accepts each of the four states the contract declares", () => {
    for (const state of ["open", "met", "waived", "expired"]) {
      expect(
        ApprovalConditionResponseSchema.parse({ ...openCondition, state }).state
      ).toBe(state)
    }
  })

  it("rejects a state outside the contract's enum", () => {
    expect(() =>
      ApprovalConditionResponseSchema.parse({
        ...openCondition,
        state: "waiver_pending",
      })
    ).toThrow()
  })

  // Requesting a waiver answers with a governed action and leaves the condition open, so a row
  // never carries a "waiver requested" state. A schema that tolerated one would invite the UI to
  // render a control as lifted while it is still only requested.
  it("rejects a missing settled_at rather than defaulting it", () => {
    const withoutSettledAt = Object.fromEntries(
      Object.entries(openCondition).filter(([key]) => key !== "settled_at")
    )
    expect(() =>
      ApprovalConditionResponseSchema.parse(withoutSettledAt)
    ).toThrow()
  })
})

describe("ApprovalConditionListResponseSchema", () => {
  it("parses an empty list", () => {
    const parsed = ApprovalConditionListResponseSchema.parse({
      conditions: [],
      open_count: 0,
      all_settled: true,
    })
    expect(parsed.conditions).toEqual([])
    expect(parsed.all_settled).toBe(true)
  })

  // `all_settled` is the backend's own readiness signal and is read verbatim. The schema must not
  // recompute or cross-check it against open_count: Epic 3 puts fulfilment evaluation in Conditions
  // Management, so a disagreement is the server's to resolve, not this layer's to paper over.
  it("keeps all_settled as sent even when it disagrees with open_count", () => {
    const parsed = ApprovalConditionListResponseSchema.parse({
      conditions: [openCondition],
      open_count: 1,
      all_settled: true,
    })
    expect(parsed.all_settled).toBe(true)
    expect(parsed.open_count).toBe(1)
  })

  it("rejects a fractional open_count", () => {
    expect(() =>
      ApprovalConditionListResponseSchema.parse({
        conditions: [],
        open_count: 1.5,
        all_settled: false,
      })
    ).toThrow()
  })
})

// ── US 1.15 — the calculation carrier ────────────────────────────────────────────────────────────

const pendingFinancing = {
  id: "00000000-0000-4000-8000-00000000f001",
  case_id: "00000000-0000-4000-8000-00000000c005",
  financing_reference: "FIN-2026-0005",
  framework_agreement_id: null,
  product_template_id: null,
  product_template_version: null,
  kind: "package",
  refinancing_rate: null,
  refinancing_quota_override: null,
  effective_quota: "0.98",
  value_date: null,
  committed_rate: null,
  committed_rate_expiry: null,
  rate_lock_days: null,
  settlement_ready: false,
  calculation_state: "pending",
  calculation_version: 1,
  loan_number: null,
  loan_account: null,
  status: "active",
  created_by: "00000000-0000-4000-8000-000000000005",
  created_at: "2026-08-01T09:00:00Z",
}

describe("FinancingReadSchema", () => {
  // The rate is optional at intake, so a financing with no rate at all is a real state and must
  // parse rather than throw.
  it("parses a financing with no rate entered yet", () => {
    const parsed = FinancingReadSchema.parse(pendingFinancing)
    expect(parsed.refinancing_rate).toBeNull()
    expect(parsed.settlement_ready).toBe(false)
  })

  // Money and rates stay decimal strings end to end — the specification is explicit that they must
  // not be parsed into binary floats, so a number on the wire is a contract violation, not input
  // to coerce.
  it("rejects a numeric rate rather than coercing it to a string", () => {
    expect(() =>
      FinancingReadSchema.parse({ ...pendingFinancing, refinancing_rate: 4.25 })
    ).toThrow()
  })

  it("keeps the committed rate alongside the current rate", () => {
    const parsed = FinancingReadSchema.parse({
      ...pendingFinancing,
      refinancing_rate: "4.375",
      committed_rate: "4.250",
      committed_rate_expiry: "2026-09-15",
      rate_lock_days: 7,
    })
    // Both are retained: their difference is what documents the deviation.
    expect(parsed.refinancing_rate).toBe("4.375")
    expect(parsed.committed_rate).toBe("4.250")
  })

  // `calculation_state` has no declared enum in the contract, so an unfamiliar value must pass
  // through rather than throw and blank the screen.
  it("accepts any calculation_state string", () => {
    expect(
      FinancingReadSchema.parse({
        ...pendingFinancing,
        calculation_state: "awaiting_treasury_notice",
      }).calculation_state
    ).toBe("awaiting_treasury_notice")
  })

  it("rejects a fractional calculation_version", () => {
    expect(() =>
      FinancingReadSchema.parse({
        ...pendingFinancing,
        calculation_version: 1.5,
      })
    ).toThrow()
  })
})

describe("ContractContributionListResponseSchema", () => {
  it("parses the pending state with no contributions", () => {
    const parsed = ContractContributionListResponseSchema.parse({
      case_id: "00000000-0000-4000-8000-00000000c005",
      contributions: [],
      contract_count: 0,
      contribution_sum: null,
      figures_pending: true,
    })
    expect(parsed.figures_pending).toBe(true)
    expect(parsed.contribution_sum).toBeNull()
  })

  it("requires figures_pending rather than defaulting it", () => {
    // Defaulting it to false would render pending figures as computed.
    expect(() =>
      ContractContributionListResponseSchema.parse({
        case_id: "00000000-0000-4000-8000-00000000c005",
        contributions: [],
        contract_count: 0,
        contribution_sum: null,
      })
    ).toThrow()
  })
})

describe("FinancingComponentResponseSchema", () => {
  const component = {
    id: "00000000-0000-4000-8000-00000000fc01",
    contract_id: "00000000-0000-4000-8000-0000000000c1",
    status: "calculated",
    calculated_as_of: "2026-09-08T09:00:00Z",
    freeze_timestamp: null,
    financing_amount_share: "744621.03",
    financed_residual: "719779.83",
    share_running_instalment: "8322.91",
    share_final_instalment: "719779.78",
  }

  // The two final figures are separate fields on the wire and stay separate in the type. A schema
  // that folded them into one would re-create the conflation US 1.15 R4 removed.
  it("carries the quota'd residual and the schedule final instalment as distinct fields", () => {
    const parsed = FinancingComponentResponseSchema.parse(component)
    expect(parsed.financed_residual).toBe("719779.83")
    expect(parsed.share_final_instalment).toBe("719779.78")
  })

  it("parses an unfrozen component", () => {
    expect(
      FinancingComponentResponseSchema.parse(component).freeze_timestamp
    ).toBeNull()
  })

  it("rejects a component missing its calculation date", () => {
    const withoutDate = Object.fromEntries(
      Object.entries(component).filter(([key]) => key !== "calculated_as_of")
    )
    expect(() => FinancingComponentResponseSchema.parse(withoutDate)).toThrow()
  })
})
