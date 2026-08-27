import { useTranslation } from "react-i18next"
import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  documentTypeId: string
  isActive: boolean
  canManage: boolean
  onEdit: () => void
  onToggleActive: () => void
}

function DocumentTypeRowActionsMenu({
  documentTypeId,
  isActive,
  canManage,
  onEdit,
  onToggleActive,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  if (!canManage) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`document-type-row-menu-${documentTypeId}`}
        aria-label={t("documentType.actionsMenuLabel")}
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreVertical size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          data-testid={`document-type-action-edit-${documentTypeId}`}
          onClick={onEdit}
        >
          {t("documentType.actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid={`document-type-action-toggle-${documentTypeId}`}
          onClick={onToggleActive}
        >
          {isActive
            ? t("documentType.actions.deactivate")
            : t("documentType.actions.reactivate")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { DocumentTypeRowActionsMenu }
