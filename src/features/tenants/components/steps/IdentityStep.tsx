import type { UseFormReturn } from "react-hook-form"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import type { SelectOption } from "@/components/ui/select"
import type { CreateTenantForm } from "@/features/tenants/api/schema"

const CURRENCY_OPTIONS: SelectOption[] = [
  { value: "EUR", label: "Euro · EUR" },
  { value: "USD", label: "US Dollar · USD" },
  { value: "GBP", label: "British Pound · GBP" },
  { value: "CHF", label: "Swiss Franc · CHF" },
]

// ISO 3166-1 alpha-2 — common European countries; extend as needed
const COUNTRY_OPTIONS: SelectOption[] = [
  { value: "AT", label: "AT — Austria" },
  { value: "BE", label: "BE — Belgium" },
  { value: "BG", label: "BG — Bulgaria" },
  { value: "CH", label: "CH — Switzerland" },
  { value: "CZ", label: "CZ — Czech Republic" },
  { value: "DE", label: "DE — Germany" },
  { value: "DK", label: "DK — Denmark" },
  { value: "EE", label: "EE — Estonia" },
  { value: "ES", label: "ES — Spain" },
  { value: "FI", label: "FI — Finland" },
  { value: "FR", label: "FR — France" },
  { value: "GB", label: "GB — United Kingdom" },
  { value: "GR", label: "GR — Greece" },
  { value: "HR", label: "HR — Croatia" },
  { value: "HU", label: "HU — Hungary" },
  { value: "IE", label: "IE — Ireland" },
  { value: "IT", label: "IT — Italy" },
  { value: "LT", label: "LT — Lithuania" },
  { value: "LU", label: "LU — Luxembourg" },
  { value: "LV", label: "LV — Latvia" },
  { value: "MT", label: "MT — Malta" },
  { value: "NL", label: "NL — Netherlands" },
  { value: "PL", label: "PL — Poland" },
  { value: "PT", label: "PT — Portugal" },
  { value: "RO", label: "RO — Romania" },
  { value: "RS", label: "RS — Serbia" },
  { value: "SE", label: "SE — Sweden" },
  { value: "SI", label: "SI — Slovenia" },
  { value: "SK", label: "SK — Slovakia" },
  { value: "US", label: "US — United States" },
]

type Props = {
  form: UseFormReturn<CreateTenantForm>
}

function IdentityStep({ form }: Props) {
  const { t } = useTranslation("tenants")
  const { t: tCommon } = useTranslation("common")
  const {
    register,
    control,
    formState: { errors },
  } = form

  const tenantTypeOptions: SelectOption[] = (
    ["bank", "bank_entity", "bank_branch_group"] as const
  ).map(type => ({
    value: type,
    label: t(`tenantTypes.${type}`),
  }))

  function resolveMsg(msg: string | undefined) {
    if (!msg) return undefined
    if (msg === "Required") return tCommon("validation.required")
    if (msg === "codeInvalidChars") return t("errors.codeInvalidChars")
    return msg
  }

  return (
    <div
      className="border border-border rounded-xl bg-background p-4 flex flex-col gap-6"
      data-testid="identity-step"
    >
      {/* Tenant name */}
      <div>
        <Label htmlFor="name" error={!!errors.name} className="mb-1.5">
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
            {resolveMsg(errors.name.message)}
          </p>
        )}
      </div>

      {/* Tenant code */}
      <div>
        <Label htmlFor="code" error={!!errors.code} className="mb-1.5">
          {t("fields.tenantCode")}
        </Label>
        <Input
          id="code"
          data-testid="tenant-code-input"
          error={!!errors.code}
          {...register("code")}
        />
        <p className="mt-1 text-sm text-muted-foreground opacity-80">
          {t("fields.tenantCodeHint")}
        </p>
        {errors.code && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.code.message)}
          </p>
        )}
      </div>

      {/* Tenant type + Default currency (2-col row) */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="tenant_type"
            error={!!errors.tenant_type}
            className="mb-1.5"
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
                error={!!errors.tenant_type}
              />
            )}
          />
          {errors.tenant_type && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.tenant_type.message)}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="default_currency"
            error={!!errors.default_currency}
            className="mb-1.5"
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
                options={CURRENCY_OPTIONS}
                error={!!errors.default_currency}
              />
            )}
          />
          {errors.default_currency && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.default_currency.message)}
            </p>
          )}
        </div>
      </div>

      {/* Legal entity name */}
      <div>
        <Label
          htmlFor="legal_entity_name"
          error={!!errors.legal_entity_name}
          className="mb-1.5"
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
            {resolveMsg(errors.legal_entity_name.message)}
          </p>
        )}
      </div>

      {/* Country / Jurisdiction */}
      <div>
        <Label htmlFor="country" error={!!errors.country} className="mb-1.5">
          {t("fields.country")}
        </Label>
        <Controller
          control={control}
          name="country"
          render={({ field }) => (
            <SelectField
              id="country"
              data-testid="country-select"
              value={field.value}
              onValueChange={field.onChange}
              options={COUNTRY_OPTIONS}
              error={!!errors.country}
            />
          )}
        />
        {errors.country && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.country.message)}
          </p>
        )}
      </div>

      {/* Tenant description (optional) */}
      <div>
        <Label
          htmlFor="description"
          error={!!errors.description}
          className="mb-1.5"
        >
          {t("fields.description")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("fields.descriptionOptional")}
          </span>
        </Label>
        <Textarea
          id="description"
          data-testid="description-textarea"
          rows={3}
          {...register("description")}
        />
        <p className="mt-1 text-sm text-muted-foreground opacity-80">
          {t("fields.descriptionHint")}
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.description.message)}
          </p>
        )}
      </div>
    </div>
  )
}

export { IdentityStep }
