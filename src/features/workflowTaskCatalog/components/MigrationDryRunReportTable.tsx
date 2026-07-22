import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MigrationSummaryStat } from "@/features/workflowTaskCatalog/components/MigrationSummaryStat"
import {
  PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY,
  PLACEHOLDER_MIGRATION_SCOPE_OBJECTS,
} from "@/features/workflowTaskCatalog/constants"
import type { PlaceholderMigrationScopeObject } from "@/features/workflowTaskCatalog/constants"

// Shared by the Dry Run Report sub-screen (MigrationScopeDryRunStep) and the Approve or
// Reject screen (MigrationApprovalStep) — both render the identical canned report, per
// the Figma design. Self-contained: reads the placeholder report/object data directly
// (matches the existing convention in this feature, e.g. MigrationHistoryTab), no props.
function MigrationDryRunReportTable() {
  const { t } = useTranslation("workflowTaskCatalog")
  const [selected, setSelected] =
    useState<PlaceholderMigrationScopeObject | null>(null)
  const summary = PLACEHOLDER_MIGRATION_DRY_RUN_SUMMARY

  return (
    <div
      className="flex flex-col gap-4"
      data-testid="migration-dry-run-report-table"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("migration.dryRunReport.report")}
          </span>
          <span className="text-sm font-medium text-foreground">
            {summary.reportId}
          </span>
          <Badge variant="outline">{summary.fromVersion}</Badge>
          <ArrowRight size={14} className="text-muted-foreground" />
          <Badge>{summary.toVersion}</Badge>
        </div>
        <div className="flex items-center gap-6">
          <MigrationSummaryStat
            label={t("migration.dryRunReport.summary.added")}
            value={summary.added}
          />
          <MigrationSummaryStat
            label={t("migration.dryRunReport.summary.modified")}
            value={summary.modified}
          />
          <MigrationSummaryStat
            label={t("migration.dryRunReport.summary.deactivated")}
            value={summary.deactivated}
          />
          <MigrationSummaryStat
            label={t("migration.dryRunReport.summary.newInstances")}
            value={summary.newInstances}
          />
          <MigrationSummaryStat
            label={t("migration.dryRunReport.summary.naInstances")}
            value={summary.naInstances}
          />
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("migration.dryRunReport.table.columns.object")}
              </TableHead>
              <TableHead>
                {t("migration.dryRunReport.table.columns.name")}
              </TableHead>
              <TableHead>
                {t("migration.dryRunReport.table.columns.naInstances")}
              </TableHead>
              <TableHead>
                {t("migration.dryRunReport.table.columns.mandatoryChanges")}
              </TableHead>
              <TableHead>
                {t("migration.dryRunReport.table.columns.newInstances")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_MIGRATION_SCOPE_OBJECTS.map(obj => (
              <TableRow
                key={obj.id}
                data-testid={`dry-run-object-row-${obj.id}`}
                className="cursor-pointer"
                onClick={() => setSelected(obj)}
              >
                <TableCell className="font-medium text-foreground">
                  {obj.id}
                </TableCell>
                <TableCell>{obj.name}</TableCell>
                <TableCell>{obj.naInstances}</TableCell>
                <TableCell>{obj.mandatoryChanges}</TableCell>
                <TableCell>{obj.newInstances}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Sheet open onOpenChange={o => !o && setSelected(null)}>
          <SheetContent data-testid="dry-run-object-detail-sheet">
            <SheetHeader>
              <SheetTitle>
                {selected.id} — {selected.name}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {t("migration.dryRunReport.detailSheet.taskDeltaSection")}
              </p>
              <ul className="flex flex-col gap-1.5 list-disc pl-4">
                {selected.taskDelta.map(line => (
                  <li key={line} className="text-sm text-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

export { MigrationDryRunReportTable }
