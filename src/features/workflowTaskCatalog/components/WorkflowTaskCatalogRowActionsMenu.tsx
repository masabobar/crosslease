import { useTranslation } from "react-i18next"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  catalogId: string
  onOpenDetail: () => void
}

// One action left. New Draft Version, Version history, Migration history, Deprecate and
// Archive were all removed under CR PRD1042-1554: none of them has an endpoint, and
// /workflow-task-catalogs exposes no state-transition route at all. The menu is kept rather
// than replaced with a clickable row so the existing data-testids stay valid for QA.
function WorkflowTaskCatalogRowActionsMenu({ catalogId, onOpenDetail }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`catalog-row-menu-${catalogId}`}
        aria-label={t("list.table.actionsMenuLabel")}
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          data-testid={`catalog-action-open-detail-${catalogId}`}
          onClick={onOpenDetail}
        >
          {t("list.table.actions.openDetail")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { WorkflowTaskCatalogRowActionsMenu }
