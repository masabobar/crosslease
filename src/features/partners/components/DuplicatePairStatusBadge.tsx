import { useTranslation } from "react-i18next"
import type { DuplicateCandidatePairStatus } from "@/features/partners/api/schema"

type StatusConfig = {
  container: string
  dot: string
  text: string
}

const STATUS_CONFIG: Record<DuplicateCandidatePairStatus, StatusConfig> = {
  pending: {
    container: "bg-[#fef3c6]",
    dot: "bg-[#eab308]",
    text: "text-[#92400e]",
  },
  confirmed_duplicate: {
    container: "bg-[#ffe4e6]",
    dot: "bg-[#ef4444]",
    text: "text-[#991b1b]",
  },
  confirmed_distinct: {
    container: "bg-[#f3e8ff]",
    dot: "bg-[#8b5cf6]",
    text: "text-[#6b21a8]",
  },
  deferred: {
    container: "bg-[#f1f5f9]",
    dot: "bg-[#94a3b8]",
    text: "text-[#374151]",
  },
  merge_in_progress: {
    container: "bg-[#dbeafe]",
    dot: "bg-[#3b82f6]",
    text: "text-[#1d4ed8]",
  },
  merged: {
    container: "bg-[#d0fae5]",
    dot: "bg-[#22c55e]",
    text: "text-[#166534]",
  },
}

function DuplicatePairStatusBadge({
  status,
}: {
  status: DuplicateCandidatePairStatus
}) {
  const { t } = useTranslation("partners")
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.container} ${config.text}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${config.dot}`} />
      {t(`duplicates.pairStatus.${status}` as "duplicates.pairStatus.pending")}
    </span>
  )
}

export { DuplicatePairStatusBadge }
