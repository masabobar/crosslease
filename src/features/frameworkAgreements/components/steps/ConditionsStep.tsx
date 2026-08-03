import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Shared by the create wizard and the edit wizard — same field, same copy, only the
// element ids differ. Generic over the form type like EnvelopePricingFields.
export type ConditionsFormFields = {
  special_conditions?: string
}

type Props<T extends ConditionsFormFields> = {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  idPrefix?: string
  testIdPrefix?: string
}

function ConditionsStep<T extends ConditionsFormFields>({
  register,
  errors,
  idPrefix = "",
  testIdPrefix = "",
}: Props<T>) {
  const { t } = useTranslation("frameworkAgreements")
  const typedRegister =
    register as unknown as UseFormRegister<ConditionsFormFields>
  const typedErrors = errors as unknown as FieldErrors<ConditionsFormFields>

  return (
    <div
      className="border border-border rounded-xl bg-background p-4"
      data-testid={`${testIdPrefix}conditions-step`}
    >
      <Label htmlFor={`${idPrefix}special_conditions`} className="mb-2">
        {t("fields.specialConditions")}{" "}
        <span className="font-normal text-muted-foreground">
          {t("fields.optional")}
        </span>
      </Label>
      {/* Vertically resizable, not fixed: users treat this as a running log and append
          dated entries over time (CR PRD1042-1799 CR-FA-06), so the field has to be able
          to grow past five rows. Horizontal resize stays off — it would break the layout. */}
      <Textarea
        id={`${idPrefix}special_conditions`}
        data-testid={`${testIdPrefix}special-conditions-textarea`}
        className="min-h-[120px] resize-y"
        rows={5}
        {...typedRegister("special_conditions")}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {t("wizard.conditions.hint")}
      </p>
      {typedErrors.special_conditions && (
        <p className="mt-1 text-sm text-destructive">
          {typedErrors.special_conditions.message}
        </p>
      )}
    </div>
  )
}

export { ConditionsStep }
