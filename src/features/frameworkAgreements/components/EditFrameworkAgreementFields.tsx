import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { ProductTemplateMultiSelect } from "@/features/frameworkAgreements/components/ProductTemplateMultiSelect"
import { RateTypeSchema } from "@/features/frameworkAgreements/api/schema"
import type { EditFrameworkAgreementFormValues } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<EditFrameworkAgreementFormValues>
  isDraft: boolean
  validUntilDisabled: boolean
  validUntilMinDate: Date | undefined
}

function EditFrameworkAgreementFields({
  form,
  isDraft,
  validUntilDisabled,
  validUntilMinDate,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { register, control } = form
  const { errors } = useFormState({ control })
  const validFrom = useWatch({ control, name: "valid_from" })

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "required") return tCommon("validation.required")
    if (msg === "validUntilBeforeFrom") return t("errors.validUntilBeforeFrom")
    if (msg === "atLeastOneTemplate") return t("errors.atLeastOneTemplate")
    return msg
  }

  const validUntilMin = isDraft
    ? validFrom
      ? new Date(validFrom)
      : undefined
    : validUntilMinDate

  return (
    <div className="flex flex-col gap-4" data-testid="edit-fa-fields">
      <SectionCard title={t("wizard.envelopePricing.creditEnvelopeSection")}>
        <div>
          <Label
            htmlFor="edit_max_volume_eur"
            error={!!errors.max_volume_eur}
            className="mb-2"
          >
            {t("fields.maxVolumeEur")}
          </Label>
          <Input
            id="edit_max_volume_eur"
            type="number"
            data-testid="edit-max-volume-eur-input"
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
            <Label htmlFor="edit_rate_type" className="mb-2">
              {t("fields.rateType")}
            </Label>
            <Controller
              control={control}
              name="rate_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="edit_rate_type"
                    data-testid="edit-rate-type-select"
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
              htmlFor="edit_base_rate"
              error={!!errors.base_rate}
              className="mb-2"
            >
              {t("fields.baseRate")}
            </Label>
            <Input
              id="edit_base_rate"
              type="number"
              data-testid="edit-base-rate-input"
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
            <Label
              htmlFor="edit_spread"
              error={!!errors.spread}
              className="mb-2"
            >
              {t("fields.spread")}
            </Label>
            <Input
              id="edit_spread"
              type="number"
              data-testid="edit-spread-input"
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
              htmlFor="edit_effective_rate"
              error={!!errors.effective_rate}
              className="mb-2"
            >
              {t("fields.effectiveRate")}
            </Label>
            <Input
              id="edit_effective_rate"
              type="number"
              data-testid="edit-effective-rate-input"
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
              htmlFor="edit_rate_lock_period_months"
              error={!!errors.rate_lock_period_months}
              className="mb-2"
            >
              {t("fields.rateLockPeriodMonths")}
            </Label>
            <Input
              id="edit_rate_lock_period_months"
              type="number"
              data-testid="edit-rate-lock-period-input"
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
            <Label htmlFor="edit_lg_coverage_rate_override" className="mb-2">
              {t("fields.lgCoverageRateOverride")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="edit_lg_coverage_rate_override"
              type="number"
              data-testid="edit-lg-coverage-rate-override-input"
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

      <SectionCard title={t("wizard.validityTemplates.validityWindowSection")}>
        <div>
          <Label
            htmlFor="edit_valid_until"
            error={!!errors.valid_until}
            className="mb-2"
          >
            {t("fields.validUntil")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("fields.optional")}
            </span>
          </Label>
          <Controller
            control={control}
            name="valid_until"
            render={({ field }) => (
              <DatePicker
                id="edit_valid_until"
                data-testid="edit-valid-until-datepicker"
                value={field.value}
                onChange={field.onChange}
                error={!!errors.valid_until}
                disabled={validUntilDisabled}
                minDate={validUntilMin}
              />
            )}
          />
          {validUntilDisabled && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("edit.validUntilLockedHint")}
            </p>
          )}
          {errors.valid_until && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.valid_until.message)}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title={t("wizard.validityTemplates.templatesSection")}
        subtitle={t("wizard.validityTemplates.templatesHint")}
      >
        <Controller
          control={control}
          name="product_template_ids"
          render={({ field }) => (
            <ProductTemplateMultiSelect
              value={field.value ?? []}
              onChange={field.onChange}
              error={!!errors.product_template_ids}
            />
          )}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("edit.templateRemovalHint")}
        </p>
        {errors.product_template_ids && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.product_template_ids.message)}
          </p>
        )}
      </SectionCard>

      <div className="border border-border rounded-xl bg-background p-4">
        <Label htmlFor="edit_special_conditions" className="mb-2">
          {t("fields.specialConditions")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.optional")}
          </span>
        </Label>
        <Textarea
          id="edit_special_conditions"
          data-testid="edit-special-conditions-textarea"
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
    </div>
  )
}

export { EditFrameworkAgreementFields }
