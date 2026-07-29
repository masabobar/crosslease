import type { UseFormReturn } from "react-hook-form"
import { Controller, useFormState } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { startOfToday } from "date-fns"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { isFrameworkAgreementDraft } from "@/features/frameworkAgreements/editWizard"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
} from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<EditFrameworkAgreementFormValues>
  frameworkAgreement: FADetailResponse
}

function EditIdentityStep({ form, frameworkAgreement }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { register, control } = form
  const { errors } = useFormState({ control })
  const resolveMsg = useResolveFrameworkAgreementFieldError()

  // agreement_name and valid_from are rejected as FA_IMMUTABLE_FIELDS once the agreement
  // leaves Draft, so they are shown read-only rather than hidden — the values stay
  // visible in context while editing.
  const identityLocked = !isFrameworkAgreementDraft(frameworkAgreement)
  // Only ever applies to drafts: the field is disabled once identity is locked, so an
  // agreement that legitimately started in the past is unaffected.
  const today = startOfToday()

  return (
    <div
      className="border border-border rounded-xl bg-background p-4 flex flex-col gap-6"
      data-testid="edit-fa-identity-step"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="edit_agreement_name"
            error={!!errors.agreement_name}
            className="mb-2"
          >
            {t("fields.agreementName")}
          </Label>
          <Input
            id="edit_agreement_name"
            data-testid="edit-agreement-name-input"
            disabled={identityLocked}
            error={!!errors.agreement_name}
            {...register("agreement_name")}
          />
          {!identityLocked && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("wizard.identity.agreementNameHint")}
            </p>
          )}
          {errors.agreement_name && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.agreement_name.message)}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="edit_valid_from"
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
                id="edit_valid_from"
                data-testid="edit-valid-from-datepicker"
                value={field.value}
                onChange={field.onChange}
                disabled={identityLocked}
                error={!!errors.valid_from}
                minDate={today}
                captionLayout="dropdown"
              />
            )}
          />
          {errors.valid_from && (
            <p className="mt-1 text-sm text-destructive">
              {resolveMsg(errors.valid_from.message)}
            </p>
          )}
        </div>
      </div>

      {identityLocked && (
        <p className="-mt-3 text-xs text-muted-foreground">
          {t("edit.lockedFieldHint")}
        </p>
      )}

      {/* Counterparty and currency are fixed at creation — UpdateFARequest accepts
          neither, so they are read-only for reference. */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_lc_partner" className="mb-2">
            {t("fields.leasingCompany")}
          </Label>
          <Input
            id="edit_lc_partner"
            data-testid="edit-lc-partner-input"
            value={frameworkAgreement.lc_partner_name ?? "—"}
            disabled
            readOnly
          />
        </div>

        <div>
          <Label htmlFor="edit_currency" className="mb-2">
            {t("fields.currency")}
          </Label>
          <Input
            id="edit_currency"
            data-testid="edit-currency-input"
            value={frameworkAgreement.currency}
            disabled
            readOnly
          />
        </div>
      </div>
    </div>
  )
}

export { EditIdentityStep }
