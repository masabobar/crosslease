import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { MIGRATION_OBJECT_OUTCOME } from "@/features/workflowTaskCatalog/constants"
import type { MigrationObjectOutcome } from "@/features/workflowTaskCatalog/constants"

type Props = {
  outcome: MigrationObjectOutcome
}

const OUTCOME_BADGE_CLASSES: Record<MigrationObjectOutcome, string> = {
  [MIGRATION_OBJECT_OUTCOME.RECONCILED]: "bg-green-600/10 text-green-600",
  [MIGRATION_OBJECT_OUTCOME.FAILED]: "bg-destructive/10 text-destructive",
}

function MigrationExecutionOutcomeBadge({ outcome }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <Badge
      variant="outline"
      data-testid={`migration-outcome-badge-${outcome}`}
      className={OUTCOME_BADGE_CLASSES[outcome]}
    >
      {t(`migration.execution.status.${outcome}`)}
    </Badge>
  )
}

export { MigrationExecutionOutcomeBadge }
