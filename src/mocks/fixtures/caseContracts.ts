/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * The lease contracts of a case's refinancing request, backing the workspace's Contracts tab.
 *
 * ── WHY THE VOCABULARY HERE DIFFERS FROM THE FINANCING FIXTURE ─────────────────────────────────
 * `fixtures/financing.ts` gives its contract refs the **design's** words — `Hire purchase`,
 * `Finance lease`, `Operating lease`, status `Active` / `Ended` — because that is what the Figma
 * frame shows and those fields are unconstrained strings on the wire.
 *
 * These records use the **contract's** vocabulary instead: `contract_type` is `lease` /
 * `hire_purchase` and `amortisation_type` is `full` / `partial`, because those are the only values
 * `ContractCreate` / `ContractEdit` admit — so they are the only values a contract can actually be
 * created with, whatever the design draws. `deferred_state` is the one enum-constrained status
 * (`active | deferred`); the design's `Overdue` and `Ended` have no wire representation at all.
 *
 * The panel prefers the contract record over the financing ref, so the tab renders the wire
 * vocabulary — which is the point: it shows the reconciliation rather than the design's wording.
 *
 * Keyed to the three contracts of the LIVE financing on case `…c005` in `fixtures/financing.ts`.
 */
import type { CaseContract } from "@/features/cases/api/schema"

const LIVE_FINANCING_CASE_ID = "00000000-0000-4000-8000-00000000c005"

// Two distinct lessees across three contracts, and one contract with none recorded — so the
// wizard summary's derived lessee count is 2, not 3, which is the case worth having a fixture for.
const LESSEE_PARTNER_ID = "00000000-0000-4000-8000-00000000a101"
const LESSEE_PARTNER_ID_2 = "00000000-0000-4000-8000-00000000a102"

const LIVE_FINANCING_CONTRACTS: CaseContract[] = [
  {
    id: "00000000-0000-4000-8000-0000000acc01",
    leasing_company_contract_number: "PL-2025-00211",
    lessee_partner_id: LESSEE_PARTNER_ID,
    short_name: "Volvo FH 460",
    contract_type: "hire_purchase",
    amortisation_type: "full",
    term_months: 48,
    net_instalment: "1250.00",
    residual_value: "0.00",
    contract_start: "2025-09-01",
    deferred_state: "active",
  },
  {
    id: "00000000-0000-4000-8000-0000000acc02",
    leasing_company_contract_number: "PL-2025-00212",
    lessee_partner_id: LESSEE_PARTNER_ID_2,
    short_name: "Krone SD trailer",
    contract_type: "lease",
    amortisation_type: "partial",
    term_months: 60,
    net_instalment: "2480.50",
    residual_value: "41200.00",
    contract_start: "2025-11-15",
    // A deferred contract inside a live financing — the one non-default state the wire can express.
    deferred_state: "deferred",
  },
  {
    id: "00000000-0000-4000-8000-0000000acc03",
    leasing_company_contract_number: "PL-2025-00213",
    lessee_partner_id: null,
    short_name: "Linde H30 forklift",
    contract_type: "lease",
    amortisation_type: "partial",
    // Every term is nullable on the wire, and a bulk-imported contract can genuinely arrive with
    // none of them. One row carries that state so the tab's em-dashes are exercised rather than
    // every row being conveniently complete.
    term_months: null,
    net_instalment: null,
    residual_value: null,
    contract_start: null,
    deferred_state: "active",
  },
]

export const mockCaseContractsByCaseId: Record<string, CaseContract[]> = {
  [LIVE_FINANCING_CASE_ID]: LIVE_FINANCING_CONTRACTS,
}
