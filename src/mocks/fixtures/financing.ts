/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Financing overviews, keyed by the case they belong to.
 *
 * The figures on `c005` are the design's own
 * (.project-management/output/docs/financing-design-extract.md §8): reference `FIN-2026-066`, a
 * package loan, outstanding € 372.868,01 against an approved payout of € 423.171,22, rate 4,650 %,
 * loan number LIQ-88-014772. Using the Figma numbers rather than invented ones means the built
 * screen can be compared against the frame field by field.
 *
 * **Most cases deliberately have no financing.** Only an approved request produces one (BR-03), so
 * the map covers three of the fixture cases and every other id falls through to NOT_FOUND. A mock
 * that gave every case a financing would hide the state the reviewer will meet most often.
 *
 * Money and rates are decimal **strings**, matching the wire format — see
 * `features/financing/api/schema.ts` for why they are not numbers.
 */
import type {
  FinancingOverviewResponse,
  FinancingRemainingBalanceResponse,
} from "@/features/financing/api/schema"

const LC_PARTNER = "00000000-0000-4000-8000-00000000a001"
const FRAMEWORK_AGREEMENT = "00000000-0000-4000-8000-00000000fa01"
const PRODUCT_TEMPLATE = "00000000-0000-4000-8000-00000000d001"
const BACK_OFFICE_USER = "00000000-0000-4000-8000-000000000006"

// The design's fully-populated financing — every figure comes from the Figma frame.
const LIVE_FINANCING: FinancingOverviewResponse = {
  id: "00000000-0000-4000-8000-00000000f066",
  case_id: "00000000-0000-4000-8000-00000000c005",
  financing_reference: "FIN-2026-066",
  status: "active",
  kind: "package",
  framework_agreement_id: FRAMEWORK_AGREEMENT,
  product_template_id: PRODUCT_TEMPLATE,
  lc_partner_id: LC_PARTNER,
  loan_number: "LIQ-88-014772",
  loan_account: "88-014772-01",
  refinancing_rate: "4.650",
  effective_quota: "97.00",
  collateral_total: "436500.00",
  contract_count: 3,
  object_count: 4,
  nominal_claim: "441653.43",
  present_value: "423171.22",
  financing_amount: "423171.22",
  financing_quote_pct: "97.85",
  figures_pending: false,
  bank_figures_visible: true,
  contracts: [
    {
      contract_id: "00000000-0000-4000-8000-0000000acc01",
      short_name: "Volvo FH 460",
      leasing_company_contract_number: "PL-2025-00211",
      contract_type: "Hire purchase",
      status: "Active",
      financing_amount_share: "96400.00",
      objects: [
        {
          object_id: "00000000-0000-4000-8000-0000000bb001",
          object_number: 1,
          object_group: "Commercial vehicles",
          object_sub_group: "Tractor unit",
        },
      ],
    },
    {
      contract_id: "00000000-0000-4000-8000-0000000acc02",
      short_name: "Krone SD trailer",
      leasing_company_contract_number: "PL-2025-00212",
      contract_type: "Finance lease",
      status: "Active",
      financing_amount_share: "184320.00",
      objects: [
        {
          object_id: "00000000-0000-4000-8000-0000000bb002",
          object_number: 2,
          object_group: "Commercial vehicles",
          object_sub_group: "Semi-trailer",
        },
        {
          object_id: "00000000-0000-4000-8000-0000000bb003",
          object_number: 3,
          object_group: "Commercial vehicles",
          object_sub_group: "Semi-trailer",
        },
      ],
    },
    {
      contract_id: "00000000-0000-4000-8000-0000000acc03",
      short_name: "Linde H30 forklift",
      leasing_company_contract_number: "PL-2025-00213",
      contract_type: "Operating lease",
      // A contract that has run its course inside a still-live financing — a state the design's
      // Contracts tab shows but which is easy to forget exists.
      status: "Ended",
      financing_amount_share: "142451.22",
      objects: [
        {
          object_id: "00000000-0000-4000-8000-0000000bb004",
          object_number: 4,
          object_group: "Industrial equipment",
          object_sub_group: "Forklift",
        },
      ],
    },
  ],
  originating_decision: {
    request_status: "committed",
    decision_reason:
      "Collateral cover and quota within the framework agreement limits.",
    decided_by: BACK_OFFICE_USER,
    decided_at: "2026-07-24T09:12:00Z",
  },
  // Four covenants, one per state, so every badge variant is reachable without editing fixtures.
  covenants: [
    {
      id: "00000000-0000-4000-8000-0000000dd001",
      condition_text:
        "Provide the notarised transfer of title for object 1 within 30 days of payout.",
      state: "open",
      due_date: "2026-09-30",
      step_reference: "Step 24",
    },
    {
      id: "00000000-0000-4000-8000-0000000dd002",
      condition_text:
        "Confirm comprehensive insurance cover naming the bank as loss payee.",
      state: "met",
      due_date: "2026-08-15",
      step_reference: "Step 19",
    },
    {
      id: "00000000-0000-4000-8000-0000000dd003",
      condition_text: "Submit the audited annual accounts for the prior year.",
      state: "waived",
      due_date: "2026-08-01",
      step_reference: "Step 31",
    },
    {
      id: "00000000-0000-4000-8000-0000000dd004",
      condition_text:
        "Register the security interest in the object register for object 4.",
      state: "expired",
      due_date: "2026-08-20",
      step_reference: null,
    },
  ],
  open_covenant_count: 1,
  financing_history: [
    {
      status: "calculating",
      changed_by: null,
      changed_at: "2026-07-24T09:14:00Z",
      by_system: true,
      ended_reason: null,
    },
    {
      status: "ready_for_setup",
      changed_by: BACK_OFFICE_USER,
      changed_at: "2026-07-28T11:03:00Z",
      by_system: false,
      ended_reason: null,
    },
    {
      status: "disbursed",
      changed_by: BACK_OFFICE_USER,
      changed_at: "2026-08-01T08:00:00Z",
      by_system: false,
      ended_reason: null,
    },
    {
      status: "active",
      changed_by: null,
      changed_at: "2026-08-01T08:05:00Z",
      by_system: true,
      ended_reason: null,
    },
  ],
}

