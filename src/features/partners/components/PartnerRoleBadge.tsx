import { useTranslation } from "react-i18next"
import type { PartnerRole } from "@/features/partners/api/schema"

const ROLE_CONFIG: Record<PartnerRole, { container: string; text: string }> = {
  lessee: { container: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  guarantor: { container: "bg-[#fce7f3]", text: "text-[#9d174d]" },
  supplier: { container: "bg-[#d1fae5]", text: "text-[#065f46]" },
  leasing_company: { container: "bg-[#ede9fe]", text: "text-[#5b21b6]" },
  bank_entity: { container: "bg-[#fef3c7]", text: "text-[#92400e]" },
  ubo_related_person: { container: "bg-[#f1f5f9]", text: "text-[#374151]" },
}

function PartnerRoleBadge({ role }: { role: PartnerRole }) {
  const { t } = useTranslation("partners")
  const config = ROLE_CONFIG[role]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.container} ${config.text}`}
    >
      {t(`role.${role}` as `role.lessee`)}
    </span>
  )
}

export { PartnerRoleBadge }
