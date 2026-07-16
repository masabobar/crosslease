import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { RateTypeSchema } from "@/features/frameworkAgreements/api/schema"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
}

function EnvelopePricingStep({ form }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { register, control } = form
  const { errors } = useFormState({ control })

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    return msg
  }

  return (
    <div className="flex flex-col gap-4" data-testid="fa-envelope-pricing-step">
      <SectionCard title={t("wizard.envelopePricing.creditEnvelopeSection")}>
        <div>
          <Label
            htmlFor="max_volume_eur"
            error={!!errors.max_volume_eur}
            className="mb-2"
          >
            {t("fields.maxVolumeEur")}
          </Label>
          <Input
            id="max_volume_eur"
            type="number"
            data-testid="max-volume-eur-input"
            error={!!errors.max_volume_eur}
            endAction={
              <span className="text-sm text-muted-foreground">EUR</span>
            }
            {...register("max_volume_eur", { valueAsNumber: true })}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("wizard.envelopePricing.maxVolumeHint")}
          </p>
          {errors.max_volume_eur && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.max_volume_eur.message)}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title={t("wizard.envelopePricing.pricingSection")}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rate_type" className="mb-2">
              {t("fields.rateType")}
            </Label>
            <Controller
              control={control}
              name="rate_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rate_type" data-testid="rate-type-select">
                    <SelectValue>{t(`rateTypes.${field.value}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RateTypeSchema.options.map(rateType => (
                      <SelectItem key={rateType} value={rateType}>
                        {t(`rateTypes.${rateType}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label
              htmlFor="base_rate"
              error={!!errors.base_rate}
              className="mb-2"
            >
              {t("fields.baseRate")}
            </Label>
            <Input
              id="base_rate"
              type="number"
              data-testid="base-rate-input"
              error={!!errors.base_rate}
              endAction={
                <span className="text-sm text-muted-foreground">%</span>
              }
              {...register("base_rate", { valueAsNumber: true })}
            />
            {errors.base_rate && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.base_rate.message)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="spread" error={!!errors.spread} className="mb-2">
              {t("fields.spread")}
            </Label>
            <Input
              id="spread"
              type="number"
              data-testid="spread-input"
              error={!!errors.spread}
              endAction={
                <span className="text-sm text-muted-foreground">%</span>
              }
              {...register("spread", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.spreadHint")}
            </p>
            {errors.spread && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.spread.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="effective_rate"
              error={!!errors.effective_rate}
              className="mb-2"
            >
              {t("fields.effectiveRate")}
            </Label>
            <Input
              id="effective_rate"
              type="number"
              data-testid="effective-rate-input"
              error={!!errors.effective_rate}
              endAction={
                <span className="text-sm text-muted-foreground">%</span>
              }
              {...register("effective_rate", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.effectiveRateHint")}
            </p>
            {errors.effective_rate && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.effective_rate.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="rate_lock_period_months"
              error={!!errors.rate_lock_period_months}
              className="mb-2"
            >
              {t("fields.rateLockPeriodMonths")}
            </Label>
            <Input
              id="rate_lock_period_months"
              type="number"
              data-testid="rate-lock-period-input"
              error={!!errors.rate_lock_period_months}
              endAction={
                <span className="text-sm text-muted-foreground">months</span>
              }
              {...register("rate_lock_period_months", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.rateLockPeriodHint")}
            </p>
            {errors.rate_lock_period_months && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.rate_lock_period_months.message)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lg_coverage_rate_override" className="mb-2">
              {t("fields.lgCoverageRateOverride")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="lg_coverage_rate_override"
              type="number"
              data-testid="lg-coverage-rate-override-input"
              endAction={
                <span className="text-sm text-muted-foreground">%</span>
              }
              {...register("lg_coverage_rate_override", {
                setValueAs: v => (v === "" ? undefined : Number(v)),
              })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.coverageOverrideHint")}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export { EnvelopePricingStep }
