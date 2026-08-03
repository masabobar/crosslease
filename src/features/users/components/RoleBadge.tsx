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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type RoleBadgeProps = {
  role: UserRole
  className?: string
}

// Per-role brand colours from the Figma role-badge spec. These are literal hex values
// rather than theme tokens because the palette is role identity, not surface styling —
// which also means they do not yet have dark-mode counterparts.

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
    <Badge
      variant="outline"
      className={cn("rounded-md", ROLE_STYLES[role], className)}
    >
      <Icon size={12} />
      {t(`roles.${role}`)}
    </Badge>
  )
}

export { RoleBadge }
