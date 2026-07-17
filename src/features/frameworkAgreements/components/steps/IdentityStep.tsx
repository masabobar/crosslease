import { useState } from "react"
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
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { BankEntitySchema } from "@/features/frameworkAgreements/api/schema"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"
import { useLcPartnerOptions } from "@/features/frameworkAgreements/hooks/useLcPartnerOptions"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
}

function IdentityStep({ form }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { register, control, setValue } = form
  const { errors } = useFormState({ control })
  const { data: currentUser } = useCurrentUser()
  const resolveMsg = useResolveFrameworkAgreementFieldError()

  const [lcSearch, setLcSearch] = useState("")
  const { options: lcOptions } = useLcPartnerOptions(
    currentUser?.tenant_id ?? null,
    lcSearch
  )

  return (
    <div
      className="border border-border rounded-xl bg-background p-4 flex flex-col gap-6"
      data-testid="fa-identity-step"
    >
      <div>
        <Label
          htmlFor="agreement_name"
          error={!!errors.agreement_name}
          className="mb-2"
        >
          {t("fields.agreementName")}
        </Label>
        <Input
          id="agreement_name"
          data-testid="agreement-name-input"
          error={!!errors.agreement_name}
          {...register("agreement_name")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("wizard.identity.agreementNameHint")}
        </p>
        {errors.agreement_name && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.agreement_name.message)}
          </p>
        )}
      </div>

      <div>
        <Label
          htmlFor="lc_partner_id"
          error={!!errors.lc_partner_id}
          className="mb-2"
        >
          {t("fields.leasingCompany")}
        </Label>
        <Controller
          control={control}
          name="lc_partner_id"
          render={({ field }) => {
            const selectedOption =
              lcOptions.find(o => o.value === field.value) ?? null
            return (
              <Combobox
                items={lcOptions}
                filter={null}
                value={selectedOption}
                onValueChange={option => {
                  field.onChange(option?.value ?? "")
                  setValue("lc_partner_name", option?.label ?? "")
                }}
                inputValue={lcSearch}
                onInputValueChange={setLcSearch}
              >
                <ComboboxInput
                  id="lc_partner_id"
                  data-testid="lc-partner-combobox"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxEmpty>
                      {t("fields.leasingCompanyNoResults")}
                    </ComboboxEmpty>
                    <ComboboxCollection>
                      {(option: { value: string; label: string }) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("wizard.identity.leasingCompanyHint")}
        </p>
        {errors.lc_partner_id && (
          <p className="mt-1 text-sm text-destructive">
            {resolveMsg(errors.lc_partner_id.message)}
          </p>
        )}
      </div>

      <div>
        <Label
          htmlFor="bank_entity"
          error={!!errors.bank_entity}
          className="mb-2"
        >
          {t("fields.bankEntity")}
        </Label>
        <Controller
          control={control}
          name="bank_entity"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="bank_entity" data-testid="bank-entity-select">
                <SelectValue>{t(`bankEntities.${field.value}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BankEntitySchema.options.map(entity => (
                  <SelectItem key={entity} value={entity}>
                    {t(`bankEntities.${entity}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="currency" className="mb-2">
          {t("fields.currency")}
        </Label>
        <Input
          id="currency"
          value="EUR"
          disabled
          data-testid="currency-input"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("wizard.identity.currencyHint")}
        </p>
      </div>
    </div>
  )
}

export { IdentityStep }
