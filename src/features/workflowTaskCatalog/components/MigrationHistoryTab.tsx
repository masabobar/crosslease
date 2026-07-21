import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { formatDateTime } from "@/lib/formatters"
import { workflowTaskCatalogMigration } from "@/router/paths"
import { PLACEHOLDER_MIGRATION_HISTORY } from "@/features/workflowTaskCatalog/constants"
import type { PlaceholderMigrationHistoryEntry } from "@/features/workflowTaskCatalog/constants"

type MigrationHistoryTabProps = {
  catalogId: string
  canManage: boolean
}

function DrawerRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

function MigrationHistoryTab({
  catalogId,
  canManage,
}: MigrationHistoryTabProps) {
  const { t } = useTranslation("workflowTaskCatalog")
  const navigate = useNavigate()
  const [selected, setSelected] =
    useState<PlaceholderMigrationHistoryEntry | null>(null)

  return (
    <div data-testid="migration-history-tab" className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            data-testid="start-migration-button"
            onClick={() => navigate(workflowTaskCatalogMigration(catalogId))}
          >
            {t("detail.migrationHistory.startMigrationButton")}
          </Button>
        </div>
      )}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("detail.migrationHistory.columns.from")}</TableHead>
              <TableHead>{t("detail.migrationHistory.columns.to")}</TableHead>
              <TableHead>
                {t("detail.migrationHistory.columns.scope")}
              </TableHead>
              <TableHead>
                {t("detail.migrationHistory.columns.decisionAt")}
              </TableHead>
              <TableHead>
                {t("detail.migrationHistory.columns.dryRunReport")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_MIGRATION_HISTORY.map(entry => (
              <TableRow
                key={entry.id}
                data-testid={`migration-history-row-${entry.id}`}
                className="cursor-pointer"
                onClick={() => setSelected(entry)}
              >
                <TableCell className="font-medium text-foreground">
                  {entry.fromVersion}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {entry.toVersion}
                </TableCell>
                <TableCell>
                  {t("detail.migrationHistory.objectsInScope", {
                    count: entry.objectsInScope,
                  })}
                </TableCell>
                <TableCell>{formatDateTime(entry.decisionAt)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-primary">
                    <FileText size={14} />
                    {entry.dryRunReportName}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Sheet open onOpenChange={o => !o && setSelected(null)}>
          <SheetContent data-testid="migration-history-drawer">
            <SheetHeader>
              <SheetTitle>
                {t("detail.migrationHistory.drawer.title", {
                  from: selected.fromVersion,
                  to: selected.toVersion,
                })}
              </SheetTitle>
              <SheetDescription>
                {t("detail.migrationHistory.drawer.subtitle", {
                  count: selected.objectsInScope,
                })}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.migrationHistory.drawer.sections.governance")}
                </p>
                <DrawerRow
                  label={t("detail.migrationHistory.drawer.fields.initiator")}
                  value={selected.initiator}
                />
                <DrawerRow
                  label={t("detail.migrationHistory.drawer.fields.approver")}
                  value={selected.approver}
                />
                <DrawerRow
                  label={t("detail.migrationHistory.drawer.fields.decisionAt")}
                  value={formatDateTime(selected.decisionAt)}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.migrationHistory.drawer.sections.dryRunReport")}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                  <FileText size={14} />
                  {selected.dryRunReportName}.pdf
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t(
                    "detail.migrationHistory.drawer.sections.perObjectOutcome"
                  )}
                </p>
                <DrawerRow
                  label={t(
                    "detail.migrationHistory.drawer.fields.reconciledAutomatically"
                  )}
                  value={selected.reconciledCount}
                />
                {selected.manualReviewCount > 0 && (
                  <DrawerRow
                    label={t(
                      "detail.migrationHistory.drawer.fields.requiredManualReview"
                    )}
                    value={
                      <span className="text-amber-600">
                        {selected.manualReviewCount}
                      </span>
                    }
                  />
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

export { MigrationHistoryTab }