// Still calculating: every figure null and `figures_pending` set. This is what the screen looks
// like in the minutes after approval, and it is the state the design never shows — the Figma frame
// only has the populated case, which is exactly why it is worth being able to open.
const CALCULATING_FINANCING: FinancingOverviewResponse = {
  ...LIVE_FINANCING,
  id: "00000000-0000-4000-8000-00000000f071",
  case_id: "00000000-0000-4000-8000-00000000c001",
  financing_reference: "FIN-2026-071",
  status: "calculating",
  kind: "single",
  loan_number: null,
  loan_account: null,
  refinancing_rate: "4.400",
  effective_quota: null,
  collateral_total: null,
  nominal_claim: null,
  present_value: null,
  financing_amount: null,
  financing_quote_pct: null,
  figures_pending: true,
  bank_figures_visible: true,
  contracts: [],
  covenants: [],
  open_covenant_count: 0,
  financing_history: [
    {
      status: "calculating",
      changed_by: null,
      changed_at: "2026-09-02T15:41:00Z",
      by_system: true,
      ended_reason: null,
    },
  ],
}

// Figures withheld from the caller's role. The amounts are present in the object — the point is
// that `bank_figures_visible: false` must stop the UI rendering them, not that they are absent.
const RESTRICTED_FINANCING: FinancingOverviewResponse = {
  ...LIVE_FINANCING,
  id: "00000000-0000-4000-8000-00000000f069",
  case_id: "00000000-0000-4000-8000-00000000c003",
  financing_reference: "FIN-2026-069",
  bank_figures_visible: false,
}

export const mockFinancingByCaseId: Record<string, FinancingOverviewResponse> =
  {
    [LIVE_FINANCING.case_id]: LIVE_FINANCING,
    [CALCULATING_FINANCING.case_id]: CALCULATING_FINANCING,
    [RESTRICTED_FINANCING.case_id]: RESTRICTED_FINANCING,
  }

// Computed as of a date rather than stored, so the date is part of the answer. Only the live
// financing has one — a balance on a financing that has not been calculated is meaningless.
export const mockRemainingBalanceByCaseId: Record<
  string,
  FinancingRemainingBalanceResponse
> = {
  [LIVE_FINANCING.case_id]: {
    case_id: LIVE_FINANCING.case_id,
    as_of: "2026-09-03",
    remaining_balance: "372868.01",
  },
}
