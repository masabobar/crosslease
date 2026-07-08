import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectField } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { COUNTRIES } from "@/lib/countries"
import {
  PartnerRoleSchema,
  PartnerTypeSchema,
} from "@/features/partners/api/schema"
import type { PartnerRole, PartnerType } from "@/features/partners/api/schema"
import type { PartnerIdentityInput } from "@/features/partners/api/partnersApi"

const RISK_SENSITIVE_ROLES: PartnerRole[] = [
  "leasing_company",
  "bank_entity",
  "ubo_related_person",
]

const COUNTRY_OPTIONS = COUNTRIES.map(c => ({ value: c.code, label: c.name }))
const PARTNER_TYPE_OPTIONS = PartnerTypeSchema.options

// Mirrors LegalEntityIdentityInput.validate_lei in refinext-api's partner_schemas.py —
// ISO 17442 mod-97: move first 4 chars to end, convert letters to digits, check mod 97 == 1.
function isValidLei(raw: string): boolean {
  const lei = raw.trim().toUpperCase()
  if (!/^[A-Z0-9]{20}$/.test(lei)) return false
  const rearranged = lei.slice(4) + lei.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }
  return remainder === 1
}

// RHF returns "" (not undefined) for optional text inputs the user never touched.
// refinext-api's optional-field validators (e.g. validate_lei) only skip on None —
// an explicit "" still fails their format checks — so blank fields must be omitted.
function blankToUndefined(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === "" ? undefined : value
  }
  return result
}

// NOTE: Figma design also shows a "State / Region (optional)" field in the
// ADDRESS section, but RegisteredAddress in refinext-api has no such field
// (street/city/postal_code/country only). Omitted here rather than building
// a UI field with nowhere to send its value — see design-first.md §4.
//
// registered_address.country is not collected as a separate field — the form
// reuses the top-level `country` value at submit time (see onValid) rather
// than asking for the same country twice.
const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
})

const legalEntitySchema = z.object({
  partner_type: z.literal("legal_entity"),
  legal_name: z.string().min(1, "Required"),
  legal_form: z.string().optional(),
  country: z.string().min(1, "Required"),
  tax_id_vat: z.string().optional(),
  lei: z
    .string()
    .optional()
    .refine(v => !v || isValidLei(v), {
      message: "LEI must be exactly 20 alphanumeric characters (ISO 17442)",
    }),
  commercial_register_no: z.string().optional(),
  registered_address: addressSchema.optional(),
  roles: z.array(PartnerRoleSchema).min(1, "Required"),
})

const naturalPersonSchema = z.object({
  partner_type: z.literal("natural_person"),
  full_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  place_of_birth: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  birth_name: z.string().optional(),
  national_id: z.string().optional(),
  registered_address: addressSchema.optional(),
  roles: z.array(PartnerRoleSchema).min(1, "Required"),
})

const soleProprietorSchema = z.object({
  partner_type: z.literal("sole_proprietor"),
  full_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  tax_id_vat: z.string().optional(),
  commercial_register_no: z.string().optional(),
  registered_address: addressSchema.optional(),
  roles: z.array(PartnerRoleSchema).min(1, "Required"),
})

type LegalEntityForm = z.infer<typeof legalEntitySchema>
type NaturalPersonForm = z.infer<typeof naturalPersonSchema>
type SoleProprietorForm = z.infer<typeof soleProprietorSchema>
type IdentityForm = LegalEntityForm | NaturalPersonForm | SoleProprietorForm

function schemaForType(type: PartnerType) {
  if (type === "natural_person") return naturalPersonSchema
  if (type === "sole_proprietor") return soleProprietorSchema
  return legalEntitySchema
}

type SubmitResult = { identity: PartnerIdentityInput; roles: PartnerRole[] }

type PartnerSubmitFormProps = {
  formId: string
  onSubmit: (result: SubmitResult) => void
}

