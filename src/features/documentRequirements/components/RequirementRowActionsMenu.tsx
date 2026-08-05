import { useTranslation } from "react-i18next"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  requirementId: string
  isActive: boolean
  canManage: boolean
  onEdit: () => void
  onDeactivate: () => void
}

function RequirementRowActionsMenu({
  requirementId,
  isActive,
  canManage,
  onEdit,
  onDeactivate,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`requirement-row-menu-${requirementId}`}
        aria-label={t("requirement.actionsMenuLabel")}
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canManage && (
          <DropdownMenuItem
            data-testid={`requirement-action-edit-${requirementId}`}
            onClick={onEdit}
          >
            {t("requirement.actions.edit")}
          </DropdownMenuItem>
        )}
        {canManage && isActive && (
          <DropdownMenuItem
            data-testid={`requirement-action-deactivate-${requirementId}`}
            onClick={onDeactivate}
          >
            {t("requirement.actions.deactivate")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { RequirementRowActionsMenu }
