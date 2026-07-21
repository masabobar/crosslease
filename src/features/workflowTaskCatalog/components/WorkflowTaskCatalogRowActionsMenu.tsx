import { useTranslation } from "react-i18next"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATALOG_STATE } from "@/features/workflowTaskCatalog/constants"
import type {
  CatalogRowAction,
  WorkflowTaskCatalogRow,
} from "@/features/workflowTaskCatalog/constants"

type Props = {
  row: WorkflowTaskCatalogRow
  canManage: boolean
  onAction: (action: CatalogRowAction, row: WorkflowTaskCatalogRow) => void
}

// Row action set per PRD1042-1179: New Draft Version / Deprecate are Active-only, Archive
// is Deprecated-only, and all mutating actions are Power User only — Support/Auditor see
// only the read-only history actions (canManage=false), matching the Figma "DRAFT STATUS
// MENU DROPDOWN" (no destructive item) vs "ACTIVE STATUS MENU DROPDOWN" (Deprecate) states.
function WorkflowTaskCatalogRowActionsMenu({
  row,
  canManage,
  onAction,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  const showNewDraftVersion =
    canManage && row.catalogState === CATALOG_STATE.ACTIVE
  const showDeprecate = canManage && row.catalogState === CATALOG_STATE.ACTIVE
  const showArchive = canManage && row.catalogState === CATALOG_STATE.DEPRECATED
  const showDestructiveSeparator = showDeprecate || showArchive

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`catalog-row-menu-${row.id}`}
        aria-label={t("list.table.actionsMenuLabel")}
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid={`catalog-action-open-detail-${row.id}`}
          onClick={() => onAction("openDetail", row)}
        >
          {t("list.table.actions.openDetail")}
        </DropdownMenuItem>
        {showNewDraftVersion && (
          <DropdownMenuItem
            data-testid={`catalog-action-new-draft-version-${row.id}`}
            onClick={() => onAction("newDraftVersion", row)}
          >
            {t("list.table.actions.newDraftVersion")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          data-testid={`catalog-action-version-history-${row.id}`}
          onClick={() => onAction("versionHistory", row)}
        >
          {t("list.table.actions.versionHistory")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid={`catalog-action-migration-history-${row.id}`}
          onClick={() => onAction("migrationHistory", row)}
        >
          {t("list.table.actions.migrationHistory")}
        </DropdownMenuItem>
        {showDestructiveSeparator && <DropdownMenuSeparator />}
        {showDeprecate && (
          <DropdownMenuItem
            variant="destructive"
            data-testid={`catalog-action-deprecate-${row.id}`}
            onClick={() => onAction("deprecate", row)}
          >
            {t("list.table.actions.deprecate")}
          </DropdownMenuItem>
        )}
        {showArchive && (
          <DropdownMenuItem
            variant="destructive"
            data-testid={`catalog-action-archive-${row.id}`}
            onClick={() => onAction("archive", row)}
          >
            {t("list.table.actions.archive")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WorkflowTaskCatalogRowActionsMenu }
