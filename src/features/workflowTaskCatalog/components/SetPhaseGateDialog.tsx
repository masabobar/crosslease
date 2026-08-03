import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useSetCasePhaseGate } from "@/features/workflowTaskCatalog/hooks/useSetCasePhaseGate"
import { PHASE_GATE_STATUS_OPTIONS } from "@/features/workflowTaskCatalog/constants"
import { PhaseGateStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { StageCategorization } from "@/features/workflowTaskCatalog/api/schema"

const setPhaseGateFormSchema = z.object({
  status: z.string().min(1, "required"),
  note: z.string(),
})

type SetPhaseGateFormValues = z.infer<typeof setPhaseGateFormSchema>

type Props = {
  businessObjectId: string
  phase: StageCategorization
  onOpenChange: (open: boolean) => void
}

function SetPhaseGateDialog({ businessObjectId, phase, onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const setGate = useSetCasePhaseGate()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors },
  } = useForm<SetPhaseGateFormValues>({
    resolver: zodResolver(setPhaseGateFormSchema),
    defaultValues: { status: "", note: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: SetPhaseGateFormValues) {
    setGate.mutate(
      {
        businessObjectId,
        phase,
        body: {
          status: PhaseGateStatusSchema.parse(values.status),
          note: values.note.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("caseChecklist.setGate.success"))
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

          // WTC_PHASE_GATE_INVALID_TRANSITION lands here — an approved gate is terminal, so a
          // second decision on it is refused. The panel already hides the control in that case;
          // this covers the race where another user approved it first.
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("caseChecklist.setGate.title")}</DialogTitle>
            <DialogDescription>
              {t("caseChecklist.setGate.subtitle", {
                phase: t(
                  `detail.taskSheet.stages.${phase}` as "detail.taskSheet.stages.pre_submission"
                ),
              })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <Label
              htmlFor="set-phase-gate-status"
              error={!!errors.status}
              className="mb-2"
            >
              {t("caseChecklist.setGate.fields.status")}
            </Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SelectField
                  id="set-phase-gate-status"
                  data-testid="set-phase-gate-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={PHASE_GATE_STATUS_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  placeholder={t(
                    "caseChecklist.setGate.fields.statusPlaceholder"
                  )}
                  error={!!errors.status}
                />
              )}
            />
            <p className="mt-2 text-sm text-muted-foreground opacity-80">
              {t("caseChecklist.setGate.fields.statusHint")}
            </p>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">
                {tCommon("validation.required")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="set-phase-gate-note" className="mb-2">
              {t("caseChecklist.setGate.fields.note")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("caseChecklist.setItemStatus.fields.optional")}
              </span>
            </Label>
            <Textarea
              id="set-phase-gate-note"
              data-testid="set-phase-gate-note-input"
              rows={3}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="set-phase-gate-cancel"
            onClick={handleClose}
          >
            {t("caseChecklist.setGate.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="set-phase-gate-submit"
            disabled={setGate.isPending}
          >
            {t("caseChecklist.setGate.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { SetPhaseGateDialog }