function PartnerSubmitForm({ formId, onSubmit }: PartnerSubmitFormProps) {
  const { t } = useTranslation("partners")
  const [partnerType, setPartnerType] = useState<PartnerType>("legal_entity")

  const {
    register,
    handleSubmit,
    control,
    getValues,
    reset,
    formState: { errors },
  } = useForm<IdentityForm>({
    resolver: (values, context, options) =>
      zodResolver(schemaForType(partnerType))(values, context, options),
    defaultValues: { partner_type: "legal_entity" } as IdentityForm,
  })

  const country = useWatch({
    control,
    name: "country" as keyof IdentityForm,
  }) as string | undefined
  const isDe = (country ?? "").toUpperCase() === "DE"

  function handleTypeChange(type: PartnerType) {
    setPartnerType(type)
    reset({
      partner_type: type,
      roles: getValues("roles" as keyof IdentityForm),
    } as IdentityForm)
  }

  function onValid(values: IdentityForm) {
    const { roles, registered_address, ...rest } = values
    onSubmit({
      identity: {
        ...blankToUndefined(rest),
        registered_address: blankToUndefined({
          ...registered_address,
          country: rest.country,
        }),
      } as PartnerIdentityInput,
      roles,
    })
  }

  const isLegalEntity = partnerType === "legal_entity"

  const entityTypeField = (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="entity_type">{t("submit.form.fields.entityType")}</Label>
      <SelectField
        id="entity_type"
        data-testid="field-entity_type"
        value={partnerType}
        onValueChange={v => handleTypeChange(v as PartnerType)}
        options={PARTNER_TYPE_OPTIONS.map(type => ({
          value: type,
          label: t(`type.${type}` as "type.legal_entity"),
        }))}
      />
    </div>
  )

  const dateOfBirthField = (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="date_of_birth">
        {t("submit.identityStep.fields.dateOfBirth")}
      </Label>
      <Controller
        control={control}
        name={"date_of_birth" as keyof IdentityForm}
        render={({ field }) => (
          <DatePicker
            id="date_of_birth"
            data-testid="field-date_of_birth"
            value={field.value as string}
            onChange={field.onChange}
            maxDate={new Date()}
            error={"date_of_birth" in errors && !!errors.date_of_birth}
          />
        )}
      />
      {"date_of_birth" in errors && errors.date_of_birth && (
        <p className="text-xs text-destructive">
          {errors.date_of_birth.message}
        </p>
      )}
    </div>
  )

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onValid)}
      className="flex flex-col gap-4"
    >
      <input
        type="hidden"
        {...register("partner_type" as keyof IdentityForm)}
      />

      {/* BASIC IDENTITY */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="bg-muted px-4 py-2 gap-0">
          <CardTitle className="text-xs">
            {t("submit.form.sections.basicIdentity")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4 flex flex-col gap-6">
          {isLegalEntity ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="legal_name">
                {t("submit.identityStep.fields.legalName")}
              </Label>
              <Input
                id="legal_name"
                data-testid="field-legal_name"
                {...register("legal_name" as keyof IdentityForm)}
              />
              {"legal_name" in errors && errors.legal_name && (
                <p className="text-xs text-destructive">
                  {errors.legal_name.message}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full_name">
                  {t("submit.identityStep.fields.fullName")}
                </Label>
                <Input
                  id="full_name"
                  data-testid="field-full_name"
                  {...register("full_name" as keyof IdentityForm)}
                />
                {"full_name" in errors && errors.full_name && (
                  <p className="text-xs text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
              {partnerType === "natural_person" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="birth_name">
                    {t("submit.identityStep.fields.birthName")}
                  </Label>
                  <Input
                    id="birth_name"
                    data-testid="field-birth_name"
                    {...register("birth_name" as keyof IdentityForm)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {isLegalEntity ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="legal_form">
                  {t("submit.identityStep.fields.legalForm")}
                </Label>
                <Input
                  id="legal_form"
                  data-testid="field-legal_form"
                  {...register("legal_form" as keyof IdentityForm)}
                />
              </div>
            ) : (
              partnerType === "sole_proprietor" && dateOfBirthField
            )}
            {isLegalEntity || partnerType === "sole_proprietor" ? (
              entityTypeField
            ) : (
              <div className="col-span-2">{entityTypeField}</div>
            )}
          </div>

          {partnerType === "natural_person" && (
            <div className="grid grid-cols-2 gap-4">
              {dateOfBirthField}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="place_of_birth">
                  {t("submit.identityStep.fields.placeOfBirth")}
                </Label>
                <Input
                  id="place_of_birth"
                  data-testid="field-place_of_birth"
                  {...register("place_of_birth" as keyof IdentityForm)}
                />
                {"place_of_birth" in errors && errors.place_of_birth && (
                  <p className="text-xs text-destructive">
                    {errors.place_of_birth.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* REGISTRY IDENTIFIERS */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="bg-muted px-4 py-2 gap-0">
          <CardTitle className="text-xs">
            {t("submit.form.sections.registryIdentifiers")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">
                {t("submit.identityStep.fields.country")}
              </Label>
              <Controller
                control={control}
                name={"country" as keyof IdentityForm}
                render={({ field }) => (
                  <Combobox
                    items={COUNTRY_OPTIONS}
                    value={(field.value as string) ?? ""}
                    onValueChange={field.onChange}
                  >
                    <ComboboxInput
                      id="country"
                      data-testid="field-country"
                      placeholder={t("list.filters.countrySearchPlaceholder")}
                      showClear
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        <ComboboxEmpty>
                          {t("list.filters.noCountriesFound")}
                        </ComboboxEmpty>
                        <ComboboxCollection>
                          {(opt: { value: string; label: string }) => (
                            <ComboboxItem value={opt.value}>
                              {opt.label}
                            </ComboboxItem>
                          )}
                        </ComboboxCollection>
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )}
              />
              {"country" in errors && errors.country && (
                <p className="text-xs text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
            {partnerType === "natural_person" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="national_id">
                  {t("submit.identityStep.fields.nationalId")}{" "}
                  <span className="text-muted-foreground">
                    ({t("submit.form.optional")})
                  </span>
                </Label>
                <Input
                  id="national_id"
                  data-testid="field-national_id"
                  {...register("national_id" as keyof IdentityForm)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="commercial_register_no">
                  {t("submit.identityStep.fields.commercialRegisterNo")}
                </Label>
                <Input
                  id="commercial_register_no"
                  data-testid="field-commercial_register_no"
                  disabled={!isDe}
                  {...register("commercial_register_no" as keyof IdentityForm)}
                />
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("submit.form.hints.hrbMandatoryDe")}
                </p>
              </div>
            )}
          </div>

          {isLegalEntity && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tax_id_vat">
                  {t("submit.identityStep.fields.taxIdVat")}{" "}
                  <span className="text-muted-foreground">
                    ({t("submit.form.optional")})
                  </span>
                </Label>
                <Input
                  id="tax_id_vat"
                  data-testid="field-tax_id_vat"
                  {...register("tax_id_vat" as keyof IdentityForm)}
                />
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("submit.form.hints.taxIdMatching")}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lei">
                  {t("submit.identityStep.fields.lei")}{" "}
                  <span className="text-muted-foreground">
                    ({t("submit.form.optional")})
                  </span>
                </Label>
                <Input
                  id="lei"
                  data-testid="field-lei"
                  {...register("lei" as keyof IdentityForm)}
                />
                {"lei" in errors && errors.lei && (
                  <p className="text-xs text-destructive">
                    {errors.lei.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("submit.form.hints.leiFormat")}
                </p>
              </div>
            </div>
          )}

          {partnerType === "sole_proprietor" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_id_vat">
                {t("submit.identityStep.fields.taxIdVat")}{" "}
                <span className="text-muted-foreground">
                  ({t("submit.form.optional")})
                </span>
              </Label>
              <Input
                id="tax_id_vat"
                data-testid="field-tax_id_vat"
                {...register("tax_id_vat" as keyof IdentityForm)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADDRESS */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="bg-muted px-4 py-2 gap-0">
          <CardTitle className="text-xs">
            {t("submit.form.sections.address")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="street">
                {t("submit.identityStep.fields.street")}{" "}
                <span className="text-muted-foreground">
                  ({t("submit.form.optional")})
                </span>
              </Label>
              <Input
                id="street"
                data-testid="field-street"
                {...register("registered_address.street" as keyof IdentityForm)}
              />
              {"registered_address" in errors &&
                errors.registered_address?.street && (
                  <p className="text-xs text-destructive">
                    {errors.registered_address.street.message}
                  </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">
                {t("submit.identityStep.fields.city")}{" "}
                <span className="text-muted-foreground">
                  ({t("submit.form.optional")})
                </span>
              </Label>
              <Input
                id="city"
                data-testid="field-city"
                {...register("registered_address.city" as keyof IdentityForm)}
              />
              {"registered_address" in errors &&
                errors.registered_address?.city && (
                  <p className="text-xs text-destructive">
                    {errors.registered_address.city.message}
                  </p>
                )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-1/2 pr-2">
            <Label htmlFor="postal_code">
              {t("submit.identityStep.fields.postalCode")}{" "}
              <span className="text-muted-foreground">
                ({t("submit.form.optional")})
              </span>
            </Label>
            <Input
              id="postal_code"
              data-testid="field-postal_code"
              {...register(
                "registered_address.postal_code" as keyof IdentityForm
              )}
            />
            {"registered_address" in errors &&
              errors.registered_address?.postal_code && (
                <p className="text-xs text-destructive">
                  {errors.registered_address.postal_code.message}
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {/* CLASSIFICATION */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="bg-muted px-4 py-2 gap-1">
          <CardTitle className="text-xs">
            {t("submit.form.sections.classification")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("submit.form.classificationHint")}
          </p>
        </CardHeader>
        <CardContent className="px-4 py-4">
          <Controller
            control={control}
            name={"roles" as keyof IdentityForm}
            render={({ field }) => {
              const selected = (field.value as PartnerRole[] | undefined) ?? []
              function toggle(role: PartnerRole) {
                field.onChange(
                  selected.includes(role)
                    ? selected.filter(r => r !== role)
                    : [...selected, role]
                )
              }
              return (
                <div className="grid grid-cols-2 gap-2">
                  {PartnerRoleSchema.options.map(role => {
                    const isRisky = RISK_SENSITIVE_ROLES.includes(role)
                    const checked = selected.includes(role)
                    return (
                      <label
                        key={role}
                        htmlFor={`role-${role}`}
                        className="flex items-start gap-2 p-3 rounded-xl border border-border cursor-pointer"
                      >
                        <Checkbox
                          id={`role-${role}`}
                          checked={checked}
                          onCheckedChange={() => toggle(role)}
                          className="mt-1"
                        />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-foreground">
                              {t(`role.${role}` as "role.lessee")}
                            </span>
                            {isRisky && (
                              <span className="text-xs font-medium text-warning bg-warning/10 rounded-full px-1.5 py-0.5">
                                {t("submit.form.fourEyesBadge")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t(
                              `submit.form.roleDescriptions.${role}` as "submit.form.roleDescriptions.lessee"
                            )}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )
            }}
          />
          {"roles" in errors && errors.roles && (
            <p className="text-xs text-destructive mt-2">
              {t("submit.form.errors.roleRequired")}
            </p>
          )}
        </CardContent>
      </Card>
    </form>
  )
}

export { PartnerSubmitForm }
export type { SubmitResult }
