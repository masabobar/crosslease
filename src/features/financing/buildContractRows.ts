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
  /**
   * How many objects the financing counts on this contract, or `null` when no financing includes
   * it yet — the count lives on the financing's reference, not on the contract record.
   */
  objectCount: number | null
  /**
   * True when the financing lists a contract the case's contract endpoint did not return — a
   * removed or filtered contract. The row still renders (the financing's own figure is real and
   * dropping it would understate the loan) but its terms are unknown, and it cannot be edited or
   * removed from here because the case does not hold it.
   */
  termsMissing: boolean
  /** Whether a financing already carries this contract. */
  inFinancing: boolean
}

/**
 * Joins the financing's per-contract references onto the case's contract records.
 *
 * ── THE CASE SIDE DRIVES THE ROWS ──────────────────────────────────────────────────────────────
 * This used to be the other way round — the financing's `contracts[]` drove the set, on the reading
 * that the tab answers "what is in this loan". That reading was wrong for where the tab actually
 * sits. The click dummy's Contracts tab is the **case's contract set**: it is where a contract is
 * entered, edited and removed, and it is populated long before a financing exists. Driven from the
 * financing, the tab rendered *nothing at all* for every case that had not been approved yet —
 * which is every case in the create flow.
 *
 * So the case's contracts drive the rows, and the financing's share is joined on where there is
 * one. A contract the financing lists but the case endpoint did not return is still **appended**
 * rather than dropped, for the original reason: the financing's own figure is real, and losing it
 * would make the rows fail to reconcile against the financing's contract count.
 */
export function buildFinancingContractRows(
  financingContracts: readonly FinancingContractRef[],
  caseContracts: readonly CaseContract[]
): FinancingContractRow[] {
  const refById = new Map(financingContracts.map(ref => [ref.contract_id, ref]))

  const rows: FinancingContractRow[] = caseContracts.map(contract => {
    const ref = refById.get(contract.id)

    return {
      contractId: contract.id,
      // The financing reference and the contract record can each carry the number; prefer the
      // contract's, since that is the record of origin.
      contractNumber:
        contract.leasing_company_contract_number ??
        ref?.leasing_company_contract_number ??
        contract.short_name ??
        ref?.short_name ??
        null,
      // `contract_type` exists on both sides and neither is enum-constrained; the contract record
      // wins for the same reason as the number.
      contractType: contract.contract_type ?? ref?.contract_type ?? null,
      amortisationType: contract.amortisation_type ?? null,
      termMonths: contract.term_months ?? null,
      netInstalment: contract.net_instalment ?? null,
      residualValue: contract.residual_value ?? null,
      contractStart: contract.contract_start ?? null,
      deferredState: contract.deferred_state ?? null,
      // `null` where no financing includes this contract yet — the share is not zero, it is
      // not yet decided, and the column renders the difference.
      financingAmountShare: ref?.financing_amount_share ?? null,
      objectCount: ref?.objects.length ?? null,
      termsMissing: false,
      inFinancing: ref !== undefined,
    }
  })

  const caseIds = new Set(caseContracts.map(contract => contract.id))
  for (const ref of financingContracts) {
    if (caseIds.has(ref.contract_id)) continue
    rows.push({
      contractId: ref.contract_id,
      contractNumber:
        ref.leasing_company_contract_number ?? ref.short_name ?? null,
      contractType: ref.contract_type ?? null,
      amortisationType: null,
      termMonths: null,
      netInstalment: null,
      residualValue: null,
      contractStart: null,
      deferredState: null,
      financingAmountShare: ref.financing_amount_share,
      objectCount: ref.objects.length,
      termsMissing: true,
      inFinancing: true,
    })
  }

  return rows
}
