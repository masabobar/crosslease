import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import { Controller } from "react-hook-form"
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
import type { RateType } from "@/features/frameworkAgreements/api/schema"

export type EnvelopePricingFormFields = {
  max_volume_eur: number
  base_rate: number
  spread: number
  rate_type: RateType
  effective_rate: number
  rate_lock_period_months: number
  lg_coverage_rate_override?: number
}

type Props<T extends EnvelopePricingFormFields> = {
  register: UseFormRegister<T>
  control: Control<T>
  errors: FieldErrors<T>
  resolveMsg: (msg: string | undefined) => string | undefined
  idPrefix?: string
  testIdPrefix?: string
}

function EnvelopePricingFields<T extends EnvelopePricingFormFields>({
  register,
  control,
  errors,
  resolveMsg,
  idPrefix = "",
  testIdPrefix = "",
}: Props<T>) {
  const { t } = useTranslation("frameworkAgreements")
  const typedRegister =
    register as unknown as UseFormRegister<EnvelopePricingFormFields>
  const typedControl = control as unknown as Control<EnvelopePricingFormFields>
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${idPrefix}rate_type`} className="mb-2">
              {t("fields.rateType")}
            </Label>
            <Controller
              control={typedControl}
              name="rate_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={`${idPrefix}rate_type`}
                    data-testid={`${testIdPrefix}rate-type-select`}
                  >
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
              htmlFor={`${idPrefix}base_rate`}
              error={!!typedErrors.base_rate}
              className="mb-2"
            >
              {t("fields.baseRate")}
            </Label>
            <Input
              id={`${idPrefix}base_rate`}
              type="number"
              data-testid={`${testIdPrefix}base-rate-input`}
              error={!!typedErrors.base_rate}
              endAction={
                <span className="text-sm text-muted-foreground">
                  {t("units.percent")}
                </span>
              }
              {...typedRegister("base_rate", { valueAsNumber: true })}
            />
            {typedErrors.base_rate && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(typedErrors.base_rate.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor={`${idPrefix}spread`}
              error={!!typedErrors.spread}
              className="mb-2"
            >
              {t("fields.spread")}
            </Label>
            <Input
              id={`${idPrefix}spread`}
              type="number"
              data-testid={`${testIdPrefix}spread-input`}
              error={!!typedErrors.spread}
              endAction={
                <span className="text-sm text-muted-foreground">
                  {t("units.percent")}
                </span>
              }
              {...typedRegister("spread", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.spreadHint")}
            </p>
            {typedErrors.spread && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(typedErrors.spread.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor={`${idPrefix}effective_rate`}
              error={!!typedErrors.effective_rate}
              className="mb-2"
            >
              {t("fields.effectiveRate")}
            </Label>
            <Input
              id={`${idPrefix}effective_rate`}
              type="number"
              data-testid={`${testIdPrefix}effective-rate-input`}
              error={!!typedErrors.effective_rate}
              endAction={
                <span className="text-sm text-muted-foreground">
                  {t("units.percent")}
                </span>
              }
              {...typedRegister("effective_rate", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.effectiveRateHint")}
            </p>
            {typedErrors.effective_rate && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(typedErrors.effective_rate.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor={`${idPrefix}rate_lock_period_months`}
              error={!!typedErrors.rate_lock_period_months}
              className="mb-2"
            >
              {t("fields.rateLockPeriodMonths")}
            </Label>
            <Input
              id={`${idPrefix}rate_lock_period_months`}
              type="number"
              data-testid={`${testIdPrefix}rate-lock-period-input`}
              error={!!typedErrors.rate_lock_period_months}
              endAction={
                <span className="text-sm text-muted-foreground">
                  {t("units.months")}
                </span>
              }
              {...typedRegister("rate_lock_period_months", {
                valueAsNumber: true,
              })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.rateLockPeriodHint")}
            </p>
            {typedErrors.rate_lock_period_months && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(typedErrors.rate_lock_period_months.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor={`${idPrefix}lg_coverage_rate_override`}
              className="mb-2"
            >
              {t("fields.lgCoverageRateOverride")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id={`${idPrefix}lg_coverage_rate_override`}
              type="number"
              data-testid={`${testIdPrefix}lg-coverage-rate-override-input`}
              endAction={
                <span className="text-sm text-muted-foreground">
                  {t("units.percent")}
                </span>
              }
              {...typedRegister("lg_coverage_rate_override", {
                setValueAs: v => (v === "" ? undefined : Number(v)),
              })}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.envelopePricing.coverageOverrideHint")}
            </p>
          </div>
        </div>
      </SectionCard>
    </>
  )
}

export { EnvelopePricingFields }
