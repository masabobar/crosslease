import { useTranslation } from "react-i18next"
import { ArrowLeft, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/formatters"
import { MigrationExecutionOutcomeBadge } from "@/features/workflowTaskCatalog/components/MigrationExecutionOutcomeBadge"
import {
  MIGRATION_OBJECT_OUTCOME,
  PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY,
  PLACEHOLDER_MIGRATION_EXECUTION_GENERATED_AT,
  PLACEHOLDER_MIGRATION_EXECUTION_OUTCOMES,
} from "@/features/workflowTaskCatalog/constants"

type Props = {
  onBackToVersionHistory: () => void
}

// Covers the top-level "execution" MigrationWizardStep (PRD1042-1174, US 15.17) — the
// per-object Reconciled/Failed outcome list. "Retry failed objects" stays disabled: no
// reconciliation engine exists yet for Epic 15, so a real retry cannot be performed here
// (see CLAUDE.md "Critical constraint" — no fake success/execute behavior).
function MigrationExecutionReportStep({ onBackToVersionHistory }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const reconciledCount = PLACEHOLDER_MIGRATION_EXECUTION_OUTCOMES.filter(
    outcome => outcome.outcome === MIGRATION_OBJECT_OUTCOME.RECONCILED
  ).length
  const failedCount = PLACEHOLDER_MIGRATION_EXECUTION_OUTCOMES.filter(
    outcome => outcome.outcome === MIGRATION_OBJECT_OUTCOME.FAILED
  ).length

  return (
    <div
      className="flex flex-col h-full"
      data-testid="migration-execution-report-step"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[900px] mx-auto w-full flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("migration.execution.title")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-600/10 text-green-600"
                >
                  {t("migration.execution.reconciledChip", {
                    count: reconciledCount,
                  })}
                </Badge>
                {failedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-destructive/10 text-destructive"
                  >
                    {t("migration.execution.failedChip", {
                      count: failedCount,
                    })}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY.reportId}</p>
              <p>
                {t("migration.execution.generatedAtPrefix")}{" "}
                {formatDateTime(PLACEHOLDER_MIGRATION_EXECUTION_GENERATED_AT)}
              </p>
            </div>
          </div>

          {failedCount > 0 && (
            <Alert variant="destructive" data-testid="execution-failure-banner">
              <TriangleAlert size={16} />
              <AlertDescription>
                {t("migration.execution.failureBanner", { count: failedCount })}
              </AlertDescription>
            </Alert>
          )}

          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("migration.execution.table.columns.object")}
                  </TableHead>
                  <TableHead>
                    {t("migration.execution.table.columns.name")}
                  </TableHead>
                  <TableHead>
                    {t("migration.execution.table.columns.status")}
                  </TableHead>
                  <TableHead>
                    {t("migration.execution.table.columns.details")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLACEHOLDER_MIGRATION_EXECUTION_OUTCOMES.map(outcome => (
                  <TableRow
                    key={outcome.id}
                    data-testid={`execution-outcome-row-${outcome.id}`}
                  >
                    <TableCell className="font-medium text-foreground">
                      {outcome.id}
                    </TableCell>
                    <TableCell>{outcome.name}</TableCell>
                    <TableCell>
                      <MigrationExecutionOutcomeBadge
                        outcome={outcome.outcome}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {outcome.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          disabled
          data-testid="retry-failed-objects-button"
        >
          {t("migration.execution.actions.retryFailedObjects")}
        </Button>
        <Button
          type="button"
          data-testid="back-to-version-history-button"
          onClick={onBackToVersionHistory}
        >
          <ArrowLeft size={16} />
          {t("migration.execution.actions.backToVersionHistory")}
        </Button>
      </div>
    </div>
  )
}

export { MigrationExecutionReportStep }
