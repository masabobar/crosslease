import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { CaseChecklistItemStatusBadge } from "@/features/workflowTaskCatalog/components/CaseChecklistStatusBadge"
import { SetChecklistItemStatusDialog } from "@/features/workflowTaskCatalog/components/SetChecklistItemStatusDialog"
import { ChecklistItemStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
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

  // `checked_by` is a bare UUID with no display name on the wire, so it is joined against the
  // tenant's user list — the same client-side join the catalogue detail page uses for
  // `created_by`, and the same underlying gap (Q-042). Falls back to the raw id rather than
  // rendering blank when the actor is outside the fetched page.
  function resolveActor(userId: string | null): string {
    if (!userId) return notApplicable
    const user = users.find(u => u.id === userId)
    return user ? `${user.first_name} ${user.last_name}` : userId
  }

  return (
    <>
      {/* No ordering control and no order column: the case item carries no `display_order`
          (CR PRD1042-1790 B7 / Q-052), so rows arrive in the backend's `created_at` order and
          the screen must not imply an order it cannot honour. */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("caseChecklist.columns.task")}</TableHead>
              <TableHead>{t("caseChecklist.columns.mandatory")}</TableHead>
              <TableHead>{t("caseChecklist.columns.status")}</TableHead>
              <TableHead>{t("caseChecklist.columns.checkedBy")}</TableHead>
              <TableHead>{t("caseChecklist.columns.checkedAt")}</TableHead>
              <TableHead>{t("caseChecklist.columns.note")}</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => {
              const isOpen = item.status === ChecklistItemStatusSchema.enum.open

              return (
                <TableRow
                  key={item.id}
                  data-testid={`case-checklist-row-${item.id}`}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {item.task_name ?? notApplicable}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.task_code ?? notApplicable}
                    </p>
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
                  <TableCell>{resolveActor(item.checked_by)}</TableCell>
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
