import { useTranslation } from "react-i18next"
import type { PartnerType } from "@/features/partners/api/schema"

const TYPE_CONFIG: Record<PartnerType, { container: string; text: string }> = {
  legal_entity: {
    container: "bg-[#ede9fe]",
    text: "text-[#5b21b6]",
  },
  natural_person: {
    container: "bg-[#dbeafe]",
    text: "text-[#1d4ed8]",
  },
  sole_proprietor: {
    container: "bg-[#d1fae5]",
    text: "text-[#065f46]",
  },
}

function PartnerTypeBadge({ type }: { type: PartnerType }) {
  const { t } = useTranslation("partners")
  const config = TYPE_CONFIG[type]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.container} ${config.text}`}
    >
      {t(`type.${type}` as `type.legal_entity`)}
    </span>
  )
}

export { PartnerTypeBadge }
