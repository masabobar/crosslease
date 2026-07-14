import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import type { SelectOption } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SectionCard } from "@/features/productTemplates/components/SectionCard"
import {
  CalculationModelSchema,
  DisbursementDerivationRuleSchema,
  FinancingTypeSchema,
  FirstInstallmentRuleSchema,
  LegalStructureSchema,
  PaymentTimingSchema,
  RateBasisSchema,
  RateTypeSchema,
} from "@/features/productTemplates/api/schema"
import type { ProductTemplateWizardForm } from "@/features/productTemplates/api/schema"

// Static options — no NPV formula registry endpoint exists yet for the FE to query
// (mirrors the orchestration catalogs' StubCatalogAdapter, which always returns ACTIVE
// on the BE side). Flagged as a follow-up gap in the FE story.
const NPV_FORMULA_OPTIONS = [
  {
    ref: "NPV-FORMULA-STD-v3",
    code: "NPV-FORMULA-STD",
    version: "v3",
    labelKey: "npvFormulas.standardAnnuity",
  },
  {
    ref: "NPV-FORMULA-BULLET-v2",
    code: "NPV-FORMULA-BULLET",
    version: "v2",
    labelKey: "npvFormulas.bullet",
  },
  {
    ref: "NPV-FORMULA-RV-v1",
    code: "NPV-FORMULA-RV",
    version: "v1",
    labelKey: "npvFormulas.residualValue",
  },
] as const

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
}

function BehavioralSettingsStep({ form }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { control } = form
  const { errors } = useFormState({ control })

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    return msg
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
  const rateTypeOptions = optionsFor(RateTypeSchema.options, "rateTypes")
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
      | "rate_type"
      | "first_installment_rule"
      | "disbursement_derivation_rule",
    labelKey: string,
    options: SelectOption[]
  ) {
    return (
      <div>
        <Label htmlFor={name} error={!!errors[name]} className="mb-2">
          {t(labelKey as "fields.optional")}
        </Label>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <SelectField
              id={name}
              data-testid={`${name.replace(/_/g, "-")}-select`}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              options={options}
              placeholder={t("fields.selectPlaceholder")}
              error={!!errors[name]}
            />
          )}
        />
        {errors[name] && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors[name]?.message as string | undefined)}
          </p>
        )}
      </div>
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
          {renderSelectField("rate_type", "fields.rateType", rateTypeOptions)}
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

      <SectionCard
        title={t("sections.npvFormulaReference")}
        subtitle={t("fields.npvFormulaReferenceHint")}
      >
        <Controller
          control={control}
          name="npv_formula_ref"
          render={({ field }) => (
            <RadioGroup
              data-testid="npv-formula-radio-group"
              value={field.value}
              onValueChange={field.onChange}
              className="gap-3"
            >
              {NPV_FORMULA_OPTIONS.map(option => (
                <label
                  key={option.ref}
                  htmlFor={`npv-${option.ref}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
                >
                  <RadioGroupItem id={`npv-${option.ref}`} value={option.ref} />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {t(option.labelKey)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.code} · {option.version}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {errors.npv_formula_ref && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.npv_formula_ref.message)}
          </p>
        )}
      </SectionCard>
    </div>
  )
}

export { BehavioralSettingsStep }
