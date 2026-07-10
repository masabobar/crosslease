import {
  Shield,
  Headset,
  ClipboardCheck,
  Users,
  TriangleAlert,
  KeyRound,
  Landmark,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import type { UserRole } from "@/features/users/types"
import { cn } from "@/lib/utils"

type RoleBadgeProps = {
  role: UserRole
  className?: string
}

const ROLE_STYLES: Record<UserRole, string> = {
  system_admin: "border-[#7008e7] text-[#7008e7]",
  support_user: "border-[#1447e6] text-[#1447e6]",
  auditor: "border-[#a800b7] text-[#a800b7]",
  bank_power_user: "border-[#0e7490] text-[#0e7490]",
  front_office: "border-[#007a55] text-[#007a55]",
  back_office: "border-[#c70036] text-[#c70036]",
  leasing_company_user: "border-[#62748e] text-[#62748e]",
}

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  system_admin: Shield,
  support_user: Headset,
  auditor: ClipboardCheck,
  bank_power_user: Landmark,
  front_office: Users,
  back_office: TriangleAlert,
  leasing_company_user: KeyRound,
}

function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation("users")
  const Icon = ROLE_ICONS[role]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border",
        ROLE_STYLES[role],
        className
      )}
    >
      <Icon size={12} />
      {t(`roles.${role}`)}
    </span>
  )
}

export { RoleBadge }
