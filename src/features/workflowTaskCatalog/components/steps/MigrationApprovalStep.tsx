import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MigrationDryRunReportTable } from "@/features/workflowTaskCatalog/components/MigrationDryRunReportTable"
import { MigrationSummaryStat } from "@/features/workflowTaskCatalog/components/MigrationSummaryStat"
import {
  JUSTIFICATION_MIN_LENGTH,
  PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY,
} from "@/features/workflowTaskCatalog/constants"

// Local, client-side-only form — see MigrationScopeDryRunStep for the same pattern.
const RejectionFormSchema = z.object({
  justification: z
    .string()
    .refine(value => value.trim().length >= JUSTIFICATION_MIN_LENGTH, {
      message: "tooShort",
    }),
})
type RejectionForm = z.infer<typeof RejectionFormSchema>

type LocalPhase = "review" | "rejected"

type Props = {
  onCancel: () => void
  onApprove: () => void
  onRejectedBackToCatalog: () => void
}

// Covers the top-level "approval" MigrationWizardStep — the second Power User's
// Approve/Reject decision on the dry-run report (PRD1042-1173, US 15.16). The Figma
// design has separate "MIGRATION APPROVAL" and "MIGRATION REJECTION" frame sets that
// share the same "Approve or reject" screen and diverge only at the decision modal;
// this component models both branches of that one screen rather than duplicating it.
function MigrationApprovalStep({
  onCancel,
  onApprove,
  onRejectedBackToCatalog,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [phase, setPhase] = useState<LocalPhase>("review")
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false)
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false)
  const [rejectionJustification, setRejectionJustification] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectionForm>({
    resolver: zodResolver(RejectionFormSchema),
    defaultValues: { justification: "" },
  })

  function handleApprove() {
    setIsDecisionDialogOpen(false)
    onApprove()
  }

  function handleOpenRejectionDialog() {
    setIsDecisionDialogOpen(false)
    setIsRejectionDialogOpen(true)
  }

  const handleConfirmRejection = handleSubmit(values => {
    setRejectionJustification(values.justification)
    setIsRejectionDialogOpen(false)
    setPhase("rejected")
  })

  if (phase === "rejected") {
    return (
      <div
        className="flex flex-col h-full items-center justify-center bg-slate-50"
        data-testid="migration-rejected-panel"
      >
        <div className="w-full max-w-[440px] bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            {t("migration.approval.rejected.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("migration.approval.rejected.description")}
          </p>
          <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("migration.approval.rejected.justificationLabel")}
            </p>
            <p className="text-sm text-foreground/80">
              &ldquo;{rejectionJustification}&rdquo;
            </p>
          </div>
          <Button
            type="button"
            data-testid="migration-rejected-back-button"
            onClick={onRejectedBackToCatalog}
          >
            <ArrowLeft size={16} />
            {t("migration.approval.rejected.backButton")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="migration-approval-step">
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[720px] mx-auto w-full flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("migration.approval.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("migration.approval.subtitle")}
            </p>
          </div>
          <MigrationDryRunReportTable />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="migration-approval-cancel-button"
          onClick={onCancel}
        >
          {t("migration.approval.actions.cancel")}
        </Button>
        <Button
          type="button"
          data-testid="migration-approval-submit-decision-button"
          onClick={() => setIsDecisionDialogOpen(true)}
        >
          {t("migration.approval.actions.submitDecision")}
        </Button>
      </div>

      <DialogModal
        open={isDecisionDialogOpen}
        onOpenChange={setIsDecisionDialogOpen}
      >
        <div
          className="p-4 flex flex-col gap-4"
          data-testid="submit-decision-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {t("migration.approval.decisionModal.title")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("migration.approval.decisionModal.description")}
          </p>
          <div className="rounded-lg bg-muted/40 p-3 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              {t("migration.approval.decisionModal.summaryTitle")}
            </p>
            <div className="grid grid-cols-4 gap-3">
              <MigrationSummaryStat
                label={t("migration.dryRunReport.summary.added")}
                value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.added}
              />
              <MigrationSummaryStat
                label={t("migration.dryRunReport.summary.modified")}
                value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.modified}
              />
              <MigrationSummaryStat
                label={t("migration.dryRunReport.summary.deactivated")}
                value={PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.deactivated}
              />
              <MigrationSummaryStat
                label={t("migration.approval.decisionModal.runtimeLabel")}
                value={`+${PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.newInstances} / -${PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.naInstances}`}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50/50 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            data-testid="decision-cancel-button"
            onClick={() => setIsDecisionDialogOpen(false)}
          >
            {t("migration.approval.decisionModal.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="decision-reject-button"
            onClick={handleOpenRejectionDialog}
          >
            {t("migration.approval.decisionModal.reject")}
          </Button>
          <Button
            type="button"
            data-testid="decision-approve-button"
            onClick={handleApprove}
          >
            {t("migration.approval.decisionModal.approve")}
          </Button>
        </div>
      </DialogModal>

      <DialogModal
        open={isRejectionDialogOpen}
        onOpenChange={setIsRejectionDialogOpen}
      >
        <div
          className="p-4 flex flex-col gap-3"
          data-testid="rejection-confirmation-dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {t("migration.approval.rejectionModal.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="rejection-justification"
              error={!!errors.justification}
            >
              {t("migration.approval.rejectionModal.justificationLabel")}
            </Label>
            <Textarea
              id="rejection-justification"
              data-testid="rejection-justification-textarea"
              rows={3}
              placeholder={t(
                "migration.approval.rejectionModal.justificationPlaceholder"
              )}
              aria-invalid={!!errors.justification || undefined}
              {...register("justification")}
            />
            {errors.justification ? (
              <p className="text-sm text-destructive">
                {t("lifecycle.errors.tooShort", {
                  count: JUSTIFICATION_MIN_LENGTH,
                })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground opacity-80">
                {t("migration.approval.rejectionModal.justificationHint")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-slate-50/50 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            data-testid="rejection-cancel-button"
            onClick={() => setIsRejectionDialogOpen(false)}
          >
            {t("migration.approval.rejectionModal.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            data-testid="confirm-rejection-button"
            onClick={handleConfirmRejection}
          >
            {t("migration.approval.rejectionModal.confirm")}
          </Button>
        </div>
      </DialogModal>
    </div>
  )
}

export { MigrationApprovalStep }
