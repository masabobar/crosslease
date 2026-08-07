import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useUpdateLicenceLimits } from "@/features/tenants/hooks/useUpdateLicenceLimits"
import { EditLicenceLimitsFormSchema } from "@/features/tenants/api/schema"
import type { EditLicenceLimitsForm } from "@/features/tenants/api/schema"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  tenantName: string
  maxLcCount: number
  maxBankUserCount: number
  maxUsersPerLc: number
  lcUtilisation: number
  bankUserUtilisation: number
  lcUserHighestActive: number
}

export function EditLicenceLimitsDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
  maxLcCount,
  maxBankUserCount,
  maxUsersPerLc,
  lcUtilisation,
  bankUserUtilisation,
  lcUserHighestActive,
}: Props) {
  const { t } = useTranslation("tenants")
  const mutation = useUpdateLicenceLimits(tenantId)

  // Clearing a `valueAsNumber` input yields NaN, which Zod reports as an
  // invalid_type rather than a range failure — "Minimum value is 1" would be a
  // confusing thing to say about an empty box.
  function limitErrorMessage(error: { type?: string | number } | undefined) {
    if (!error) return null
    return error.type === "invalid_type"
      ? t("detail.licenceLimits.editDialog.errors.required")
      : t("detail.licenceLimits.editDialog.errors.minValue")
  }

  const {
    setError,
    getValues,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditLicenceLimitsForm>({
    resolver: zodResolver(EditLicenceLimitsFormSchema),
    defaultValues: {
      max_lc_count: maxLcCount,
      max_bank_user_count: maxBankUserCount,
      max_users_per_lc: maxUsersPerLc,
    },
  })

  const handleError = useTenantFormErrorHandler({ getValues, setError })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: EditLicenceLimitsForm) {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success(t("detail.licenceLimits.editDialog.successToast.title"), {
          description: t(
            "detail.licenceLimits.editDialog.successToast.description",
            { tenantName }
          ),
        })
        handleClose()
      },
      onError: handleError,
    })
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {t("detail.licenceLimits.editDialog.title")}
            </DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-5 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-lc-count" className="text-sm font-medium">
                {t("detail.licenceLimits.leasingCompanies.title")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("detail.licenceLimits.editDialog.currentActive", {
                  count: lcUtilisation,
                })}
              </span>
            </div>
            <Input
              id="max-lc-count"
              type="number"
              min={1}
              data-testid="input-max-lc-count"
              {...register("max_lc_count", { valueAsNumber: true })}
            />
            {errors.max_lc_count && (
              <p className="text-sm text-destructive" role="alert">
                {limitErrorMessage(errors.max_lc_count)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="max-bank-user-count"
                className="text-sm font-medium"
              >
                {t("detail.licenceLimits.bankUsers.title")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("detail.licenceLimits.editDialog.currentActive", {
                  count: bankUserUtilisation,
                })}
              </span>
            </div>
            <Input
              id="max-bank-user-count"
              type="number"
              min={1}
              data-testid="input-max-bank-user-count"
              {...register("max_bank_user_count", { valueAsNumber: true })}
            />
            {errors.max_bank_user_count && (
              <p className="text-sm text-destructive" role="alert">
                {limitErrorMessage(errors.max_bank_user_count)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-users-per-lc" className="text-sm font-medium">
                {t("detail.licenceLimits.usersPerLc.title")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("detail.licenceLimits.editDialog.highestActive", {
                  count: lcUserHighestActive,
                })}
              </span>
            </div>
            <Input
              id="max-users-per-lc"
              type="number"
              min={1}
              data-testid="input-max-users-per-lc"
              {...register("max_users_per_lc", { valueAsNumber: true })}
            />
            {errors.max_users_per_lc && (
              <p className="text-sm text-destructive" role="alert">
                {limitErrorMessage(errors.max_users_per_lc)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || mutation.isPending}
            data-testid="edit-limits-cancel"
          >
            {t("detail.licenceLimits.editDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            data-testid="edit-limits-submit"
          >
            {mutation.isPending
              ? t("detail.licenceLimits.editDialog.submitting")
              : t("detail.licenceLimits.editDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}
