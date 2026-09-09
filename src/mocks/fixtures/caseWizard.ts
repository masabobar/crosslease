/**
 * PROTOTYPE MOCK — see .claude/rules/project/prototype-mode.md
 *
 * Fixtures for the New refinancing request wizard's step 1: the Händlernummern a leasing company
 * holds, and the leasing-company/agreement block a case reads back after the bind.
 *
 * ── WHY THE COMPANIES HAVE DIFFERENT NUMBER COUNTS ─────────────────────────────────────────────
 * The spec records that a company holds **up to four** dealer numbers with no uniqueness rule, and
 * nothing says which one a request binds to (Q-014). Both shapes are therefore reachable here:
 * Premium Leasing holds three and Nordic Fleet exactly one. Reviewing only the single-number
 * company would hide the question the design never answered.
 *
 * ── AND WHY NONE HOLDS ZERO ────────────────────────────────────────────────────────────────────
 * Baltic Machinery used to be absent from this map on purpose, so that step 1's "no dealer number"
 * state could be reached. That was the wrong thing to make reachable *here*: the dummy's own
 * eligibility rule is `status Confirmed && type Legal entity && lcNums.length > 0`, so a company
 * with no number is never offered in its picker at all — the state cannot happen from the UI. All
 * three companies therefore hold a number, and picking any of them binds.
 */
import type { LcNumberResponse } from "@/features/partners/api/schema"
import type { CaseLeasingCompanyResponse } from "@/features/cases/api/schema"
import { LC_PARTNER_ID } from "@/mocks/fixtures/partners"

const LC_NORDIC = "00000000-0000-4000-8000-00000000a002"
const LC_BALTIC = "00000000-0000-4000-8000-00000000a003"

function lcNumber(
  partnerId: string,
  id: string,
  number: string
): LcNumberResponse {
  return {
    id,
    partner_id: partnerId,
    lc_number: number,
    created_at: "2025-03-04T09:00:00Z",
  }
}

export const mockLcNumbersByPartnerId: Record<string, LcNumberResponse[]> = {
  // Three numbers — the case the design does not cover.
  [LC_PARTNER_ID]: [
    lcNumber(LC_PARTNER_ID, "00000000-0000-4000-8000-00000000d001", "1042"),
    lcNumber(LC_PARTNER_ID, "00000000-0000-4000-8000-00000000d002", "1043"),
    lcNumber(LC_PARTNER_ID, "00000000-0000-4000-8000-00000000d003", "2117"),
  ],
  // Exactly one — the design's implicit assumption.
  [LC_NORDIC]: [
    lcNumber(LC_NORDIC, "00000000-0000-4000-8000-00000000d004", "3300"),
  ],
  [LC_BALTIC]: [
    lcNumber(LC_BALTIC, "00000000-0000-4000-8000-00000000d005", "5120"),
    lcNumber(LC_BALTIC, "00000000-0000-4000-8000-00000000d006", "5121"),
  ],
}

/**
 * What `GET /cases/{id}/leasing-company` answers once bound.
 *
 * Carries no bank account, matching the contract and §5.2 — the design's two IBANs are not here
 * because the endpoint does not have them.
 *
 * `framework_volume_eur` is `null` on purpose. The spec records that **no framework volume is known
 * for any of the seven leasing companies**, so the realistic state is the empty one; a populated
 * figure would make the screen look more finished than the data is.
 */
export function boundLeasingCompany(
  lcNumberValue: string
): CaseLeasingCompanyResponse {
  return {
    lc_number: lcNumberValue,
    name: "Premium Leasing GmbH",
    address: { city: "Hamburg", country: "DE" },
    contact_person: "Head of refinancing",
    personennummer_os_plus: "OS-99001",
    agreement_reference: "FA-2025-002",
    agreement_active: true,
    vfe_amount_eur: "850.00",
    refinancing_quota: "97.00",
    value_date_rule: "month_end",
    instalment_due_day: 1,
    framework_volume_eur: null,
  }
}

// The unbound state — every case between POST /cases and the first bind. The endpoint answers this
// rather than 404, which is why the wizard treats `null` fields as "not bound yet".
export const UNBOUND_LEASING_COMPANY: CaseLeasingCompanyResponse = {
  lc_number: null,
  name: null,
  address: null,
  contact_person: null,
  personennummer_os_plus: null,
  agreement_reference: null,
  agreement_active: false,
  vfe_amount_eur: null,
  refinancing_quota: null,
  value_date_rule: null,
  instalment_due_day: null,
  framework_volume_eur: null,
}
