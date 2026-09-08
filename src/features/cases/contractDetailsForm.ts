import { z } from "zod"
import type { CaseContract } from "@/features/cases/api/schema"

/**
 * The manual-entry modal's **Contract details** form (US 1.9).
 *
 * ── THE WRITE SIDE IS TYPED WHERE THE READ SIDE IS NOT ─────────────────────────────────────────
 * `ContractEdit` `$ref`s three real enums — `ContractType` (`lease | hire_purchase`),
 * `AmortisationType` (`full | partial`) and `InstalmentFrequency` — while `ContractRead` returns the
 * first two as bare strings. That asymmetry is what settles Q-009: the design's `Finance lease`,
 * `Operating lease`, `Linear` and `Degressive` cannot be *written* through this API, so they cannot
 * legitimately exist. The pickers below offer only the declared values.
 *
 * ── SHAPE VALIDATION ONLY ──────────────────────────────────────────────────────────────────────
 * `ContractEdit` requires no field and R2 dropped field-level business validation from the wizard
 * (Q-006 remains open on whether that also removes submission gate 4). So this validates that a
 * term is an integer and money is a number, and not that a contract is complete — a contract is
 * filled over several sittings and refusing to save a partial one would fight both the contract and
 * the spec.
 */

export const CONTRACT_TYPE_OPTIONS = ["lease", "hire_purchase"] as const
export const AMORTISATION_TYPE_OPTIONS = ["full", "partial"] as const
export const INSTALMENT_FREQUENCY_OPTIONS = [
  "monthly",
  "quarterly",
  "semi_annual",
  "annual",
  "custom",
] as const

export const contractDetailsFormSchema = z.object({
  short_name: z.string(),
  leasing_company_contract_number: z.string(),
  contract_type: z.string(),
  amortisation_type: z.string(),
  instalment_frequency: z.string(),
  term_months: z
    .string()
    .refine(v => v === "" || /^[0-9]{1,3}$/.test(v), { message: "termFormat" }),
  contract_start: z.string(),
  net_instalment: z.string(),
  residual_value: z.string(),
  special_payment: z.string(),
  non_refinanceable_part: z.string(),
  // The remaining three writable fields of ContractCreate/ContractEdit. They were absent from the
  // form, so a contract could not carry them at all — not a design omission, just a gap.
  contract_residual: z.string(),
  target_closing_balance: z.string(),
  // Set only when the first instalment does not fall one full period after the value date; the
  // engine charges that first period pro rata on the 30/360 count.
  deviating_first_due_date: z.string(),
  mileage_lease: z.boolean(),
  buy_back_agreement: z.boolean(),
  put_option: z.boolean(),
})

export type ContractDetailsFormValues = z.infer<
  typeof contractDetailsFormSchema
>

export const EMPTY_CONTRACT_DETAILS_FORM: ContractDetailsFormValues = {
  short_name: "",
  leasing_company_contract_number: "",
  contract_type: "",
  amortisation_type: "",
  instalment_frequency: "",
  term_months: "",
  contract_start: "",
  net_instalment: "",
  residual_value: "",
  special_payment: "",
  non_refinanceable_part: "",
  contract_residual: "",
  target_closing_balance: "",
  deviating_first_due_date: "",
  mileage_lease: false,
  buy_back_agreement: false,
  put_option: false,
}

function textOrNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim()
}

/**
 * Money becomes a number, or null when blank.
 *
 * A comma decimal is accepted because that is what a German keyboard produces; sending a
 * locale-formatted string would leave the separator to the backend to guess.
 */
function moneyOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

/** Form values → a `ContractEdit` body. Blank means null, never `""`. */
export function toContractEditPayload(
  values: ContractDetailsFormValues
): Record<string, unknown> {
  return {
    short_name: textOrNull(values.short_name),
    leasing_company_contract_number: textOrNull(
      values.leasing_company_contract_number
    ),
    contract_type: textOrNull(values.contract_type),
    amortisation_type: textOrNull(values.amortisation_type),
    instalment_frequency: textOrNull(values.instalment_frequency),
    term_months:
      values.term_months.trim() === "" ? null : Number(values.term_months),
    contract_start: textOrNull(values.contract_start),
    net_instalment: moneyOrNull(values.net_instalment),
    residual_value: moneyOrNull(values.residual_value),
    special_payment: moneyOrNull(values.special_payment),
    non_refinanceable_part: moneyOrNull(values.non_refinanceable_part),
    contract_residual: moneyOrNull(values.contract_residual),
    target_closing_balance: moneyOrNull(values.target_closing_balance),
    deviating_first_due_date: textOrNull(values.deviating_first_due_date),
    // Booleans are always sent: a cleared tick is a real answer ("no buy-back"), and omitting it
    // on a PATCH would leave the previous value in place.
    mileage_lease: values.mileage_lease,
    buy_back_agreement: values.buy_back_agreement,
    put_option: values.put_option,
  }
}

/** An existing contract → form values, for the edit path. */
export function toContractDetailsFormValues(
  contract: CaseContract
): ContractDetailsFormValues {
  return {
    ...EMPTY_CONTRACT_DETAILS_FORM,
    short_name: contract.short_name ?? "",
    leasing_company_contract_number:
      contract.leasing_company_contract_number ?? "",
    contract_type: contract.contract_type ?? "",
    amortisation_type: contract.amortisation_type ?? "",
    term_months:
      contract.term_months === null ? "" : String(contract.term_months),
    contract_start: contract.contract_start ?? "",
    net_instalment: contract.net_instalment ?? "",
    residual_value: contract.residual_value ?? "",
    contract_residual: contract.contract_residual ?? "",
    target_closing_balance: contract.target_closing_balance ?? "",
    deviating_first_due_date: contract.deviating_first_due_date ?? "",
  }
}
