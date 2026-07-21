import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { workflowTaskCatalogDetail } from "@/router/paths"
import { MigrationWizardStepper } from "@/features/workflowTaskCatalog/components/MigrationWizardStepper"
import { MigrationScopeDryRunStep } from "@/features/workflowTaskCatalog/components/steps/MigrationScopeDryRunStep"
import { MigrationApprovalStep } from "@/features/workflowTaskCatalog/components/steps/MigrationApprovalStep"
import { MigrationExecutionReportStep } from "@/features/workflowTaskCatalog/components/steps/MigrationExecutionReportStep"
import { PLACEHOLDER_CATALOG_ROWS } from "@/features/workflowTaskCatalog/constants"
import type { MigrationWizardStep } from "@/features/workflowTaskCatalog/types"

// Static UI shell for Epic 15's Migration Wizard (US 15.15/15.16/15.17) — no API exists
// yet, see CLAUDE.md "Critical constraint". The three MigrationWizardStep screens are
// reached both through the primary actions inside each step (Submit for approval /
// Approve / etc.) and by clicking the stepper directly — there is no live session
// linking the initiator and the second approver in a static shell, so free navigation
// between steps is the only way a reviewer can preview all three.
export default function WorkflowTaskCatalogMigrationWizardPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const row =
    PLACEHOLDER_CATALOG_ROWS.find(catalogRow => catalogRow.id === id) ??
    PLACEHOLDER_CATALOG_ROWS[0]

  const [step, setStep] = useState<MigrationWizardStep>("dryRun")

  function handleBackToCatalog() {
    navigate(workflowTaskCatalogDetail(row.id))
  }

  function handleBackToVersionHistory() {
    navigate(`${workflowTaskCatalogDetail(row.id)}?tab=versionHistory`)
  }

  return (
    <div
      className="flex flex-col h-full bg-slate-50"
      data-testid="migration-wizard-page"
    >
      <div className="border-b border-border bg-background px-8 py-4">
        <p className="text-sm text-muted-foreground">{row.catalogName}</p>
        <h1 className="text-xl font-semibold text-foreground">
          {t("migration.pageTitle")}
        </h1>
      </div>

      <MigrationWizardStepper currentStep={step} onStepChange={setStep} />

      <div className="flex-1 overflow-hidden">
        {step === "dryRun" && (
          <MigrationScopeDryRunStep
            onCancel={handleBackToCatalog}
            onSubmittedBackToCatalog={handleBackToCatalog}
          />
        )}
        {step === "approval" && (
          <MigrationApprovalStep
            onCancel={handleBackToCatalog}
            onApprove={() => setStep("execution")}
            onRejectedBackToCatalog={handleBackToCatalog}
          />
        )}
        {step === "execution" && (
          <MigrationExecutionReportStep
            onBackToVersionHistory={handleBackToVersionHistory}
          />
        )}
      </div>
    </div>
  )
}
