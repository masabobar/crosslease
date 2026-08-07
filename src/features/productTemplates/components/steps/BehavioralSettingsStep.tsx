import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import type { SelectOption } from "@/components/ui/select"
import { SectionCard } from "@/components/shared/SectionCard"
import { resolveFieldErrorMessage } from "@/features/productTemplates/utils"
import {
  CalculationModelSchema,
  DisbursementDerivationRuleSchema,
  FinancingTypeSchema,
  FirstInstallmentRuleSchema,
  LegalStructureSchema,
  PaymentTimingSchema,
  RateBasisSchema,
} from "@/features/productTemplates/api/schema"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
}

function BehavioralSettingsStep({ form }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { control } = form

  // Every field on this step carries only the "required" message code, so no per-code map is
  // needed — same two-argument call as IdentityStep. Add a third argument here if one of these
  // Zod fields ever gains a custom code, or it will render as the raw code string.
  function resolveMsg(msg: string | undefined) {
    return resolveFieldErrorMessage(msg, tCommon("validation.required"))
  }

  // Building option lists generically across several enums means the translation key is
  // composed at runtime, not known as a literal — cast to TFunction's key type at this one
  // boundary (the enum values themselves are validated against the Zod schema elsewhere).
  function optionsFor(
    values: readonly string[],
    group: string
  ): SelectOption[] {
    return values.map(value => ({
      value,
      label: t(`${group}.${value}` as "fields.optional"),
    }))
  }

  const financingTypeOptions = optionsFor(
    FinancingTypeSchema.options,
    "financingTypes"
  )
  const legalStructureOptions = optionsFor(
    LegalStructureSchema.options,
    "legalStructures"
  )
  const paymentTimingOptions = optionsFor(
    PaymentTimingSchema.options,
    "paymentTimings"
  )
  const rateBasisOptions = optionsFor(RateBasisSchema.options, "rateBases")
  const calculationModelOptions = optionsFor(
    CalculationModelSchema.options,
    "calculationModels"
  )
  const firstInstallmentRuleOptions = optionsFor(
    FirstInstallmentRuleSchema.options,
    "firstInstallmentRules"
  )
  const disbursementDerivationRuleOptions = optionsFor(
    DisbursementDerivationRuleSchema.options,
    "disbursementDerivationRules"
  )

  function renderSelectField(
    name:
      | "financing_type"
      | "legal_structure"
      | "payment_timing"
      | "rate_basis"
      | "calculation_model"
      | "first_installment_rule"
      | "disbursement_derivation_rule",
    labelKey: string,
    options: SelectOption[]
  ) {
    // Label and message live inside Controller's render prop and read from its
    // `fieldState` rather than a shared `errors` object: indexing `errors[name]` by a
    // computed key makes React Compiler depend on the whole errors object, which
    // react-hook-form mutates in place — so the memoized markup was never invalidated
    // and these fields silently showed no validation feedback at all.
    return (
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <div>
            <Label htmlFor={name} error={!!fieldState.error} className="mb-2">
              {t(labelKey as "fields.optional")}
            </Label>
            <SelectField
              id={name}
              data-testid={`${name.replace(/_/g, "-")}-select`}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              options={options}
              placeholder={t("fields.selectPlaceholder")}
              error={!!fieldState.error}
            />
            {fieldState.error && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(fieldState.error.message)}
              </p>
            )}
          </div>
        )}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="behavioral-settings-step">
      <SectionCard title={t("sections.settings")}>
        <div className="grid grid-cols-2 gap-4">
          {renderSelectField(
            "financing_type",
            "fields.financingType",
            financingTypeOptions
          )}
          {renderSelectField(
            "legal_structure",
            "fields.legalStructure",
            legalStructureOptions
          )}
          {renderSelectField(
            "payment_timing",
            "fields.paymentTiming",
            paymentTimingOptions
          )}
          {renderSelectField(
            "rate_basis",
            "fields.rateBasis",
            rateBasisOptions
          )}
          {renderSelectField(
            "calculation_model",
            "fields.calculationModel",
            calculationModelOptions
          )}
          {renderSelectField(
            "first_installment_rule",
            "fields.firstInstallmentRule",
            firstInstallmentRuleOptions
          )}
          {renderSelectField(
            "disbursement_derivation_rule",
            "fields.disbursementDerivationRule",
            disbursementDerivationRuleOptions
          )}
        </div>
      </SectionCard>
    </div>
  )
}

export { BehavioralSettingsStep }
