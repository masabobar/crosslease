import type { FieldError, UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import type { SelectOption } from "@/components/ui/select"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxCollection,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { selectOnFocus } from "@/lib/utils"
import { COUNTRIES } from "@/lib/countries"
import {
  DefaultCurrencySchema,
  TenantTypeSchema,
} from "@/features/tenants/api/schema"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

const COUNTRY_OPTIONS: SelectOption[] = COUNTRIES.map(({ code, name }) => ({
  value: code,
  label: name,
}))

type Props = {
  form: UseFormReturn<CreateTenantForm>
}

function IdentityStep({ form }: Props) {
  const { t } = useTranslation("tenants")
  const { t: tCommon } = useTranslation("common")
  const { register, control } = form
  const { errors } = useFormState({ control })

  const tenantTypeOptions: SelectOption[] = TenantTypeSchema.options.map(
    type => ({
      value: type,
      label: t(`tenantTypes.${type}`),
    })
  )

  const currencyOptions: SelectOption[] = DefaultCurrencySchema.options.map(
    currency => ({
      value: currency,
      label: t(`currencies.${currency}`),
    })
  )

  // Zod's built-in messages are untranslated English prose ("Too small: expected
  // string to have >=2 characters") and are not a stable contract, so they are
  // never rendered. Schema-authored keys (codeInvalidChars) are translated by
  // name; everything else resolves through the issue code, which is stable.
  function resolveMsg(error: FieldError | undefined) {
    if (!error) return undefined
    if (error.message === "codeInvalidChars")
      return t("errors.codeInvalidChars")
    if (error.type === "too_small") return tCommon("validation.tooShort")
    if (error.type === "too_big") return tCommon("validation.tooLong")
    return tCommon("validation.required")
  }

  return (
    <div
      className="border border-border rounded-xl bg-background p-4 flex flex-col gap-6"
      data-testid="identity-step"
    >
      {/* Tenant name */}
      <div>
        <Label htmlFor="name" error={!!errors.name} className="mb-2">
          {t("fields.tenantName")}
        </Label>
        <Input
          id="name"
          data-testid="tenant-name-input"
          error={!!errors.name}
          {...register("name")}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.name)}
          </p>
        )}
      </div>

      {/* Tenant code */}
      <div>
        <Label htmlFor="code" error={!!errors.code} className="mb-2">
          {t("fields.tenantCode")}
        </Label>
        <Input
          id="code"
          data-testid="tenant-code-input"
          placeholder={t("fields.tenantCodePlaceholder")}
          error={!!errors.code}
          {...register("code")}
        />
        <p className="mt-2 text-sm text-muted-foreground opacity-80">
          {t("fields.tenantCodeHint")}
        </p>
        {errors.code && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.code)}
          </p>
        )}
      </div>

      {/* Tenant type + Default currency (2-col row) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="tenant_type"
            error={!!errors.tenant_type}
            className="mb-2"
          >
            {t("fields.tenantType")}
          </Label>
          <Controller
            control={control}
            name="tenant_type"
            render={({ field }) => (
              <SelectField
                id="tenant_type"
                data-testid="tenant-type-select"
                value={field.value}
                onValueChange={field.onChange}
                options={tenantTypeOptions}
                placeholder={t("fields.tenantTypePlaceholder")}
                error={!!errors.tenant_type}
              />
            )}
          />
          {errors.tenant_type && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.tenant_type)}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="default_currency"
            error={!!errors.default_currency}
            className="mb-2"
          >
            {t("fields.defaultCurrency")}
          </Label>
          <Controller
            control={control}
            name="default_currency"
            render={({ field }) => (
              <SelectField
                id="default_currency"
                data-testid="currency-select"
                value={field.value}
                onValueChange={field.onChange}
                options={currencyOptions}
                error={!!errors.default_currency}
              />
            )}
          />
          {errors.default_currency && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.default_currency)}
            </p>
          )}
        </div>
      </div>

      {/* Legal entity name */}
      <div>
        <Label
          htmlFor="legal_entity_name"
          error={!!errors.legal_entity_name}
          className="mb-2"
        >
          {t("fields.legalEntityName")}
        </Label>
        <Input
          id="legal_entity_name"
          data-testid="legal-entity-name-input"
          error={!!errors.legal_entity_name}
          {...register("legal_entity_name")}
        />
        {errors.legal_entity_name && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.legal_entity_name)}
          </p>
        )}
      </div>

      {/* Country / Jurisdiction */}
      <div>
        <Label htmlFor="country" error={!!errors.country} className="mb-2">
          {t("fields.country")}
        </Label>
        <Controller
          control={control}
          name="country"
          render={({ field }) => {
            const selectedCountry =
              COUNTRY_OPTIONS.find(o => o.value === field.value) ?? null
            return (
              <Combobox
                items={COUNTRY_OPTIONS}
                value={selectedCountry}
                onValueChange={option => field.onChange(option?.value ?? "")}
              >
                <ComboboxInput
                  id="country"
                  data-testid="country-combobox"
                  placeholder={t("fields.countrySearchPlaceholder")}
                  showClear
                  aria-invalid={!!errors.country}
                  onFocus={selectOnFocus}
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxEmpty>
                      {t("fields.countryNoResults")}
                    </ComboboxEmpty>
                    <ComboboxCollection>
                      {(opt: { value: string; label: string }) => (
                        <ComboboxItem key={opt.value} value={opt}>
                          {opt.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )
          }}
        />
        {errors.country && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.country)}
          </p>
        )}
      </div>

      {/* Tenant description (optional) */}
      <div>
        <Label
          htmlFor="description"
          error={!!errors.description}
          className="mb-2"
        >
          {t("fields.description")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.descriptionOptional")}
          </span>
        </Label>
        <Textarea
          id="description"
          data-testid="description-textarea"
          className="min-h-[64px] resize-none"
          rows={2}
          {...register("description")}
        />
        <p className="mt-2 text-sm text-muted-foreground opacity-80">
          {t("fields.descriptionHint")}
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.description)}
          </p>
        )}
      </div>
    </div>
  )
}

export { IdentityStep }
