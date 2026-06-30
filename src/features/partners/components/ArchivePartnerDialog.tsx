import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ShieldAlert, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { useArchivePartner } from "@/features/partners/hooks/useArchivePartner"
import {
  fetchArchiveEligibility,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { ApiError } from "@/lib/api"
import type { PartnerStatus } from "@/features/partners/api/schema"

const archiveSchema = z.object({
  reason: z.string().min(20),
  irreversibility_acknowledgement: z.boolean().refine(v => v === true),
})
type ArchiveForm = z.infer<typeof archiveSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  partnerStatus: PartnerStatus
}

function ArchivePartnerDialog({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  partnerStatus,
}: Props) {
  const { t } = useTranslation("partners")
  const mutation = useArchivePartner(partnerId)

  const { data: eligibility } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.archiveEligibility(partnerId),
    queryFn: () => fetchArchiveEligibility(partnerId),
    enabled: open,
  })

  const requiresFourEyes = eligibility?.requires_counter_confirmation ?? false

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ArchiveForm>({
    resolver: zodResolver(archiveSchema),
    defaultValues: { reason: "", irreversibility_acknowledgement: false },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ArchiveForm) {
    mutation.mutate(
      { reason: values.reason },
      {
        onSuccess: result => {
          if (result.is_immediate) {
            toast.success(t("archiveDialog.successImmediate"))
          } else {
            toast.info(t("archiveDialog.successPendingApproval"))
          }
          handleClose()
        },
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("archiveDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Partner</span>
            <span className="font-medium text-foreground">{partnerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <PartnerStatusBadge status={partnerStatus} />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="archive-reason">
                {t("archiveDialog.fields.reason")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t("archiveDialog.fields.reasonMinChars")}
              </span>
            </div>
            <Textarea
              id="archive-reason"
              data-testid="archive-reason"
              placeholder={t("archiveDialog.fields.reasonPlaceholder")}
              rows={4}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-destructive" role="alert">
                {t("archiveDialog.errors.reasonTooShort")}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Controller
              control={control}
              name="irreversibility_acknowledgement"
              render={({ field }) => (
                <Checkbox
                  data-testid="archive-irreversibility-ack"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <span className="text-sm text-foreground leading-snug">
              {t("archiveDialog.fields.irreversibilityAck.prefix")}
              <strong>
                {t("archiveDialog.fields.irreversibilityAck.emphasis")}
              </strong>
              {t("archiveDialog.fields.irreversibilityAck.suffix")}
            </span>
          </label>

          {requiresFourEyes && (
            <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-amber-500/10">
              <ShieldAlert
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <p className="text-sm text-amber-600">
                {t("archiveDialog.fourEyesNote")}
              </p>
            </div>
          )}

          <div className="flex gap-2 items-start px-2.5 py-2 rounded-xl bg-destructive/10">
            <TriangleAlert
              size={16}
              className="text-destructive shrink-0 mt-0.5"
            />
            <p className="text-sm text-destructive/80">
              {t("archiveDialog.description")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="archive-cancel"
          >
            {t("archiveDialog.cancel")}
          </Button>
          <Button
            type="submit"
            className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
            disabled={mutation.isPending}
            data-testid="archive-submit"
          >
            {mutation.isPending
              ? t("archiveDialog.submitting")
              : t("archiveDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { ArchivePartnerDialog }
