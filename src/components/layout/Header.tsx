import { useState } from "react"
import { useLocation, useMatch, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ChevronRight,
  Bell,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { getInitials } from "@/features/users/utils"

type Crumb = { labelKey?: string; label?: string; path?: string }

const BREADCRUMBS: Record<string, Crumb[]> = {
  [PATHS.USER_MANAGEMENT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.userManagement" },
  ],
}

export function Header() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const userDetailMatch = useMatch(PATHS.USER_DETAIL)
  const { data: currentUser } = useCurrentUser()
  const { data: detailUser } = useUserDetail(userDetailMatch?.params.id ?? null)
  const { mutate: doLogout, isPending: isLoggingOut } = useLogout()
  const [profileOpen, setProfileOpen] = useState(false)

  const crumbs: Crumb[] = userDetailMatch
    ? [
        { labelKey: "breadcrumb.home" },
        { labelKey: "breadcrumb.platformAdministration" },
        { labelKey: "breadcrumb.userManagement", path: PATHS.USER_MANAGEMENT },
        {
          label: detailUser
            ? `${detailUser.first_name} ${detailUser.last_name}`
            : "…",
        },
      ]
    : (BREADCRUMBS[location.pathname] ??
      Object.entries(BREADCRUMBS)
        .filter(([path]) => location.pathname.startsWith(path + "/"))
        .map(([, c]) => c)[0] ?? [{ labelKey: "breadcrumb.home" }])

  const initials = currentUser
    ? getInitials(currentUser.first_name, currentUser.last_name)
    : ""
  const fullName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : ""

  return (
    <header
      className="flex items-center justify-between px-6 h-14 bg-white border-b border-border shrink-0"
      data-testid="app-header"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          const label = crumb.label ?? t((crumb.labelKey ?? "") as never)
          return (
            <span
              key={crumb.labelKey ?? crumb.label ?? i}
              className="flex items-center gap-1.5"
            >
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    isLast ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  size={14}
                  className="text-muted-foreground shrink-0"
                />
              )}
            </span>
          )
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          {[Bell, ClipboardList, Settings].map((Icon, i) => (
            <div
              key={i}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground opacity-40"
            >
              <Icon size={16} />
            </div>
          ))}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Profile */}
        <div className="relative">
          <button
            data-testid="header-profile-button"
            className="flex items-center gap-2 rounded-xl hover:bg-muted px-2 py-1 transition-colors"
            onClick={() => setProfileOpen(v => !v)}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted border border-border shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                {initials || "—"}
              </span>
            </div>
            {fullName && (
              <span className="text-sm text-foreground whitespace-nowrap">
                {fullName}
              </span>
            )}
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-xl shadow-lg min-w-[140px] py-1">
                <button
                  data-testid="header-logout-button"
                  onClick={() => {
                    setProfileOpen(false)
                    doLogout()
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                >
                  <LogOut size={14} />
                  {t("nav.logout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
