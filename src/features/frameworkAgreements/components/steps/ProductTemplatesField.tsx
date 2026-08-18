import type { Control, FieldErrors } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ProductTemplateMultiSelect } from "@/features/frameworkAgreements/components/ProductTemplateMultiSelect"

export type ProductTemplatesFormFields = {
  product_template_ids: string[]
}

type Props<T extends ProductTemplatesFormFields> = {
  control: Control<T>
  errors: FieldErrors<T>
  resolveMsg: (msg: string | undefined) => string | undefined
  hint?: string
  // Create-wizard-only eligibility filter — see ProductTemplateMultiSelect.
  agreementValidFrom?: string
}

function ProductTemplatesField<T extends ProductTemplatesFormFields>({
  control,
  errors,
  resolveMsg,
  hint,
  agreementValidFrom,
}: Props<T>) {
  const { t } = useTranslation("frameworkAgreements")
  const typedControl = control as unknown as Control<ProductTemplatesFormFields>
  const typedErrors =
    errors as unknown as FieldErrors<ProductTemplatesFormFields>

  return (
    <SectionCard
      title={t("wizard.validityTemplates.templatesSection")}
      subtitle={t("wizard.validityTemplates.templatesHint")}
    >
      <Controller
        control={typedControl}
        name="product_template_ids"
        render={({ field }) => (
          <ProductTemplateMultiSelect
            value={field.value ?? []}
            onChange={field.onChange}
            error={!!typedErrors.product_template_ids}
            agreementValidFrom={agreementValidFrom}
          />
        )}
      />
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {typedErrors.product_template_ids && (
        <p className="mt-1 text-sm text-destructive">
          {resolveMsg(typedErrors.product_template_ids.message)}
        </p>
      )}
    </SectionCard>
  )
}

export { ProductTemplatesField }
