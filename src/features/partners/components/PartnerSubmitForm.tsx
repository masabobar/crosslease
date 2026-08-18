import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import type { DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { selectOnFocus } from "@/lib/utils"
import {
  blankToUndefined,
  isCommercialRegisterApplicable,
  isNotFutureDate,
  isValidLcNumber,
  isValidLei,
} from "@/features/partners/utils"
import { PartnerTypeSchema } from "@/features/partners/api/schema"
import type { PartnerType } from "@/features/partners/api/schema"
import type { PartnerIdentityInput } from "@/features/partners/api/partnersApi"
import { AccountsSection } from "@/features/partners/components/AccountsSection"
import type { Account } from "@/features/partners/components/AccountsSection"
import type { AccountFormValues } from "@/features/partners/components/AccountFormDialog"

// RHF's reset() only clears top-level fields omitted from the new values —
// nested paths like registered_address.street are left untouched unless
// explicitly included, so a switch away from Legal Entity would otherwise
// leave its address behind on the new (blank-looking) form.
const BLANK_ADDRESS = {
  street: "",
  city: "",
  postal_code: "",
  state_region: "",
}

const COUNTRY_OPTIONS = COUNTRIES.map(c => ({ value: c.code, label: c.name }))
const PARTNER_TYPE_OPTIONS = PartnerTypeSchema.options
const VALID_COUNTRY_CODES = new Set(COUNTRY_OPTIONS.map(o => o.value))

// The Country field is a free-typeable Combobox — browser address autofill can
// inject a full country name (or other stray text) into it instead of a valid
// selection. Reject anything that isn't one of the known codes here so bad
// input never reaches the match/submit API as a request that fails downstream.
const countryCodeSchema = z
  .string()
  .min(1, "required")
  .refine(v => VALID_COUNTRY_CODES.has(v), {
    message: "invalidCountry",
  })

// A date of birth is historical, so the calendar is capped at today rather than
// floored (.claude/rules/date-inputs.md §4) — and the same rule is enforced here so
// an autofilled or programmatically-set future date cannot slip past the calendar.
const dateOfBirthSchema = z
  .string()
  .min(1, "required")
  .refine(isNotFutureDate, { message: "dateOfBirthInFuture" })

// registered_address.country is not collected as a separate field — the form
// reuses the top-level `country` value at submit time (see onValid) rather
// than asking for the same country twice. Per the design, street/city/
// postal_code are mandatory; state_region is optional.
const addressSchema = z.object({
  street: z.string().min(1, "required"),
  city: z.string().min(1, "required"),
  postal_code: z.string().min(1, "required"),
  state_region: z.string().optional(),
})

const legalEntitySchema = z.object({
  partner_type: z.literal(PartnerTypeSchema.enum.legal_entity),
  legal_name: z.string().min(1, "required"),
  legal_form: z.string().min(1, "required"),
  country: countryCodeSchema,
  tax_id_vat: z.string().optional(),
  lei: z
    .string()
    .optional()
    .refine(v => !v || isValidLei(v), {
      message: "leiInvalid",
    }),
  commercial_register_no: z.string().optional(),
  registered_address: addressSchema,
})

const naturalPersonSchema = z.object({
  partner_type: z.literal(PartnerTypeSchema.enum.natural_person),
  full_name: z.string().min(1, "required"),
  date_of_birth: dateOfBirthSchema,
  place_of_birth: z.string().min(1, "required"),
  country: countryCodeSchema,
  birth_name: z.string().optional(),
  national_id: z.string().optional(),
  registered_address: addressSchema,
})

const soleProprietorSchema = z.object({
  partner_type: z.literal(PartnerTypeSchema.enum.registered_sole_trader),
  full_name: z.string().min(1, "required"),
  date_of_birth: dateOfBirthSchema,
  country: countryCodeSchema,
  tax_id_vat: z.string().optional(),
  commercial_register_no: z.string().optional(),
  registered_address: addressSchema,
})

type LegalEntityForm = z.infer<typeof legalEntitySchema>
type NaturalPersonForm = z.infer<typeof naturalPersonSchema>
type SoleProprietorForm = z.infer<typeof soleProprietorSchema>
type IdentityForm = LegalEntityForm | NaturalPersonForm | SoleProprietorForm

function schemaForType(type: PartnerType) {
  if (type === PartnerTypeSchema.enum.natural_person) return naturalPersonSchema
  if (type === PartnerTypeSchema.enum.registered_sole_trader)
    return soleProprietorSchema
  return legalEntitySchema
}

// `reset` takes a deep-partial (DefaultValues), which is exactly what a blank form
// is — typing it that way avoids casting an incomplete object to the full union.
function blankFormFor(type: PartnerType): DefaultValues<IdentityForm> {
  return {
    partner_type: type,
    registered_address: BLANK_ADDRESS,
  } as DefaultValues<IdentityForm>
}

// What the user typed, kept by the parent so returning to the form — after a failed match
// or after cancelling the review — restores the input instead of a blank slate. The form
// unmounts while the review is on screen, so its own state cannot survive that.
type PartnerSubmitFormDraft = DefaultValues<IdentityForm>

type SubmitResult = {
  identity: PartnerIdentityInput
  draft: PartnerSubmitFormDraft
  dealerNumbers: string[]
  bankAccounts: AccountFormValues[]
}

type PartnerSubmitFormProps = {
  formId: string
  onSubmit: (result: SubmitResult) => void
  initialDraft?: PartnerSubmitFormDraft | null
}

// Backs the Dealer number section below — not a wire field on any identity shape yet (see
// api/schema.ts), so it's local UI state rather than on the RHF form, kept out of the
// match/submit payload beyond the non-empty values threaded through onValid. The list starts
// with one blank entry; "Add new …" appends another. Keyed by a generated id, not array
// index, since entries are only ever appended.
type EditableEntry = { id: string; value: string }

// Enforced client-side against LcNumberCreateRequest.lc_number's backend regex — blank
// entries are dropped on submit (see onValid below), so only a non-blank, malformed
// value counts as invalid.
function isDealerNumberInvalid(value: string): boolean {
  return value.trim() !== "" && !isValidLcNumber(value)
}

function useEditableEntryList(): {
  entries: EditableEntry[]
  handleChange: (id: string, value: string) => void
  handleAdd: () => void
} {
  const [entries, setEntries] = useState<EditableEntry[]>([
    { id: crypto.randomUUID(), value: "" },
  ])

  function handleChange(id: string, value: string) {
    setEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, value } : entry))
    )
  }

  function handleAdd() {
    setEntries(prev => [...prev, { id: crypto.randomUUID(), value: "" }])
  }

  return { entries, handleChange, handleAdd }
}

