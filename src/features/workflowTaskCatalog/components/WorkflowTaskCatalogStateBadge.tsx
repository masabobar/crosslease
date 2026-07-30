import { useTranslation } from "react-i18next"
import { CatalogStateSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogState } from "@/features/workflowTaskCatalog/api/schema"

type Props = {
  state: CatalogState
}

// Soft green pill for active — matches TemplateVersionStatusBadge's palette. Archived
// renders as plain text with no pill background, per the Figma list view.
const STATE_BADGE_CLASSES: Record<CatalogState, string> = {
  [CatalogStateSchema.enum.active]: "bg-green-600/10 text-green-600",
  [CatalogStateSchema.enum.archived]: "",
}

function WorkflowTaskCatalogStateBadge({ state }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const label = t(`catalogStates.${state}` as "catalogStates.active")

  if (state === CatalogStateSchema.enum.archived) {
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
