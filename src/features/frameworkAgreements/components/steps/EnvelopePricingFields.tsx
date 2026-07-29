import type { FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import {
  EFFECTIVE_RATE_MAX,
  EFFECTIVE_RATE_MIN,
  VFE_RATE_MAX,
  VFE_RATE_MIN,
} from "@/features/frameworkAgreements/api/schema"

// Pricing is one hand-entered interest rate plus the VFE early-repayment penalty
// (CR PRD1042-1552 A1-A3). Base rate, spread, rate type and rate-lock period are no
// longer part of the create or edit contract, so the create and edit surfaces render
// the same fields and this component needs no per-surface variant.
export type EnvelopePricingFormFields = {
  max_volume_eur: number
  effective_rate: number
  vfe_rate?: number
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

      <SectionCard title={t("wizard.envelopePricing.pricingSection")}>
        {/* Subgrid: the VFE label wraps to two lines at this column width, and without a
            shared label row that pushes its input below the Effective rate input. */}
        <div className="grid grid-cols-2 grid-rows-[auto_auto] gap-x-4">
          <div className="row-span-2 grid grid-rows-subgrid">
            <Label
              htmlFor={`${idPrefix}effective_rate`}
              error={!!typedErrors.effective_rate}
              className="mb-2 block leading-snug"
            >
              {t("fields.effectiveRate")}
            </Label>
            <div>
              <Input
                id={`${idPrefix}effective_rate`}
                type="number"
                min={EFFECTIVE_RATE_MIN}
                max={EFFECTIVE_RATE_MAX}
                // Without this the input's implicit step of 1 rejects fractional rates,
                // which the BE stores as Numeric(8, 4).
                step="any"
                data-testid={`${testIdPrefix}effective-rate-input`}
                error={!!typedErrors.effective_rate}
                endAction={
                  <span className="text-sm text-muted-foreground">
                    {t("units.percent")}
                  </span>
                }
                {...typedRegister("effective_rate", { valueAsNumber: true })}
              />
              {typedErrors.effective_rate && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMsg(typedErrors.effective_rate.message)}
                </p>
              )}
            </div>
          </div>

          <div className="row-span-2 grid grid-rows-subgrid">
            <Label
              htmlFor={`${idPrefix}vfe_rate`}
              error={!!typedErrors.vfe_rate}
              className="mb-2 block leading-snug"
            >
              {t("fields.vfeRate")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <div>
              <Input
                id={`${idPrefix}vfe_rate`}
                type="number"
                min={VFE_RATE_MIN}
                max={VFE_RATE_MAX}
                step="any"
                data-testid={`${testIdPrefix}vfe-rate-input`}
                error={!!typedErrors.vfe_rate}
                endAction={
                  <span className="text-sm text-muted-foreground">
                    {t("units.percent")}
                  </span>
                }
                {...typedRegister("vfe_rate", {
                  setValueAs: v => (v === "" ? undefined : Number(v)),
                })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t("wizard.envelopePricing.vfeRateHint")}
              </p>
              {typedErrors.vfe_rate && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMsg(typedErrors.vfe_rate.message)}
                </p>
              )}
            </div>
          </div>
        </div>
      </SectionCard>
    </>
  )
}

export { EnvelopePricingFields }
