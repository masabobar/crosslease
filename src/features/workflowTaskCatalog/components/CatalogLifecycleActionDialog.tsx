import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { JUSTIFICATION_MIN_LENGTH } from "@/features/workflowTaskCatalog/constants"
import type {
  CatalogLifecycleAction,
  WorkflowTaskCatalogRow,
} from "@/features/workflowTaskCatalog/constants"

const justificationSchema = z.object({
  justification: z.string().trim().min(JUSTIFICATION_MIN_LENGTH, "tooShort"),
})
type JustificationFormValues = z.infer<typeof justificationSchema>

type Props = {
  mode: CatalogLifecycleAction
  row: WorkflowTaskCatalogRow
  onOpenChange: (open: boolean) => void
}

// Shared by "Deprecate catalog version" and "Archive catalog version" — both dialogs are
// the same shape (read-only summary + justification textarea), differing only in title,
// subtitle, the extra "Object reference count" row on Archive, and the submit label.
// Static shell only — no backend exists yet for Epic 15 (see CLAUDE.md). Submitting
// validates the justification client-side, then only closes the dialog; it never
// simulates a network call or shows a success toast.
function CatalogLifecycleActionDialog({ mode, row, onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JustificationFormValues>({
    resolver: zodResolver(justificationSchema),
    defaultValues: { justification: "" },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit() {
    handleClose()
  }

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {t(`lifecycle.${mode}.title` as "lifecycle.deprecate.title")}
            </DialogTitle>
            <DialogDescription>
              {t(
                `lifecycle.${mode}.subtitle` as "lifecycle.deprecate.subtitle"
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("lifecycle.fields.catalogName")}
              </span>
              <span className="font-medium text-foreground">
                {row.catalogName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("lifecycle.fields.version")}
              </span>
              <span className="font-medium text-foreground">{row.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("lifecycle.fields.status")}
              </span>
              <WorkflowTaskCatalogStateBadge state={row.catalogState} />
            </div>
            {mode === "archive" && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("lifecycle.fields.objectRefCount")}
                </span>
                <span className="font-medium text-foreground">
                  {row.objectRefCount}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                htmlFor="lifecycle-justification"
                error={!!errors.justification}
              >
                {t(
                  `lifecycle.${mode}.justificationLabel` as "lifecycle.deprecate.justificationLabel"
                )}
              </Label>
              <span className="text-sm text-muted-foreground">
                {t("lifecycle.minCharactersHint", {
                  count: JUSTIFICATION_MIN_LENGTH,
                })}
              </span>
            </div>
            <Textarea
              id="lifecycle-justification"
              data-testid="lifecycle-justification-textarea"
              rows={3}
              aria-invalid={!!errors.justification || undefined}
              {...register("justification")}
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-destructive">
                {t("lifecycle.errors.tooShort", {
                  count: JUSTIFICATION_MIN_LENGTH,
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="lifecycle-cancel"
            onClick={handleClose}
          >
            {t("lifecycle.actions.cancel")}
          </Button>
          <Button type="submit" data-testid="lifecycle-submit">
            {t("lifecycle.actions.submitForApproval")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { CatalogLifecycleActionDialog }
