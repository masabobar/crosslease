import { describe, expect, it } from "vitest"
import {
  AMORTISATION_TYPE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  EMPTY_CONTRACT_DETAILS_FORM,
  INSTALMENT_FREQUENCY_OPTIONS,
  contractDetailsFormSchema,
  toContractDetailsFormValues,
  toContractEditPayload,
} from "@/features/cases/contractDetailsForm"

describe("the option lists", () => {
  // These are the values ContractEdit actually accepts. The design's `Finance lease`,
  // `Operating lease`, `Linear` and `Degressive` are absent because they cannot be written
  // through this API at all — which is what settles Q-009.
  it("offers only the two contract types the write schema declares", () => {
    expect(CONTRACT_TYPE_OPTIONS).toEqual(["lease", "hire_purchase"])
  })

  it("offers only the two amortisation types the write schema declares", () => {
    expect(AMORTISATION_TYPE_OPTIONS).toEqual(["full", "partial"])
  })

  it("offers the five declared instalment frequencies", () => {
    expect(INSTALMENT_FREQUENCY_OPTIONS).toEqual([
      "monthly",
      "quarterly",
      "semi_annual",
      "annual",
      "custom",
    ])
  })
})

describe("contractDetailsFormSchema", () => {
  // ContractEdit requires nothing and R2 dropped field-level validation, so a partial contract
  // must save — it is filled over several sittings.
  it("accepts an entirely empty contract", () => {
    expect(
      contractDetailsFormSchema.parse(EMPTY_CONTRACT_DETAILS_FORM)
    ).toEqual(EMPTY_CONTRACT_DETAILS_FORM)
  })

  it("accepts a whole-month term", () => {
    expect(
      contractDetailsFormSchema.parse({
        ...EMPTY_CONTRACT_DETAILS_FORM,
        term_months: "48",
      }).term_months
    ).toBe("48")
  })

  it("rejects a non-integer term", () => {
    expect(() =>
      contractDetailsFormSchema.parse({
        ...EMPTY_CONTRACT_DETAILS_FORM,
        term_months: "48.5",
      })
    ).toThrow()
  })
})

describe("toContractEditPayload", () => {
  it("sends null for every blank field", () => {
    const p = toContractEditPayload(EMPTY_CONTRACT_DETAILS_FORM)
    expect(p.short_name).toBeNull()
    expect(p.contract_type).toBeNull()
    expect(p.term_months).toBeNull()
    expect(p.net_instalment).toBeNull()
    expect(p.contract_start).toBeNull()
  })

  // A cleared tick is a real answer ("no buy-back"), so booleans are always sent. Omitting one on
  // a PATCH would leave the previous value in place.
  it("always sends the booleans, including false", () => {
    const p = toContractEditPayload(EMPTY_CONTRACT_DETAILS_FORM)
    expect(p.mileage_lease).toBe(false)
    expect(p.buy_back_agreement).toBe(false)
    expect(p.put_option).toBe(false)
  })

  it("converts money to a number and accepts a comma separator", () => {
    const p = toContractEditPayload({
      ...EMPTY_CONTRACT_DETAILS_FORM,
      net_instalment: "1250.00",
      residual_value: "41200,50",
    })
    expect(p.net_instalment).toBe(1250)
    expect(p.residual_value).toBe(41200.5)
  })

  it("sends null rather than NaN for unparseable money", () => {
    expect(
      toContractEditPayload({
        ...EMPTY_CONTRACT_DETAILS_FORM,
        special_payment: "n/a",
      }).special_payment
    ).toBeNull()
  })

  it("converts the term to a number", () => {
    expect(
      toContractEditPayload({
        ...EMPTY_CONTRACT_DETAILS_FORM,
        term_months: "60",
      }).term_months
    ).toBe(60)
  })
})

describe("toContractDetailsFormValues", () => {
  it("round-trips a saved contract into the form", () => {
    const values = toContractDetailsFormValues({
      id: "00000000-0000-4000-8000-0000000000c1",
      leasing_company_contract_number: "PL-2025-00211",
      lessee_partner_id: null,
      short_name: "Volvo FH 460",
      contract_type: "lease",
      amortisation_type: "partial",
      term_months: 48,
      net_instalment: "1250.00",
      residual_value: null,
      contract_start: "2025-09-01",
      deferred_state: "active",
    })

    expect(values).toMatchObject({
      leasing_company_contract_number: "PL-2025-00211",
      short_name: "Volvo FH 460",
      contract_type: "lease",
      amortisation_type: "partial",
      term_months: "48",
      net_instalment: "1250.00",
      residual_value: "",
      contract_start: "2025-09-01",
    })
  })
})
