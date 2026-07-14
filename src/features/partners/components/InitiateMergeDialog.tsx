import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MergeReasonCodeSchema } from "@/features/partners/api/schema"
import { MERGE_REASON_CODES } from "@/features/partners/constants"
import { useInitiateMerge } from "@/features/partners/hooks/useInitiateMerge"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import type {
  DuplicateCandidatePairResponse,
  PartnerDetailResponse,
} from "@/features/partners/api/schema"

const mergeSchema = z.object({
  merge_reason_code: MergeReasonCodeSchema,
  note: z.string().max(2000).optional(),
})
type MergeForm = z.infer<typeof mergeSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pair: DuplicateCandidatePairResponse
  survivorPartner: PartnerDetailResponse
  mergedSourcePartner: PartnerDetailResponse
  tenantId: string | null
}

function InitiateMergeDialog({
  open,
  onOpenChange,
  pair,
  survivorPartner,
  mergedSourcePartner,
  tenantId,
}: Props) {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const mutation = useInitiateMerge(tenantId)

  const {
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<MergeForm>({
    resolver: zodResolver(mergeSchema),
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: MergeForm) {
    mutation.mutate(
      {
        pair_id: pair.pair_id,
        survivor_partner_id: survivorPartner.partner_id,
        merge_reason_code: values.merge_reason_code,
        note: values.note || null,
      },
      {
        onSuccess: () => {
          toast.success(t("duplicates.initiateMergeDialog.success"))
          handleClose()
          navigate(PATHS.PENDING_APPROVALS)
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
            <DialogTitle>
              {t("duplicates.initiateMergeDialog.title")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {t("duplicates.initiateMergeDialog.subtitle")}
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("duplicates.initiateMergeDialog.summary.survivor")}
              </span>
              <span className="font-semibold text-foreground">
                {survivorPartner.display_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("duplicates.initiateMergeDialog.summary.mergedSource")}
              </span>
              <span className="text-foreground">
                {mergedSourcePartner.display_name}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="merge-reason-code">
              {t("duplicates.initiateMergeDialog.fields.reasonCode")}
            </Label>
            <Controller
              control={control}
              name="merge_reason_code"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="merge-reason-code"
                    data-testid="initiate-merge-reason-code-select"
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={t(
                        "duplicates.initiateMergeDialog.fields.reasonCodePlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {MERGE_REASON_CODES.map(code => (
                      <SelectItem key={code} value={code}>
                        {t(
                          `mergeReasonCode.${code}` as "mergeReasonCode.data_entry_error"
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.merge_reason_code ? (
              <p className="text-xs text-destructive">
                {t("duplicates.initiateMergeDialog.errors.reasonCodeRequired")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("duplicates.initiateMergeDialog.fields.reasonCodeHelper")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="merge-note">
              {t("duplicates.initiateMergeDialog.fields.note")}
            </Label>
            <Textarea
              id="merge-note"
              data-testid="initiate-merge-note"
              rows={3}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="initiate-merge-cancel"
          >
            {t("duplicates.initiateMergeDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="initiate-merge-submit"
          >
            {mutation.isPending
              ? t("duplicates.initiateMergeDialog.submitting")
              : t("duplicates.initiateMergeDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { InitiateMergeDialog }
