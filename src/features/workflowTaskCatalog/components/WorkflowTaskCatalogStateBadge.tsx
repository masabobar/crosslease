import { useTranslation } from "react-i18next"
import { CATALOG_STATE } from "@/features/workflowTaskCatalog/constants"
import type { CatalogState } from "@/features/workflowTaskCatalog/constants"

type Props = {
  state: CatalogState
}

// Soft pill for draft/active/deprecated — matches TemplateVersionStatusBadge's palette.
// Archived renders as plain text with no pill background, per the Figma list view
// (Archived rows show unstyled text, unlike the other three states).
const STATE_BADGE_CLASSES: Record<CatalogState, string> = {
  [CATALOG_STATE.DRAFT]: "bg-sky-600/10 text-sky-600",
  [CATALOG_STATE.ACTIVE]: "bg-green-600/10 text-green-600",
  [CATALOG_STATE.DEPRECATED]: "bg-amber-600/10 text-amber-600",
  [CATALOG_STATE.ARCHIVED]: "",
}

function WorkflowTaskCatalogStateBadge({ state }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const label = t(`catalogStates.${state}` as "catalogStates.draft")

  if (state === CATALOG_STATE.ARCHIVED) {
    return (
      <span
        data-testid={`catalog-state-badge-${state}`}
        className="text-sm text-foreground"
      >
        {label}
      </span>
    )
  }

  return (
    <span
      data-testid={`catalog-state-badge-${state}`}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STATE_BADGE_CLASSES[state]}`}
    >
      {label}
    </span>
  )
}

export { WorkflowTaskCatalogStateBadge }
