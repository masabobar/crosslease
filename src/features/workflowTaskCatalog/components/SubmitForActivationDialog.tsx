import { useTranslation } from "react-i18next"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PLACEHOLDER_SUBMIT_PRECHECK_ISSUES } from "@/features/workflowTaskCatalog/constants"

type Props = {
  onOpenChange: (open: boolean) => void
}

// Static shell only — no publication check engine exists yet for Epic 15 (see
// CLAUDE.md). Always shows the same fixed set of blocking issues (Figma "PRECHECK
// FAIL" state); Submit stays disabled since there is no way to resolve them here.
// "Fix task" is rendered as plain text, not a link/button — the referenced task codes
// (FHA-001, FHA-002, KYC-001) don't correspond to any row in this shell's placeholder
// Task Definitions table, so there is nowhere real for it to navigate.
function SubmitForActivationDialog({ onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <DialogModal open onOpenChange={onOpenChange}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("detail.submitPrecheck.title")}</DialogTitle>
        </DialogHeader>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert
            size={16}
            className="mt-0.5 shrink-0 text-destructive"
          />
          <div>
            <p className="text-sm font-medium text-destructive">
              {t("detail.submitPrecheck.bannerTitle")}
            </p>
            <p className="text-sm text-destructive/80">
              {t("detail.submitPrecheck.bannerDescription")}
            </p>
          </div>
        </div>

        {PLACEHOLDER_SUBMIT_PRECHECK_ISSUES.map(issue => (
          <div
            key={issue.id}
            data-testid={`submit-precheck-issue-${issue.id}`}
            className="flex items-start justify-between gap-3 rounded-lg border-l-4 border-l-destructive bg-muted/40 p-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {issue.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {issue.description}
              </p>
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">
              {t("detail.submitPrecheck.fixTaskLabel")}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
        <span className="text-sm text-muted-foreground">
          {t("detail.submitPrecheck.footerNote")}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            data-testid="submit-precheck-cancel"
            onClick={() => onOpenChange(false)}
          >
            {t("detail.submitPrecheck.cancelButton")}
          </Button>
          <Button type="button" data-testid="submit-precheck-submit" disabled>
            {t("detail.submitPrecheck.submitButton")}
          </Button>
        </div>
      </div>
    </DialogModal>
  )
}

export { SubmitForActivationDialog }
