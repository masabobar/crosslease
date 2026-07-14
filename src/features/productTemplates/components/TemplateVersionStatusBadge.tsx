import { useTranslation } from "react-i18next"
import type { TemplateStatus } from "@/features/productTemplates/api/schema"

type Props = {
  status: TemplateStatus
}

const STATUS_BADGE_CLASSES: Record<TemplateStatus, string> = {
  draft: "bg-sky-600/10 text-sky-600",
  published: "bg-green-600/10 text-green-600",
  deprecated: "bg-amber-600/10 text-amber-600",
  discarded: "bg-muted text-foreground",
  awaiting_activation_countersignature: "bg-amber-600/10 text-amber-600",
  awaiting_deprecation_countersignature: "bg-amber-600/10 text-amber-600",
}

// Soft pill only — no dot. The colored dot lives on the timeline rail in
// VersionHistoryPage, not inside this badge (matches the Figma "Soft Badge" component).
function TemplateVersionStatusBadge({ status }: Props) {
  const { t } = useTranslation("productTemplates")

  return (
    <span
      data-testid={`version-status-badge-${status}`}
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {t(`versionStatuses.${status}` as "versionStatuses.draft")}
    </span>
  )
}

export { TemplateVersionStatusBadge }
