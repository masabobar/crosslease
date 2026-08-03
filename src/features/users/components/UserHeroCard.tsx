import type { ReactNode } from "react"
import { Mail, Clock, Calendar } from "lucide-react"
import { useTranslation } from "react-i18next"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { formatLastLogin, formatDate } from "@/lib/formatters"
import type { UserDetail } from "@/features/users/api/schema"

type UserHeroCardProps = {
  user: UserDetail
  /** Avatar slot — an upload menu when the viewer owns the profile, a static avatar otherwise. */
  avatar: ReactNode
  /** Lifecycle action buttons, rendered right-aligned in the top row. */
  actions?: ReactNode
}

/**
 * Name / role / status header plus the email, last-login and active-since info bar.
 * Shared by the admin detail page and the self-service profile page, which differ
 * only in the avatar slot and the action buttons.
 */
export function UserHeroCard({ user, avatar, actions }: UserHeroCardProps) {
  const { t } = useTranslation("users")
  const name = `${user.first_name} ${user.last_name}`

  return (
    <div className="flex flex-col border border-border rounded-[10px]">
      <div className="bg-card flex items-center justify-between px-3 py-4 rounded-t-[10px]">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-semibold text-foreground">{name}</p>
            <div className="flex items-center gap-2">
              <RoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
          </div>
        </div>
        {actions}
      </div>

      <div className="bg-muted border-t border-border flex items-center gap-6 px-3 py-3 rounded-b-[10px]">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-muted-foreground" />
          <span className="text-sm text-foreground">{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("detail.page.lastLogin")}
          </span>
          <span className="text-sm text-foreground">
            {formatLastLogin(user.last_login, t)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("detail.page.activeSince")}
          </span>
          <span className="text-sm text-foreground">
            {formatDate(user.activated_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
