import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PartnerType } from "@/features/partners/api/schema"
import type { PartnerIdentityInput } from "@/features/partners/api/partnersApi"

// ── Form schemas ──────────────────────────────────────────────────────────────

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
})

const legalEntitySchema = z.object({
  partner_type: z.literal("legal_entity"),
  legal_name: z.string().min(1, "Required"),
  legal_form: z.string().optional(),
  country: z.string().min(1, "Required"),
  tax_id_vat: z.string().optional(),
  lei: z.string().optional(),
  commercial_register_no: z.string().optional(),
  foreign_identifier: z.string().optional(),
  registered_address: addressSchema.optional(),
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
})

const soleProprietorSchema = z.object({
  partner_type: z.literal("sole_proprietor"),
  full_name: z.string().min(1, "Required"),
  date_of_birth: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  tax_id_vat: z.string().optional(),
  commercial_register_no: z.string().optional(),
  registered_address: addressSchema.optional(),
})

type LegalEntityForm = z.infer<typeof legalEntitySchema>
type NaturalPersonForm = z.infer<typeof naturalPersonSchema>
type SoleProprietorForm = z.infer<typeof soleProprietorSchema>

type IdentityForm = LegalEntityForm | NaturalPersonForm | SoleProprietorForm

type PartnerIdentityStepProps = {
  partnerType: PartnerType
  defaultValues?: Partial<PartnerIdentityInput>
  onNext: (identity: PartnerIdentityInput) => void
  onBack: () => void
}

function PartnerIdentityStep({
  partnerType,
  defaultValues,
  onNext,
  onBack,
}: PartnerIdentityStepProps) {
  const { t } = useTranslation("partners")

  const schema =
    partnerType === "legal_entity"
      ? legalEntitySchema
      : partnerType === "natural_person"
        ? naturalPersonSchema
        : soleProprietorSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentityForm>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? ({ partner_type: partnerType, ...defaultValues } as IdentityForm)
      : ({ partner_type: partnerType } as IdentityForm),
  })

  function onSubmit(values: IdentityForm) {
    onNext(values as PartnerIdentityInput)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {t("submit.identityStep.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("submit.identityStep.subtitle")}
        </p>
      </div>

      <input type="hidden" {...register("partner_type")} />

      {/* Legal entity fields */}
      {partnerType === "legal_entity" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="legal_name">
              {t("submit.identityStep.fields.legalName")} *
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">
                {t("submit.identityStep.fields.country")} *
              </Label>
              <Input
                id="country"
                data-testid="field-country"
                placeholder="e.g. DE"
                {...register("country" as keyof IdentityForm)}
              />
              {"country" in errors && errors.country && (
                <p className="text-xs text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_id_vat">
                {t("submit.identityStep.fields.taxIdVat")}
              </Label>
              <Input
                id="tax_id_vat"
                data-testid="field-tax_id_vat"
                {...register("tax_id_vat" as keyof IdentityForm)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lei">{t("submit.identityStep.fields.lei")}</Label>
              <Input
                id="lei"
                data-testid="field-lei"
                {...register("lei" as keyof IdentityForm)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commercial_register_no">
                {t("submit.identityStep.fields.commercialRegisterNo")}
              </Label>
              <Input
                id="commercial_register_no"
                data-testid="field-commercial_register_no"
                {...register("commercial_register_no" as keyof IdentityForm)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="foreign_identifier">
                {t("submit.identityStep.fields.foreignIdentifier")}
              </Label>
              <Input
                id="foreign_identifier"
                data-testid="field-foreign_identifier"
                {...register("foreign_identifier" as keyof IdentityForm)}
              />
            </div>
          </div>
        </>
      )}

      {/* Natural person fields */}
      {partnerType === "natural_person" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">
              {t("submit.identityStep.fields.fullName")} *
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date_of_birth">
                {t("submit.identityStep.fields.dateOfBirth")} *
              </Label>
              <Input
                id="date_of_birth"
                data-testid="field-date_of_birth"
                type="date"
                {...register("date_of_birth" as keyof IdentityForm)}
              />
              {"date_of_birth" in errors && errors.date_of_birth && (
                <p className="text-xs text-destructive">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="place_of_birth">
                {t("submit.identityStep.fields.placeOfBirth")} *
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">
                {t("submit.identityStep.fields.country")} *
              </Label>
              <Input
                id="country"
                data-testid="field-country"
                placeholder="e.g. DE"
                {...register("country" as keyof IdentityForm)}
              />
              {"country" in errors && errors.country && (
                <p className="text-xs text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
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
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="national_id">
              {t("submit.identityStep.fields.nationalId")}
            </Label>
            <Input
              id="national_id"
              data-testid="field-national_id"
              {...register("national_id" as keyof IdentityForm)}
            />
          </div>
        </>
      )}

      {/* Sole proprietor fields */}
      {partnerType === "sole_proprietor" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">
              {t("submit.identityStep.fields.fullName")} *
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date_of_birth">
                {t("submit.identityStep.fields.dateOfBirth")} *
              </Label>
              <Input
                id="date_of_birth"
                data-testid="field-date_of_birth"
                type="date"
                {...register("date_of_birth" as keyof IdentityForm)}
              />
              {"date_of_birth" in errors && errors.date_of_birth && (
                <p className="text-xs text-destructive">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">
                {t("submit.identityStep.fields.country")} *
              </Label>
              <Input
                id="country"
                data-testid="field-country"
                placeholder="e.g. DE"
                {...register("country" as keyof IdentityForm)}
              />
              {"country" in errors && errors.country && (
                <p className="text-xs text-destructive">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_id_vat">
                {t("submit.identityStep.fields.taxIdVat")}
              </Label>
              <Input
                id="tax_id_vat"
                data-testid="field-tax_id_vat"
                {...register("tax_id_vat" as keyof IdentityForm)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="commercial_register_no">
                {t("submit.identityStep.fields.commercialRegisterNo")}
              </Label>
              <Input
                id="commercial_register_no"
                data-testid="field-commercial_register_no"
                {...register("commercial_register_no" as keyof IdentityForm)}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" data-testid="identity-next">
          Next
        </Button>
      </div>
    </form>
  )
}

export { PartnerIdentityStep }
