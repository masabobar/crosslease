import { describe, expect, it } from "vitest"
import { buildFinancingContractRows } from "@/features/financing/buildContractRows"
import type { FinancingContractRef } from "@/features/financing/api/schema"
import type { CaseContract } from "@/features/cases/api/schema"

const CONTRACT_ID = "00000000-0000-4000-8000-0000000000c1"
const OTHER_CONTRACT_ID = "00000000-0000-4000-8000-0000000000c2"

function financingRef(
  overrides: Partial<FinancingContractRef> = {}
): FinancingContractRef {
  return {
    contract_id: CONTRACT_ID,
    short_name: null,
    leasing_company_contract_number: null,
    contract_type: null,
    status: "financed",
    financing_amount_share: "96400.00",
    objects: [],
    ...overrides,
  }
}

function caseContract(overrides: Partial<CaseContract> = {}): CaseContract {
  return {
    id: CONTRACT_ID,
    leasing_company_contract_number: "LC-0001",
    short_name: null,
    contract_type: "lease",
    amortisation_type: "full",
    term_months: 48,
    net_instalment: "1250.00",
    residual_value: "372868.00",
    contract_start: "2026-08-01",
    deferred_state: "active",
    ...overrides,
  }
}

describe("buildFinancingContractRows", () => {
  it("joins a financing reference onto its contract terms", () => {
    const [row] = buildFinancingContractRows([financingRef()], [caseContract()])

    expect(row).toMatchObject({
      contractId: CONTRACT_ID,
      contractNumber: "LC-0001",
      contractType: "lease",
      amortisationType: "full",
      termMonths: 48,
      netInstalment: "1250.00",
      residualValue: "372868.00",
      contractStart: "2026-08-01",
      deferredState: "active",
      financingAmountShare: "96400.00",
      termsMissing: false,
    })
  })

  // The financing side drives the row set: dropping a contract the financing includes would make
  // the table fail to reconcile against the financing's own contract count and loan total.
  it("keeps a financing contract the case list does not return, flagged", () => {
    const rows = buildFinancingContractRows([financingRef()], [])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      contractId: CONTRACT_ID,
      termsMissing: true,
      termMonths: null,
      deferredState: null,
      // The financing's own figure is still real and must survive the missing join.
      financingAmountShare: "96400.00",
    })
  })

  it("omits a case contract the financing does not include", () => {
    const rows = buildFinancingContractRows(
      [financingRef()],
      [caseContract(), caseContract({ id: OTHER_CONTRACT_ID })]
    )

    expect(rows).toHaveLength(1)
    expect(rows[0].contractId).toBe(CONTRACT_ID)
  })

  it("prefers the contract record's number over the financing reference's", () => {
    const [row] = buildFinancingContractRows(
      [financingRef({ leasing_company_contract_number: "STALE-9999" })],
      [caseContract({ leasing_company_contract_number: "LC-0001" })]
    )

    expect(row.contractNumber).toBe("LC-0001")
  })

  it("falls back through the reference and then short_name for the number", () => {
    const [fromRef] = buildFinancingContractRows(
      [financingRef({ leasing_company_contract_number: "REF-0007" })],
      [caseContract({ leasing_company_contract_number: null })]
    )
    expect(fromRef.contractNumber).toBe("REF-0007")

    const [fromShortName] = buildFinancingContractRows(
      [financingRef()],
      [
        caseContract({
          leasing_company_contract_number: null,
          short_name: "Volvo FH 460",
        }),
      ]
    )
    expect(fromShortName.contractNumber).toBe("Volvo FH 460")
  })

  it("reports null rather than a number when no identifier exists at all", () => {
    const [row] = buildFinancingContractRows(
      [financingRef()],
      [
        caseContract({
          leasing_company_contract_number: null,
          short_name: null,
        }),
      ]
    )

    expect(row.contractNumber).toBeNull()
  })

  it("counts the objects the financing reference carries", () => {
    const [row] = buildFinancingContractRows(
      [
        financingRef({
          objects: [
            {
              object_id: "00000000-0000-4000-8000-0000000000o1",
              object_number: 1,
              object_group: "vehicles",
              object_sub_group: null,
            },
            {
              object_id: "00000000-0000-4000-8000-0000000000o2",
              object_number: 2,
              object_group: null,
              object_sub_group: null,
            },
          ],
        }),
      ],
      [caseContract()]
    )

    expect(row.objectCount).toBe(2)
  })

  it("returns no rows when the financing includes no contracts", () => {
    expect(buildFinancingContractRows([], [caseContract()])).toEqual([])
  })
})
