import { useTranslation } from "react-i18next"
import type { PartnerType } from "@/features/partners/api/schema"

const TYPE_CONFIG: Record<PartnerType, { container: string; text: string }> = {
  legal_entity: {
    container: "bg-[#ede9fe]",
    text: "text-[#5b21b6]",
  },
  person_commercial: {
    container: "bg-[#dbeafe]",
    text: "text-[#1d4ed8]",
  },
  // The two person shapes are told apart, not merged into one colour: which of them a party is
  // decides whether consumer-credit rules apply to it.
  person_private: {
    container: "bg-[#e0f2fe]",
    text: "text-[#075985]",
  },
  sole_trader: {
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
