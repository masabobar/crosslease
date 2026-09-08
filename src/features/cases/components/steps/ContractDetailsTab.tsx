import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { showApiError } from "@/lib/apiErrorMessage"
import { resolveFormMessage } from "@/lib/formMessages"
import { useUpdateContract } from "@/features/cases/hooks/useUpdateContract"
import {
  AMORTISATION_TYPE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  EMPTY_CONTRACT_DETAILS_FORM,
  INSTALMENT_FREQUENCY_OPTIONS,
  contractDetailsFormSchema,
  toContractEditPayload,
} from "@/features/cases/contractDetailsForm"
import type { ContractDetailsFormValues } from "@/features/cases/contractDetailsForm"

type Props = {
  caseId: string
  contractId: string | null
  onNeedContract: () => Promise<string | null>
}

/**
 * Manual contract entry → **Contract details** tab (US 1.9).
 *
 * ── THE PICKERS OFFER ONLY WHAT CAN BE WRITTEN ─────────────────────────────────────────────────
 * `ContractEdit` types `contract_type`, `amortisation_type` and `instalment_frequency` as real
 * enums, even though `ContractRead` hands the first two back as bare strings. So the write side is
 * the authority here, and it settles the design conflict recorded as Q-009: the frame's
 * `Finance lease` / `Operating lease` / `Linear` / `Degressive` are unreachable — a contract simply
 * cannot be created or edited with them.
 *
 * ── A PARTIAL SAVE IS LEGITIMATE ───────────────────────────────────────────────────────────────
 * No field is required by the contract, and R2 removed field-level business validation from the
 * wizard. The form validates shape (a term is an integer, money parses) and lets an incomplete
 * contract be saved, because that is how one is filled in practice. What blocks *submission* is a
 * separate question — Q-006, still open.
 */
export function ContractDetailsTab({
  caseId,
  contractId,
  onNeedContract,
}: Props) {
  const { t } = useTranslation("cases")
  const update = useUpdateContract(caseId)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ContractDetailsFormValues>({
    resolver: zodResolver(contractDetailsFormSchema),
    defaultValues: EMPTY_CONTRACT_DETAILS_FORM,
  })

  const contractType = useWatch({ control, name: "contract_type" })
  const amortisation = useWatch({ control, name: "amortisation_type" })
  const frequency = useWatch({ control, name: "instalment_frequency" })
  const contractStart = useWatch({ control, name: "contract_start" })
  const mileageLease = useWatch({ control, name: "mileage_lease" })
  const buyBack = useWatch({ control, name: "buy_back_agreement" })
  const putOption = useWatch({ control, name: "put_option" })

  async function onSubmit(values: ContractDetailsFormValues) {
    const id = contractId ?? (await onNeedContract())
    if (id === null) return
    update.mutate(
      { contractId: id, body: toContractEditPayload(values) },
      {
        onSuccess: () => toast.success(t("wizard.manual.details.saved")),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="contract-details-tab"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.details.fields.contractNumber")}>
          <Input
            data-testid="contract-number-input"
            {...register("leasing_company_contract_number")}
          />
        </Field>
        <Field label={t("wizard.manual.details.fields.shortName")}>
          <Input
            data-testid="contract-short-name-input"
            {...register("short_name")}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.details.fields.contractType")}>
          <SelectField
            data-testid="contract-type-select"
            value={contractType}
            onValueChange={v => setValue("contract_type", v)}
            placeholder={t("wizard.manual.details.fields.select")}
            options={CONTRACT_TYPE_OPTIONS.map(value => ({
              value,
              label: t(
                `wizard.manual.details.contractType.${value}` as "wizard.manual.details.contractType.lease"
              ),
            }))}
          />
        </Field>
        <Field label={t("wizard.manual.details.fields.amortisationType")}>
          <SelectField
            data-testid="contract-amortisation-select"
            value={amortisation}
            onValueChange={v => setValue("amortisation_type", v)}
            placeholder={t("wizard.manual.details.fields.select")}
            options={AMORTISATION_TYPE_OPTIONS.map(value => ({
              value,
              label: t(
                `wizard.manual.details.amortisationType.${value}` as "wizard.manual.details.amortisationType.full"
              ),
            }))}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.details.fields.frequency")}>
          <SelectField
            data-testid="contract-frequency-select"
            value={frequency}
            onValueChange={v => setValue("instalment_frequency", v)}
            placeholder={t("wizard.manual.details.fields.select")}
            options={INSTALMENT_FREQUENCY_OPTIONS.map(value => ({
              value,
              label: t(
                `wizard.manual.details.frequency.${value}` as "wizard.manual.details.frequency.monthly"
              ),
            }))}
          />
        </Field>
        <Field
          label={t("wizard.manual.details.fields.termMonths")}
          error={resolveFormMessage(
            errors.term_months?.message,
            t,
            "wizard.manual.details.errors"
          )}
        >
          <Input
            inputMode="numeric"
            data-testid="contract-term-input"
            {...register("term_months")}
          />
        </Field>
      </div>

      <Field label={t("wizard.manual.details.fields.contractStart")}>
        {/* No minDate: this is an EXISTING lease being brought into a refinancing request, so its
            start is in the past by definition — flooring it at today would refuse every real
            contract (date-inputs.md §4, the historical case). */}
        <DatePicker
          data-testid="contract-start-date"
          value={contractStart === "" ? undefined : contractStart}
          onChange={v => setValue("contract_start", v ?? "")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("wizard.manual.details.fields.netInstalment")}>
          <Input
            inputMode="decimal"
            data-testid="contract-instalment-input"
            {...register("net_instalment")}
          />
        </Field>
        <Field label={t("wizard.manual.details.fields.residualValue")}>
          <Input
            inputMode="decimal"
            data-testid="contract-residual-input"
            {...register("residual_value")}
          />
        </Field>
        <Field label={t("wizard.manual.details.fields.specialPayment")}>
          <Input
            inputMode="decimal"
            data-testid="contract-special-payment-input"
            {...register("special_payment")}
          />
        </Field>
        <Field label={t("wizard.manual.details.fields.nonRefinanceable")}>
          <Input
            inputMode="decimal"
            data-testid="contract-non-refinanceable-input"
            {...register("non_refinanceable_part")}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <Tick
          testId="contract-mileage-lease"
          checked={mileageLease}
          onChange={v => setValue("mileage_lease", v)}
          label={t("wizard.manual.details.fields.mileageLease")}
        />
        <Tick
          testId="contract-buy-back"
          checked={buyBack}
          onChange={v => setValue("buy_back_agreement", v)}
          label={t("wizard.manual.details.fields.buyBack")}
        />
        <Tick
          testId="contract-put-option"
          checked={putOption}
          onChange={v => setValue("put_option", v)}
          label={t("wizard.manual.details.fields.putOption")}
        />
      </div>

      <Button
        type="submit"
        className="self-end"
        data-testid="contract-details-save"
        disabled={update.isPending}
      >
        {t("wizard.manual.details.save")}
      </Button>
    </form>
  )
}

function Tick({
  testId,
  checked,
  onChange,
  label,
}: {
  testId: string
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        data-testid={testId}
        checked={checked}
        onCheckedChange={value => onChange(value === true)}
      />
      {label}
    </label>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label error={error !== undefined} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error !== undefined && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
