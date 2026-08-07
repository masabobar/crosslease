import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SelectField } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { FieldMessage } from "@/features/users/components/FieldMessage"
import {
  AUDITOR_PERIOD_UPDATE_REASONS,
  AuditorPeriodFormSchema,
  type AuditorPeriodFormValues,
  type AuditorPeriodUpdateReason,
} from "@/features/users/api/schema"
import { AUDITOR_ROLE } from "@/features/users/types"
import { formatDate } from "@/lib/formatters"

type Props = {
  open: boolean
  currentAccessValidUntil: string | null
  activatedAt: string | null
  isPending: boolean
  onClose: () => void
  /** Rejections propagate here so field-level detail lands on the offending input. */
  onSubmit: (values: AuditorPeriodFormValues) => Promise<void>
}

export function EditAuditorPeriodDialog({
  open,
  currentAccessValidUntil,
  activatedAt,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation("users")

  const form = useForm<AuditorPeriodFormValues>({
    resolver: zodResolver(AuditorPeriodFormSchema),
    defaultValues: { new_access_valid_until: "", reason: undefined },
  })

  const selectedReason = useWatch({ control: form.control, name: "reason" })
  const selectedDate = useWatch({
    control: form.control,
    name: "new_access_valid_until",
  })

  const reasonOptions = AUDITOR_PERIOD_UPDATE_REASONS.map(r => ({
    value: r,
    label: t(`detail.page.editRole.reasons.${r}`),
  }))

  const accessPeriodDisplay = (() => {
    const from = activatedAt ? formatDate(activatedAt) : null
    const until = currentAccessValidUntil
      ? formatDate(currentAccessValidUntil)
      : null
    if (from && until) return `${from} - ${until}`
    return until ?? "—"
  })()

  function handleClose() {
    form.reset()
    onClose()
  }

  async function handleSubmit(values: AuditorPeriodFormValues) {
    try {
      await onSubmit(values)
    } catch (err) {
      if (
        applyApiFieldErrors({
          error: err,
          fields: Object.keys(form.getValues()),
          setError: form.setError,
        })
      )
        return

      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) handleClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[480px] sm:max-w-[480px] gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <DialogTitle>
            {t("detail.page.editRole.accessPeriodTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="px-4 py-4 flex flex-col gap-6">
            {/* Current role + separator + date section */}
            <div className="flex flex-col gap-4">
              {/* Current role row */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {t("detail.page.editRole.currentRole")}
                </span>
                <RoleBadge role={AUDITOR_ROLE} />
              </div>

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Access valid period (read-only) */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {t("detail.page.editRole.accessValidPeriod")}
                </span>
                <span className="text-muted-foreground">
                  {accessPeriodDisplay}
                </span>
              </div>

              {/* New date picker */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("detail.page.editRole.accessValidUntil")}
                </span>
                <DatePicker
                  data-testid="edit-auditor-period-date-picker"
                  value={selectedDate || undefined}
                  onChange={v =>
                    form.setValue("new_access_valid_until", v, {
                      shouldValidate: true,
                    })
                  }
                  placeholder={t("detail.page.editRole.selectDate")}
                  minDate={new Date()}
                  error={!!form.formState.errors.new_access_valid_until}
                  captionLayout="dropdown"
                />
                <FieldMessage
                  error={form.formState.errors.new_access_valid_until}
                  data-testid="edit-auditor-period-date-error"
                />
              </div>
            </div>

            {/* Footer alert boxes */}
            <div className="flex flex-col gap-2">
              {/* Reason for change — amber alert box */}
              <div className="rounded-xl bg-amber-500/10 px-[10px] py-2 flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t("detail.page.editRole.reasonLabel")}
                </span>
                <SelectField
                  data-testid="edit-auditor-period-reason-select"
                  value={selectedReason ?? ""}
                  onValueChange={v =>
                    form.setValue("reason", v as AuditorPeriodUpdateReason, {
                      shouldValidate: true,
                    })
                  }
                  options={reasonOptions}
                  placeholder={t("detail.page.editRole.selectReason")}
                  error={!!form.formState.errors.reason}
                  className="bg-card"
                />
                {/* Error replaces the standing hint, matching EditRoleScopeDialog. */}
                {form.formState.errors.reason ? (
                  <FieldMessage
                    error={form.formState.errors.reason}
                    data-testid="edit-auditor-period-reason-error"
                  />
                ) : (
                  <span className="text-sm text-amber-600/80">
                    {t("detail.page.editRole.reasonMandatory")}
                  </span>
                )}
              </div>

              {/* Four-Eyes approval notice */}
              <Alert variant="warning" className="rounded-xl px-[10px]">
                <ShieldAlert />
                <AlertTitle>
                  {t("detail.page.editRole.fourEyes.title")}
                </AlertTitle>
                <AlertDescription>
                  {t("detail.page.editRole.fourEyes.description")}
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
              data-testid="edit-auditor-period-cancel-button"
            >
              {t("detail.page.actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedDate || !selectedReason}
              data-testid="edit-auditor-period-submit-button"
            >
              {t("detail.page.editRole.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
