import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
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
import {
  DuplicateResolutionDecisionSchema,
  DuplicateResolutionReasonCodeSchema,
} from "@/features/partners/api/schema"
import { DUPLICATE_RESOLUTION_REASON_CODES } from "@/features/partners/constants"
import { useResolveDuplicatePair } from "@/features/partners/hooks/useResolveDuplicatePair"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import type { DuplicateCandidatePairResponse } from "@/features/partners/api/schema"

const DECISION_OPTIONS = DuplicateResolutionDecisionSchema.options

const resolveSchema = z.object({
  decision: DuplicateResolutionDecisionSchema,
  reason_code: DuplicateResolutionReasonCodeSchema,
  note: z.string().max(2000).optional(),
})
type ResolveForm = z.infer<typeof resolveSchema>

const SUCCESS_TOAST_KEY: Record<ResolveForm["decision"], string> = {
  confirmed_duplicate: "duplicates.resolveDialog.success.confirmedDuplicate",
  confirmed_distinct: "duplicates.resolveDialog.success.confirmedDistinct",
  deferred: "duplicates.resolveDialog.success.deferred",
}

// Matches the alert style shown per decision in the Figma design (node 50:6749,
// "Resolve duplicate - ALERTS"): confirmed_duplicate is a warning-toned alert,
// confirmed_distinct is success-toned, deferred is info-toned.
const TOAST_VARIANT: Record<
  ResolveForm["decision"],
  "warning" | "success" | "info"
> = {
  confirmed_duplicate: "warning",
  confirmed_distinct: "success",
  deferred: "info",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pair: DuplicateCandidatePairResponse
  tenantId: string | null
}

function ResolveDuplicateDialog({ open, onOpenChange, pair, tenantId }: Props) {
  const { t } = useTranslation("partners")
  const mutation = useResolveDuplicatePair(tenantId)

  const {
    setError,
    getValues,
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<ResolveForm>({
    resolver: zodResolver(resolveSchema),
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: ResolveForm) {
    mutation.mutate(
      {
        pairId: pair.pair_id,
        body: {
          decision: values.decision,
          reason_code: values.reason_code,
          note: values.note || null,
        },
      },
      {
        onSuccess: () => {
          toast[TOAST_VARIANT[values.decision]](
            t(SUCCESS_TOAST_KEY[values.decision] as never)
          )
          handleClose()
        },
        onError: err => {
          if (
            applyApiFieldErrors({
              error: err,
              fields: Object.keys(getValues()),
              setError,
            })
          )
            return

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
            <DialogTitle>{t("duplicates.resolveDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            {t("duplicates.resolveDialog.subtitle")}
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolve-decision">
              {t("duplicates.resolveDialog.fields.decision")}
            </Label>
            <Controller
              control={control}
              name="decision"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="resolve-decision"
                    data-testid="resolve-decision-select"
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={t(
                        "duplicates.resolveDialog.fields.decisionPlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_OPTIONS.map(decision => (
                      <SelectItem key={decision} value={decision}>
                        {t(
                          `duplicates.pairStatus.${decision}` as "duplicates.pairStatus.pending"
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.decision && (
              <p className="text-xs text-destructive">
                {t("duplicates.resolveDialog.errors.decisionRequired")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolve-reason-code">
              {t("duplicates.resolveDialog.fields.reasonCode")}
            </Label>
            <Controller
              control={control}
              name="reason_code"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="resolve-reason-code"
                    data-testid="resolve-reason-code-select"
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={t(
                        "duplicates.resolveDialog.fields.reasonCodePlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {DUPLICATE_RESOLUTION_REASON_CODES.map(code => (
                      <SelectItem key={code} value={code}>
                        {t(
                          `duplicates.resolutionReasonCode.${code}` as "duplicates.resolutionReasonCode.data_entry_error"
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.reason_code && (
              <p className="text-xs text-destructive">
                {t("duplicates.resolveDialog.errors.reasonCodeRequired")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="resolve-note">
              {t("duplicates.resolveDialog.fields.note")}
            </Label>
            <Textarea
              id="resolve-note"
              data-testid="resolve-note"
              rows={3}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-muted/40 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="resolve-cancel"
          >
            {t("duplicates.resolveDialog.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="resolve-submit"
          >
            {mutation.isPending
              ? t("duplicates.resolveDialog.submitting")
              : t("duplicates.resolveDialog.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { ResolveDuplicateDialog }
