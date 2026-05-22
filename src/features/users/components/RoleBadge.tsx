import {
  Settings,
  Headphones,
  BarChart2,
  Building2,
  AlertTriangle,
  Key,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import type { UserRole } from "@/features/users/types"
import { cn } from "@/lib/utils"

type RoleBadgeProps = {
  role: UserRole
  className?: string
}

const ROLE_STYLES: Record<UserRole, string> = {
  system_admin: "bg-gray-100 text-gray-700",
  support_user: "bg-blue-100 text-blue-700",
  auditor: "bg-purple-100 text-purple-700",
  front_office: "bg-teal-100 text-teal-700",
  back_office: "bg-red-100 text-red-700",
  leasing_company_user: "bg-gray-100 text-gray-600",
}

const ROLE_ICONS: Record<UserRole, typeof Settings> = {
  system_admin: Settings,
  support_user: Headphones,
  auditor: BarChart2,
  front_office: Building2,
  back_office: AlertTriangle,
  leasing_company_user: Key,
}

function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation("users")
  const Icon = ROLE_ICONS[role]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
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
