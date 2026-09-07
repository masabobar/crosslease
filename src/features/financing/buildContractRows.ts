import type { FinancingContractRef } from "@/features/financing/api/schema"
import type { CaseContract } from "@/features/cases/api/schema"

/**
 * One row of the financing workspace's Contracts tab.
 *
 * The design's row needs both halves and no single endpoint carries them: the financing knows the
 * *share* of the loan a contract carries, the contract knows its *terms*. So the two lists are
 * joined here by contract id rather than fetched per row — a per-row request would be an N+1 across
 * a bundle that can hold a couple of hundred contracts.
 */
export interface FinancingContractRow {
  contractId: string
  /** Design's "Contract number". Falls back through the two identifiers the wire offers. */
  contractNumber: string | null
  contractType: string | null
  amortisationType: string | null
  termMonths: number | null
  netInstalment: string | null
  residualValue: string | null
  contractStart: string | null
  deferredState: CaseContract["deferred_state"] | null
  financingAmountShare: string | null
  objectCount: number
  /**
   * True when the financing lists a contract the case's contract endpoint did not return — a
   * removed or filtered contract. The row still renders (the financing's own figure is real and
   * dropping it would understate the loan) but its terms are unknown.
   */
  termsMissing: boolean
}

/**
 * Joins the financing's per-contract references onto the case's contract records.
 *
 * The financing side drives the row set, deliberately: this tab answers "what is in this loan", so a
 * contract the case holds but the financing does not include is correctly absent, while a contract
 * the financing includes but the case list omits must still appear — silently dropping it would
 * make the rows fail to reconcile against the financing's own contract count.
 */
export function buildFinancingContractRows(
  financingContracts: readonly FinancingContractRef[],
  caseContracts: readonly CaseContract[]
): FinancingContractRow[] {
  const byId = new Map(caseContracts.map(contract => [contract.id, contract]))

  return financingContracts.map(ref => {
    const contract = byId.get(ref.contract_id)

    return {
      contractId: ref.contract_id,
      // The financing reference and the contract record can each carry the number; prefer the
      // contract's, since that is the record of origin.
      contractNumber:
        contract?.leasing_company_contract_number ??
        ref.leasing_company_contract_number ??
        contract?.short_name ??
        ref.short_name ??
        null,
      // `contract_type` exists on both sides and neither is enum-constrained; the contract record
      // wins for the same reason as the number.
      contractType: contract?.contract_type ?? ref.contract_type ?? null,
      amortisationType: contract?.amortisation_type ?? null,
      termMonths: contract?.term_months ?? null,
      netInstalment: contract?.net_instalment ?? null,
      residualValue: contract?.residual_value ?? null,
      contractStart: contract?.contract_start ?? null,
      deferredState: contract?.deferred_state ?? null,
      financingAmountShare: ref.financing_amount_share,
      objectCount: ref.objects.length,
      termsMissing: contract === undefined,
    }
  })
}
