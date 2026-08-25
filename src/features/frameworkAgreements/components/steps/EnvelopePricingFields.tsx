import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { optionalNumber } from "@/lib/utils"
import { VFE_AMOUNT_MIN } from "@/features/frameworkAgreements/api/schema"

// Pricing on the agreement is now the early-repayment penalty alone, and it is an EUR
// amount: CR-FA-01 removed the effective rate from the agreement altogether, and CR-FA-02
// turned the penalty from a percentage into an absolute amount. The create and edit
// surfaces render the same fields, so this component needs no per-surface variant.
export type EnvelopePricingFormFields = {
  max_volume_eur: number
  vfe_amount_eur?: number
}

type Props<T extends EnvelopePricingFormFields> = {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  resolveMsg: (msg: string | undefined) => string | undefined
  idPrefix?: string
  testIdPrefix?: string
}

function EnvelopePricingFields<T extends EnvelopePricingFormFields>({
  register,
  errors,
  resolveMsg,
  idPrefix = "",
  testIdPrefix = "",
}: Props<T>) {
  const { t } = useTranslation("frameworkAgreements")
  const typedRegister =
    register as unknown as UseFormRegister<EnvelopePricingFormFields>
  const typedErrors =
    errors as unknown as FieldErrors<EnvelopePricingFormFields>

  return (
    <>
      <SectionCard title={t("wizard.envelopePricing.creditEnvelopeSection")}>
        <div>
          <Label
            htmlFor={`${idPrefix}max_volume_eur`}
            error={!!typedErrors.max_volume_eur}
            className="mb-2"
          >
            {t("fields.maxVolumeEur")}
          </Label>
          <Input
            id={`${idPrefix}max_volume_eur`}
            type="number"
            data-testid={`${testIdPrefix}max-volume-eur-input`}
            error={!!typedErrors.max_volume_eur}
            endAction={
              <span className="text-sm text-muted-foreground">
                {t("units.eur")}
              </span>
            }
            {...typedRegister("max_volume_eur", { valueAsNumber: true })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("wizard.envelopePricing.maxVolumeHint")}
          </p>
          {typedErrors.max_volume_eur && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(typedErrors.max_volume_eur.message)}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title={t("wizard.envelopePricing.earlyRepaymentSection")}>
        <div>
          <Label
            htmlFor={`${idPrefix}vfe_amount_eur`}
            error={!!typedErrors.vfe_amount_eur}
            className="mb-2 block leading-snug"
          >
            {t("fields.vfeAmountEur")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("fields.optional")}
            </span>
          </Label>
          <Input
            id={`${idPrefix}vfe_amount_eur`}
            type="number"
            min={VFE_AMOUNT_MIN}
            // Without this the input's implicit step of 1 rejects amounts with cents.
            step="any"
            data-testid={`${testIdPrefix}vfe-amount-eur-input`}
            error={!!typedErrors.vfe_amount_eur}
            endAction={
              <span className="text-sm text-muted-foreground">
                {t("units.eur")}
              </span>
            }
            {...typedRegister("vfe_amount_eur", {
              setValueAs: optionalNumber,
            })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("wizard.envelopePricing.vfeAmountHint")}
          </p>
          {typedErrors.vfe_amount_eur && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(typedErrors.vfe_amount_eur.message)}
            </p>
          )}
        </div>
      </SectionCard>
    </>
  )
}

export { EnvelopePricingFields }
