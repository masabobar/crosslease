import type { UseFormReturn } from "react-hook-form"
import { useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
}

function ConditionsStep({ form }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { register, control } = form
  const { errors } = useFormState({ control })

  return (
    <div
      className="border border-border rounded-xl bg-background p-4"
      data-testid="fa-conditions-step"
    >
      <Label htmlFor="special_conditions" className="mb-2">
        {t("fields.specialConditions")}{" "}
        <span className="font-normal text-muted-foreground">
          {t("fields.optional")}
        </span>
      </Label>
      <Textarea
        id="special_conditions"
        data-testid="special-conditions-textarea"
        className="min-h-[120px] resize-none"
        rows={5}
        {...register("special_conditions")}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {t("wizard.conditions.hint")}
      </p>
      {errors.special_conditions && (
        <p className="mt-1 text-sm text-destructive">
          {errors.special_conditions.message}
        </p>
      )}
    </div>
  )
}

export { ConditionsStep }
