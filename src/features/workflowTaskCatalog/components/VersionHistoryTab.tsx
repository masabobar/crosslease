import { useState } from "react"
import { useTranslation } from "react-i18next"
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
} from "@/components/ui/sheet"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { formatDateTime } from "@/lib/formatters"
import { PLACEHOLDER_VERSION_HISTORY } from "@/features/workflowTaskCatalog/constants"
import type { PlaceholderVersionHistoryEntry } from "@/features/workflowTaskCatalog/constants"

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

function VersionHistoryTab() {
  const { t } = useTranslation("workflowTaskCatalog")
  const [selected, setSelected] =
    useState<PlaceholderVersionHistoryEntry | null>(null)

  return (
    <div data-testid="version-history-tab">
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {t("detail.versionHistory.columns.version")}
              </TableHead>
              <TableHead>{t("detail.versionHistory.columns.type")}</TableHead>
              <TableHead>
                {t("detail.versionHistory.columns.activatedAt")}
              </TableHead>
              <TableHead>
                {t("detail.versionHistory.columns.changeSummary")}
              </TableHead>
              <TableHead>
                {t("detail.versionHistory.columns.objectRefs")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PLACEHOLDER_VERSION_HISTORY.map(entry => (
              <TableRow
                key={entry.id}
                data-testid={`version-history-row-${entry.id}`}
                className="cursor-pointer"
                onClick={() => setSelected(entry)}
              >
                <TableCell className="font-medium text-foreground">
                  {entry.version}
                </TableCell>
                <TableCell>
                  <WorkflowTaskCatalogStateBadge state={entry.state} />
                </TableCell>
                <TableCell>{formatDateTime(entry.activatedAt)}</TableCell>
                <TableCell className="max-w-md truncate">
                  {entry.changeSummary}
                </TableCell>
                <TableCell>
                  {entry.archivable ? (
                    <span className="text-amber-600">
                      {t("detail.versionHistory.archivable", {
                        count: entry.objectRefs,
                      })}
                    </span>
                  ) : (
                    entry.objectRefs
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <Sheet open onOpenChange={o => !o && setSelected(null)}>
          <SheetContent data-testid="version-history-drawer">
            <SheetHeader>
              <SheetTitle>{selected.version}</SheetTitle>
              <WorkflowTaskCatalogStateBadge state={selected.state} />
            </SheetHeader>

            <div className="flex flex-col gap-4 px-4">
              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.versionHistory.drawer.sections.publication")}
                </p>
                <DrawerRow
                  label={t("detail.versionHistory.drawer.fields.publishedAt")}
                  value={formatDateTime(selected.publishedAt)}
                />
                <DrawerRow
                  label={t("detail.versionHistory.drawer.fields.publishedBy")}
                  value={selected.publishedBy ?? "—"}
                />
                <DrawerRow
                  label={t("detail.versionHistory.drawer.fields.approvedAt")}
                  value={formatDateTime(selected.approvedAt)}
                />
                <DrawerRow
                  label={t("detail.versionHistory.drawer.fields.approvedBy")}
                  value={selected.approvedBy ?? "—"}
                />
                {selected.deprecatedAt && (
                  <DrawerRow
                    label={t(
                      "detail.versionHistory.drawer.fields.deprecatedAt"
                    )}
                    value={formatDateTime(selected.deprecatedAt)}
                  />
                )}
                <DrawerRow
                  label={t("detail.versionHistory.drawer.fields.objectRefs")}
                  value={
                    selected.archivable
                      ? t("detail.versionHistory.archivable", {
                          count: selected.objectRefs,
                        })
                      : selected.objectRefs
                  }
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.versionHistory.drawer.sections.changeSummary")}
                </p>
                <p className="text-sm text-foreground">
                  {selected.changeSummary}
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

export { VersionHistoryTab }
