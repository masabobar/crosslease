import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// No wire counterpart yet (see AccountsSection) — validated locally rather than against an
// api/schema.ts shape. Only iban and account_number are mandatory per the field spec.
const accountFormSchema = z.object({
  iban: z.string().trim().min(1, "required"),
  account_number: z.string().trim().min(1, "required"),
  holder_name: z.string().trim(),
  bank_name: z.string().trim(),
  bic: z.string().trim(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

const EMPTY_ACCOUNT_FORM_VALUES: AccountFormValues = {
  iban: "",
  account_number: "",
  holder_name: "",
  bank_name: "",
  bic: "",
}

type AccountFormDialogProps = {
  mode: "add" | "edit"
  initialValues?: AccountFormValues
  onSave: (values: AccountFormValues) => void
  onOpenChange: (open: boolean) => void
}

function AccountFormDialog({
  mode,
  initialValues,
  onSave,
  onOpenChange,
}: AccountFormDialogProps) {
  const { t } = useTranslation("partners")
  const { t: tCommon } = useTranslation("common")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: initialValues ?? EMPTY_ACCOUNT_FORM_VALUES,
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: AccountFormValues) {
    onSave({
      iban: values.iban.trim(),
      account_number: values.account_number.trim(),
      holder_name: values.holder_name.trim(),
      bank_name: values.bank_name.trim(),
      bic: values.bic.trim(),
    })
    handleClose()
  }

  function resolveMessage(message: string | undefined): string | undefined {
    if (!message) return undefined
    if (message === "required") return tCommon("validation.required")
    return message
  }

  return (
    <DialogModal open onOpenChange={open => !open && handleClose()}>
      {/* React re-parents portalled content in its own tree for event bubbling, so a plain
          onSubmit here would also fire PartnerSubmitForm's outer <form onSubmit>, submitting
          the whole partner form (and triggering match) just from saving this dialog. */}
      <form
        onSubmit={event => {
          event.stopPropagation()
          void handleSubmit(onSubmit)(event)
        }}
      >
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {mode === "add"
                ? t("submit.form.accountDialog.addTitle")
                : t("submit.form.accountDialog.editTitle")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <Label
              htmlFor="account-iban"
              error={!!errors.iban}
              className="mb-2"
            >
              {t("submit.form.accountDialog.fields.iban")}
            </Label>
            <Input
              id="account-iban"
              data-testid="account-iban-input"
              error={!!errors.iban}
              {...register("iban")}
            />
            {errors.iban && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.iban.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="account-number"
              error={!!errors.account_number}
              className="mb-2"
            >
              {t("submit.form.accountDialog.fields.accountNumber")}
            </Label>
            <Input
              id="account-number"
              data-testid="account-number-input"
              error={!!errors.account_number}
              {...register("account_number")}
            />
            {errors.account_number && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.account_number.message)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="account-holder-name" className="mb-2">
              {t("submit.form.accountDialog.fields.holderName")}
            </Label>
            <Input
              id="account-holder-name"
              data-testid="account-holder-name-input"
              {...register("holder_name")}
            />
          </div>

          <div>
            <Label htmlFor="account-bank-name" className="mb-2">
              {t("submit.form.accountDialog.fields.bankName")}
            </Label>
            <Input
              id="account-bank-name"
              data-testid="account-bank-name-input"
              {...register("bank_name")}
            />
          </div>

          <div>
            <Label htmlFor="account-bic" className="mb-2">
              {t("submit.form.accountDialog.fields.bic")}
            </Label>
            <Input
              id="account-bic"
              data-testid="account-bic-input"
              {...register("bic")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="account-dialog-cancel"
            onClick={handleClose}
          >
            {t("submit.form.cancel")}
          </Button>
          <Button type="submit" data-testid="account-dialog-save">
            {t("submit.form.accountDialog.save")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { AccountFormDialog }
export type { AccountFormValues }
