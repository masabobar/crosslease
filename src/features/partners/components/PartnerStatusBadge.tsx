import { useTranslation } from "react-i18next"
import type { PartnerStatus } from "@/features/partners/api/schema"

type StatusConfig = {
  container: string
  dot: string
  text: string
}

const STATUS_CONFIG: Record<PartnerStatus, StatusConfig> = {
  draft: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  pending_confirmation: {
    container: "bg-[#fef9c3]",
    dot: "bg-[#eab308]",
    text: "text-[#854d0e]",
  },
  confirmed: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
  rejected: {
    container: "bg-[#fee2e2]",
    dot: "bg-[#ef4444]",
    text: "text-[#991b1b]",
  },
  merged: {
    container: "bg-[#e0e7ff]",
    dot: "bg-[#6366f1]",
    text: "text-[#3730a3]",
  },
  archived: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  pending_archive: {
    container: "bg-[#ffedd4]",
    dot: "bg-[#f97316]",
    text: "text-[#9a3412]",
  },
}

function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const { t } = useTranslation("partners")
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`status.${status}` as `status.draft`)}
    </span>
  )
}

export { PartnerStatusBadge }
