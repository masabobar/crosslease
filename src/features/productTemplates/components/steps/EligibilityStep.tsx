import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { SectionCard } from "@/components/shared/SectionCard"
import { optionalNumber } from "@/lib/utils"
import { resolveFieldErrorMessage } from "@/features/productTemplates/utils"
import {
  AssetCategorySchema,
  type ProductTemplateWizardForm,
} from "@/features/productTemplates/api/schema"

type Props = {
  form: UseFormReturn<ProductTemplateWizardForm>
}

function EligibilityStep({ form }: Props) {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { register, control } = form
  const { errors } = useFormState({ control })

  // Mirrors the schema's date rule in the picker itself: validity cannot start in the past.
  //
  // `minDate={today}` stays on the start picker even though the past-date *rejection* moved
  // to publish (CR-BPT-08, see ProductTemplatePublishFormSchema). The two are not in
  // conflict: there is never a reason to pick a past date here, so the calendar keeps
  // offering only valid ones, while the schema no longer blocks saving a draft that has no
  // date yet. A draft saved today and published next week is caught by the publish gate.
  const today = new Date()

  const errorMessages = {
    atLeastOne: t("errors.atLeastOneAssetCategory"),
    minTermExceedsMax: t("errors.minTermExceedsMax"),
    minVolumeExceedsMax: t("errors.minVolumeExceedsMax"),
    validFromInPast: t("errors.validFromInPast"),
    termBelowMin: t("errors.termBelowMin"),
    termAboveMax: t("errors.termAboveMax"),
    ltvBelowMin: t("errors.ltvBelowMin"),
    ltvAboveMax: t("errors.ltvAboveMax"),
    volumeBelowMin: t("errors.volumeBelowMin"),
  }
  function resolveMsg(msg: string | undefined) {
    return resolveFieldErrorMessage(
      msg,
      tCommon("validation.required"),
      errorMessages
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="eligibility-step">
      <SectionCard
        title={t("sections.allowedAssetCategories")}
        subtitle={t("fields.allowedAssetCategoriesHint")}
      >
        <Controller
          control={control}
          name="allowed_asset_categories"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {AssetCategorySchema.options.map(category => {
                const checked = (field.value ?? []).includes(category)
                return (
                  <Label
                    key={category}
                    htmlFor={`asset-category-${category}`}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      id={`asset-category-${category}`}
                      data-testid={`asset-category-${category}-checkbox`}
                      checked={checked}
                      onCheckedChange={value => {
                        const current = field.value ?? []
                        field.onChange(
                          value
                            ? [...current, category]
                            : current.filter(c => c !== category)
                        )
                      }}
                    />
                    <span className="text-sm text-foreground">
                      {t(`assetCategories.${category}`)}
                    </span>
                  </Label>
                )
              })}
            </div>
          )}
        />
        {errors.allowed_asset_categories && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.allowed_asset_categories.message)}
          </p>
        )}
      </SectionCard>

      <SectionCard title={t("sections.details")}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="min_term_months"
              error={!!errors.min_term_months}
              className="mb-2"
            >
              {t("fields.minTermMonths")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="min_term_months"
              type="number"
              data-testid="min-term-months-input"
              error={!!errors.min_term_months}
              {...register("min_term_months", { setValueAs: optionalNumber })}
            />
            {errors.min_term_months && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.min_term_months.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="max_term_months"
              error={!!errors.max_term_months}
              className="mb-2"
            >
              {t("fields.maxTermMonths")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="max_term_months"
              type="number"
              data-testid="max-term-months-input"
              error={!!errors.max_term_months}
              {...register("max_term_months", { setValueAs: optionalNumber })}
            />
            {errors.max_term_months && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.max_term_months.message)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="max_ltv_ratio"
              error={!!errors.max_ltv_ratio}
              className="mb-2"
            >
              {t("fields.maxLtvRatio")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="max_ltv_ratio"
              type="number"
              data-testid="max-ltv-ratio-input"
              error={!!errors.max_ltv_ratio}
              {...register("max_ltv_ratio", { setValueAs: optionalNumber })}
            />
            {errors.max_ltv_ratio && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.max_ltv_ratio.message)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="min_volume_eur"
              error={!!errors.min_volume_eur}
              className="mb-2"
            >
              {t("fields.minVolumeEur")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="min_volume_eur"
              type="number"
              data-testid="min-volume-eur-input"
              error={!!errors.min_volume_eur}
              {...register("min_volume_eur", { setValueAs: optionalNumber })}
            />
            {errors.min_volume_eur && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.min_volume_eur.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="max_volume_eur"
              error={!!errors.max_volume_eur}
              className="mb-2"
            >
              {t("fields.maxVolumeEur")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="max_volume_eur"
              type="number"
              data-testid="max-volume-eur-input"
              error={!!errors.max_volume_eur}
              {...register("max_volume_eur", { setValueAs: optionalNumber })}
            />
            {errors.max_volume_eur && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.max_volume_eur.message)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="valid_from"
              error={!!errors.valid_from}
              className="mb-2"
            >
              {t("fields.validFrom")}
            </Label>
            <Controller
              control={control}
              name="valid_from"
              render={({ field }) => (
                <DatePicker
                  id="valid_from"
                  data-testid="valid-from-datepicker"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!errors.valid_from}
                  minDate={today}
                  captionLayout="dropdown"
                />
              )}
            />
            <p className="mt-2 text-sm text-muted-foreground opacity-80">
              {t("fields.validFromHint")}
            </p>
            {errors.valid_from && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.valid_from.message)}
              </p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

export { EligibilityStep }
