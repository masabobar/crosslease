import { useTranslation } from "react-i18next"

// Keyed by string, not PartnerRole: historical rows can still carry the
// removed leasing_company / ubo_related_person values (PRD1042-1453), and
// they must keep rendering in role history and audit views.
const ROLE_CONFIG: Record<string, { container: string; text: string }> = {
  lessee: { container: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
  guarantor: { container: "bg-[#fce7f3]", text: "text-[#9d174d]" },
  supplier: { container: "bg-[#d1fae5]", text: "text-[#065f46]" },
  leasing_company: { container: "bg-[#ede9fe]", text: "text-[#5b21b6]" },
  bank_entity: { container: "bg-[#fef3c7]", text: "text-[#92400e]" },
  ubo_related_person: { container: "bg-[#f1f5f9]", text: "text-[#374151]" },
}

const FALLBACK_CONFIG = { container: "bg-muted", text: "text-muted-foreground" }

function PartnerRoleBadge({ role }: { role: string }) {
  const { t } = useTranslation("partners")
  const config = ROLE_CONFIG[role] ?? FALLBACK_CONFIG

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.container} ${config.text}`}
    >
      {t(`role.${role}` as `role.lessee`, { defaultValue: role })}
    </span>
  )
}

export { PartnerRoleBadge }
