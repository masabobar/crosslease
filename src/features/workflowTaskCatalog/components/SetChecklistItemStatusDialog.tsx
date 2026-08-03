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
import { useSetChecklistItemStatus } from "@/features/workflowTaskCatalog/hooks/useSetChecklistItemStatus"
import { SETTABLE_CHECKLIST_ITEM_STATUS_OPTIONS } from "@/features/workflowTaskCatalog/constants"
import { SettableChecklistItemStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { ChecklistItemResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"

// The note is optional on the wire. Open question 18 on CR PRD1042-1790 asks whether waiving
// should require a written reason — until that is answered the platform's own rule (optional)
// stands, so this form does not require one for either status.
const setItemStatusFormSchema = z.object({
  status: z.string().min(1, "required"),
  note: z.string(),
})

type SetItemStatusFormValues = z.infer<typeof setItemStatusFormSchema>

type Props = {
  businessObjectId: string
  item: ChecklistItemResponse
  onOpenChange: (open: boolean) => void
}

function SetChecklistItemStatusDialog({
  businessObjectId,
  item,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const setStatus = useSetChecklistItemStatus()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors },
  } = useForm<SetItemStatusFormValues>({
    resolver: zodResolver(setItemStatusFormSchema),
    defaultValues: { status: "", note: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: SetItemStatusFormValues) {
    setStatus.mutate(
      {
        businessObjectId,
        itemId: item.id,
        body: {
          // Parse at the form → wire boundary: the select holds a plain string, and only
          // `checked` / `not_applicable` are settable.
          status: SettableChecklistItemStatusSchema.parse(values.status),
          note: values.note.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("caseChecklist.setItemStatus.success"))
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
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  const taskLabel = item.task_name ?? item.task_code ?? item.id

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("caseChecklist.setItemStatus.title")}</DialogTitle>
            <DialogDescription>
              {t("caseChecklist.setItemStatus.subtitle", { task: taskLabel })}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <Label
              htmlFor="set-item-status-status"
              error={!!errors.status}
              className="mb-2"
            >
              {t("caseChecklist.setItemStatus.fields.status")}
            </Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SelectField
                  id="set-item-status-status"
                  data-testid="set-item-status-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={SETTABLE_CHECKLIST_ITEM_STATUS_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  placeholder={t(
                    "caseChecklist.setItemStatus.fields.statusPlaceholder"
                  )}
                  error={!!errors.status}
                />
              )}
            />
            {/* Immutability is why this dialog only ever opens on an open item: the service
                accepts OPEN → checked/not_applicable once and refuses everything after. */}
            <p className="mt-2 text-sm text-muted-foreground opacity-80">
              {t("caseChecklist.setItemStatus.fields.statusHint")}
            </p>
            {errors.status && (
              <p className="mt-1 text-sm text-destructive">
                {tCommon("validation.required")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="set-item-status-note" className="mb-2">
              {t("caseChecklist.setItemStatus.fields.note")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("caseChecklist.setItemStatus.fields.optional")}
              </span>
            </Label>
            <Textarea
              id="set-item-status-note"
              data-testid="set-item-status-note-input"
              rows={3}
              {...register("note")}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="set-item-status-cancel"
            onClick={handleClose}
          >
            {t("caseChecklist.setItemStatus.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="set-item-status-submit"
            disabled={setStatus.isPending}
          >
            {t("caseChecklist.setItemStatus.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { SetChecklistItemStatusDialog }