type EditableEntryTableProps = {
  sectionTitle: string
  entriesColumnLabel: string
  addButtonLabel: string
  placeholder: string
  entries: EditableEntry[]
  testIdPrefix: string
  onChange: (id: string, value: string) => void
  onAdd: () => void
  isEntryInvalid?: (value: string) => boolean
  invalidHint?: string
}

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid pattern
// used by other list tables in this codebase (ProductTemplateTable, PartnerTable, TenantTable,
// AuditTable), per the same styling ProductTemplateListPage uses.
function EditableEntryTable({
  sectionTitle,
  entriesColumnLabel,
  addButtonLabel,
  placeholder,
  entries,
  testIdPrefix,
  onChange,
  onAdd,
  isEntryInvalid,
  invalidHint,
}: EditableEntryTableProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="bg-muted px-4 py-2 gap-0">
        <CardTitle className="text-xs">{sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <div
          className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
          data-testid={`${testIdPrefix}-table`}
        >
          <div className="flex border-b border-border h-10 items-center justify-between px-2">
            <span className="text-sm font-medium text-foreground">
              {entriesColumnLabel}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid={`add-${testIdPrefix}-button`}
              onClick={onAdd}
            >
              <Plus size={16} />
              {addButtonLabel}
            </Button>
          </div>

          {entries.map((entry, index) => {
            const showError = isEntryInvalid?.(entry.value) ?? false
            return (
              <div
                key={entry.id}
                className="flex flex-col justify-center gap-1 border-b border-border last:border-b-0 min-h-[52px] px-2 py-1.5"
              >
                <Input
                  className="w-full border-transparent focus-visible:border-transparent"
                  data-testid={`field-${testIdPrefix}-${index}`}
                  placeholder={placeholder}
                  value={entry.value}
                  error={showError}
                  onChange={e => onChange(entry.id, e.target.value)}
                />
                {showError && invalidHint && (
                  <p className="text-xs text-destructive">{invalidHint}</p>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function PartnerSubmitForm({
  formId,
  onSubmit,
  initialDraft,
}: PartnerSubmitFormProps) {
  const { t } = useTranslation("partners")
  const [partnerType, setPartnerType] = useState<PartnerType>(
    (initialDraft?.partner_type as PartnerType | undefined) ??
      PartnerTypeSchema.enum.legal_entity
  )

  const {
    entries: dealerNumbers,
    handleChange: handleDealerNumberChange,
    handleAdd: handleAddDealerNumber,
  } = useEditableEntryList()
  // Dealer number errors only surface after a submit attempt, matching RHF's own
  // default (onSubmit) validation timing for the fields it manages.
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  // Lifted out of AccountsSection so the entries survive through to
  // submitMutation.onSuccess in SubmitPartnerPage, same as dealerNumbers above.
  const [accounts, setAccounts] = useState<Account[]>([])

  function handleAddAccount(values: AccountFormValues) {
    setAccounts(prev => [...prev, { ...values, id: crypto.randomUUID() }])
  }

  function handleEditAccount(id: string, values: AccountFormValues) {
    setAccounts(prev =>
      prev.map(account => (account.id === id ? { ...values, id } : account))
    )
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IdentityForm>({
    resolver: (values, context, options) =>
      zodResolver(schemaForType(partnerType))(values, context, options),
    defaultValues:
      initialDraft ?? blankFormFor(PartnerTypeSchema.enum.legal_entity),
  })

  const country = useWatch({
    control,
    name: "country" as keyof IdentityForm,
  }) as string | undefined
  // Autofill (or any non-selection input) can put a non-string or malformed
  // value into the free-typeable Country combobox before it's committed —
  // guard the type here rather than assume useWatch always returns a string.
  const isCommercialRegisterFieldEditable = isCommercialRegisterApplicable(
    partnerType,
    typeof country === "string" ? country : null
  )

  function handleTypeChange(type: PartnerType) {
    // Deferred so the closing entity-type dropdown finishes its own
    // close/focus-restore cycle before the form fields underneath it get
    // swapped out — otherwise the two races and clicks right after switching
    // land on nothing (same class of issue as mui/base-ui#3149).
    setTimeout(() => {
      setPartnerType(type)
      // Full reset rather than carrying values forward — switching entity
      // type starts the form over from a clean slate.
      reset(blankFormFor(type))
    }, 0)
  }

  function onValid(values: IdentityForm) {
    if (dealerNumbers.some(entry => isDealerNumberInvalid(entry.value))) return

    const { registered_address, ...rest } = values
    // No reset here: the parent swaps this form out for the matching review, and on the way
    // back it hands the same values in as `initialDraft`. Clearing them made a failed match
    // — or a cancelled review — look like the whole entry had to be retyped.
    onSubmit({
      identity: {
        ...blankToUndefined(rest),
        registered_address: blankToUndefined({
          ...registered_address,
          country: rest.country,
        }),
      } as PartnerIdentityInput,
      draft: values as PartnerSubmitFormDraft,
      dealerNumbers: dealerNumbers
        .map(entry => entry.value.trim())
        .filter(value => value.length > 0),
      bankAccounts: accounts.map(account => ({
        iban: account.iban,
        account_number: account.account_number,
        holder_name: account.holder_name,
        bank_name: account.bank_name,
        bic: account.bic,
      })),
    })
  }

  const isLegalEntity = partnerType === PartnerTypeSchema.enum.legal_entity

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
            captionLayout="dropdown"
            error={"date_of_birth" in errors && !!errors.date_of_birth}
          />
        )}
      />
      {"date_of_birth" in errors && errors.date_of_birth && (
        <p className="text-xs text-destructive">
          {t(
            `submit.form.errors.${errors.date_of_birth.message}` as "submit.form.errors.required"
          )}
        </p>
      )}
    </div>
  )

  return (
    <form
      id={formId}
      onSubmit={event => {
        setHasAttemptedSubmit(true)
        void handleSubmit(onValid)(event)
      }}
      className="flex flex-col gap-4"
    >
      {/* NOTE: raw <input type="hidden"> — no shadcn equivalent for a hidden
          field; used only to include partner_type in native form submission. */}
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
                  {t(
                    `submit.form.errors.${errors.legal_name.message}` as "submit.form.errors.required"
                  )}
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
                    {t(
                      `submit.form.errors.${errors.full_name.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
              </div>
              {partnerType === PartnerTypeSchema.enum.natural_person && (
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
                {"legal_form" in errors && errors.legal_form && (
                  <p className="text-xs text-destructive">
                    {t(
                      `submit.form.errors.${errors.legal_form.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
              </div>
            ) : (
              dateOfBirthField
            )}
            {entityTypeField}
          </div>

          {partnerType === PartnerTypeSchema.enum.natural_person && (
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
                  {t(
                    `submit.form.errors.${errors.place_of_birth.message}` as "submit.form.errors.required"
                  )}
                </p>
              )}
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
                key={partnerType}
                control={control}
                name={"country" as keyof IdentityForm}
                render={({ field }) => {
                  const selectedCountry =
                    COUNTRY_OPTIONS.find(o => o.value === field.value) ?? null
                  return (
                    <Combobox
                      items={COUNTRY_OPTIONS}
                      value={selectedCountry}
                      onValueChange={option =>
                        field.onChange(option?.value ?? "")
                      }
                    >
                      <ComboboxInput
                        id="country"
                        data-testid="field-country"
                        placeholder={t("list.filters.countrySearchPlaceholder")}
                        showClear
                        onFocus={selectOnFocus}
                      />
                      <ComboboxContent>
                        <ComboboxList>
                          <ComboboxEmpty>
                            {t("list.filters.noCountriesFound")}
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
              {"country" in errors && errors.country && (
                <p className="text-xs text-destructive">
                  {t(
                    `submit.form.errors.${errors.country.message}` as "submit.form.errors.required"
                  )}
                </p>
              )}
            </div>
            {partnerType === PartnerTypeSchema.enum.natural_person ? (
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
                  disabled={!isCommercialRegisterFieldEditable}
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
                    {t(
                      `submit.form.errors.${errors.lei.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("submit.form.hints.leiFormat")}
                </p>
              </div>
            </div>
          )}

          {partnerType === PartnerTypeSchema.enum.registered_sole_trader && (
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
        <CardContent
          key={partnerType}
          className="px-4 py-4 flex flex-col gap-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="street">
                {t("submit.identityStep.fields.street")}
              </Label>
              <Input
                id="street"
                data-testid="field-street"
                {...register("registered_address.street" as keyof IdentityForm)}
              />
              {"registered_address" in errors &&
                errors.registered_address?.street && (
                  <p className="text-xs text-destructive">
                    {t(
                      `submit.form.errors.${errors.registered_address.street.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">
                {t("submit.identityStep.fields.city")}
              </Label>
              <Input
                id="city"
                data-testid="field-city"
                {...register("registered_address.city" as keyof IdentityForm)}
              />
              {"registered_address" in errors &&
                errors.registered_address?.city && (
                  <p className="text-xs text-destructive">
                    {t(
                      `submit.form.errors.${errors.registered_address.city.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postal_code">
                {t("submit.identityStep.fields.postalCode")}
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
                    {t(
                      `submit.form.errors.${errors.registered_address.postal_code.message}` as "submit.form.errors.required"
                    )}
                  </p>
                )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="state_region">
                {t("submit.identityStep.fields.stateRegion")}{" "}
                <span className="text-muted-foreground">
                  ({t("submit.form.optional")})
                </span>
              </Label>
              <Input
                id="state_region"
                data-testid="field-state_region"
                {...register(
                  "registered_address.state_region" as keyof IdentityForm
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Both sections are legal_entity-only: neither Händlernummer nor Accounts applies to
          a natural person or a registered sole trader. */}
      {isLegalEntity && (
        <>
          <EditableEntryTable
            sectionTitle={t("submit.form.sections.dealerNumber")}
            entriesColumnLabel={t("submit.form.entriesColumn")}
            addButtonLabel={t("submit.form.addDealerNumberButton")}
            placeholder={t("submit.form.dealerNumberPlaceholder")}
            entries={dealerNumbers}
            testIdPrefix="dealer-number"
            onChange={handleDealerNumberChange}
            onAdd={handleAddDealerNumber}
            isEntryInvalid={
              hasAttemptedSubmit ? isDealerNumberInvalid : undefined
            }
            invalidHint={t("submit.form.errors.invalidDealerNumber")}
          />

          <AccountsSection
            accounts={accounts}
            onAdd={handleAddAccount}
            onEdit={handleEditAccount}
          />
        </>
      )}
    </form>
  )
}

export { PartnerSubmitForm }
export type { SubmitResult, PartnerSubmitFormDraft }
