import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/formatters"
import { resolveUserDisplayName } from "@/features/users/utils"
import { CaseChecklistItemStatusBadge } from "@/features/workflowTaskCatalog/components/CaseChecklistStatusBadge"
import { SetChecklistItemStatusDialog } from "@/features/workflowTaskCatalog/components/SetChecklistItemStatusDialog"
import {
  ChecklistCloseActorSchema,
  ChecklistItemStatusSchema,
} from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { ChecklistItemResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { UserListItem } from "@/features/users/api/schema"

type Props = {
  businessObjectId: string
  items: readonly ChecklistItemResponse[]
  canWrite: boolean
  users: readonly UserListItem[]
}

function CaseChecklistTable({
  businessObjectId,
  items,
  canWrite,
  users,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [activeItem, setActiveItem] = useState<ChecklistItemResponse | null>(
    null
  )
  const notApplicable = t("caseChecklist.notApplicable")

  // `display_order` now arrives on the case item (PRD1042-1790 / Q-052), so the checklist can
  // finally be shown in the order the catalogue defines instead of the backend's `created_at`.
  // Items without one keep their relative position at the end rather than sorting to the front.
  const orderedItems = [...items].sort(
    (a, b) =>
      (a.display_order ?? Number.MAX_SAFE_INTEGER) -
      (b.display_order ?? Number.MAX_SAFE_INTEGER)
  )

  return (
    <>
      {/* Rows are ordered by the catalogue's `display_order` (see above). There is still no
          ordering *control*: the order belongs to the catalogue, not to the case. */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("caseChecklist.columns.task")}</TableHead>
              <TableHead>{t("caseChecklist.columns.stage")}</TableHead>
              <TableHead>{t("caseChecklist.columns.mandatory")}</TableHead>
              <TableHead>{t("caseChecklist.columns.status")}</TableHead>
              <TableHead>{t("caseChecklist.columns.checkedBy")}</TableHead>
              <TableHead>{t("caseChecklist.columns.checkedAt")}</TableHead>
              <TableHead>{t("caseChecklist.columns.note")}</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedItems.map(item => {
              const isOpen = item.status === ChecklistItemStatusSchema.enum.open
              const markedChecks = item.checks.filter(
                check => check.mark !== null
              ).length

              return (
                <TableRow
                  key={item.id}
                  data-testid={`case-checklist-row-${item.id}`}
                >
                  <TableCell>
                    <p className="flex items-center gap-1.5 font-medium text-foreground">
                      {item.task_name ?? notApplicable}
                      {/* Four eyes decides who may close this item, so the worker has to see it
                          before acting rather than after being refused. */}
                      {item.four_eyes && (
                        <span
                          className="inline-flex items-center gap-0.5 text-xs font-normal text-amber-700"
                          title={t("caseChecklist.fourEyesTitle")}
                          data-testid={`case-checklist-four-eyes-${item.id}`}
                        >
                          <ShieldCheck size={14} />
                          {t("caseChecklist.fourEyesBadge")}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.task_code ?? notApplicable}
                      {item.task_type &&
                        `, ${t(`detail.taskSheet.taskTypes.${item.task_type}` as "detail.taskSheet.taskTypes.checkbox")}`}
                    </p>
                    {/* A typed_upload item carries its own document checks. The count is the one
                        thing the worker needs at a glance; marking them is a separate surface. */}
                    {item.checks.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t("caseChecklist.documentChecksSummary", {
                          marked: markedChecks,
                          total: item.checks.length,
                        })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.stage_categorization
                      ? t(
                          `detail.taskSheet.stages.${item.stage_categorization}` as "detail.taskSheet.stages.pre_submission"
                        )
                      : notApplicable}
                  </TableCell>
                  <TableCell>
                    {t(
                      item.is_mandatory
                        ? "caseChecklist.mandatory.required"
                        : "caseChecklist.mandatory.optional"
                    )}
                  </TableCell>
                  <TableCell>
                    <CaseChecklistItemStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    {/* A system close leaves `checked_by` null, which is indistinguishable from
                        "nobody yet" — `checked_by_type` is what tells the two apart, so a settled
                        item now says System instead of rendering a dash.
                        `checked_by` is otherwise a bare UUID with no display name on the wire
                        (Q-042), so it is joined against the user page the screen already holds. */}
                    {item.checked_by_type ===
                    ChecklistCloseActorSchema.enum.system
                      ? t("caseChecklist.systemActor")
                      : resolveUserDisplayName(
                          users,
                          item.checked_by,
                          notApplicable
                        )}
                  </TableCell>
                  <TableCell>
                    {item.checked_at
                      ? formatDateTime(item.checked_at)
                      : notApplicable}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm text-muted-foreground">
                      {item.note ?? notApplicable}
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* Offered only while the item is open. `set_item_status` accepts
                        OPEN → checked/not_applicable exactly once and then raises
                        WTC_CHECKLIST_ITEM_IMMUTABLE, so a settled row gets no control rather
                        than a button that is guaranteed to fail. */}
                    {canWrite && isOpen && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`case-checklist-set-status-${item.id}`}
                        onClick={() => setActiveItem(item)}
                      >
                        {t("caseChecklist.actions.setStatus")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {activeItem && (
        <SetChecklistItemStatusDialog
          businessObjectId={businessObjectId}
          item={activeItem}
          onOpenChange={open => !open && setActiveItem(null)}
        />
      )}
    </>
  )
}

export { CaseChecklistTable }
