import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { STATUS_PILL_CLASSES } from "@/features/workflowTaskCatalog/constants"
import { CatalogStateSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogState } from "@/features/workflowTaskCatalog/api/schema"

type Props = {
  state: CatalogState
}

// Soft green pill for active — matches TemplateVersionStatusBadge's palette. Archived
// renders as plain text with no pill background, per the Figma list view. Draft/suspended
// added for the Draft → Active → Suspended lifecycle (PRD1042-1894 Block 8 AC §7).
const STATE_BADGE_CLASSES: Record<CatalogState, string> = {
  [CatalogStateSchema.enum.draft]: "bg-sky-600/10 text-sky-600",
  [CatalogStateSchema.enum.active]: "bg-green-600/10 text-green-600",
  [CatalogStateSchema.enum.suspended]: "bg-amber-600/10 text-amber-600",
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
      className={cn(STATUS_PILL_CLASSES, STATE_BADGE_CLASSES[state])}
    >
      {label}
    </span>
  )
}

export { WorkflowTaskCatalogStateBadge }
