import { useState } from "react"
import { useLocation, useMatch, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ChevronRight,
  Bell,
  ClipboardList,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useTenantDetail } from "@/features/tenants/hooks/useTenantDetail"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { getInitials } from "@/lib/formatters"

type Crumb = { labelKey?: string; label?: string; path?: string }

const BREADCRUMBS: Record<string, Crumb[]> = {
  [PATHS.USER_MANAGEMENT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.userManagement" },
  ],
  [PATHS.PENDING_APPROVALS]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.pendingApprovals" },
  ],
  [PATHS.SETTINGS_PROFILE]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.myProfile" },
  ],
  [PATHS.AUDIT_TRAIL]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.auditTrail" },
  ],
  [PATHS.TENANT_MANAGEMENT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.tenantManagement" },
  ],
  [PATHS.TENANT_MANAGEMENT_CREATE]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.tenantManagement", path: PATHS.TENANT_MANAGEMENT },
    { labelKey: "breadcrumb.createTenant" },
  ],
}

export function Header() {
  const { t } = useTranslation("common")
  const location = useLocation()
  const userDetailMatch = useMatch(PATHS.USER_DETAIL)
  const auditDetailMatch = useMatch(PATHS.AUDIT_TRAIL_DETAIL)
  const tenantCreateMatch = useMatch(PATHS.TENANT_MANAGEMENT_CREATE)
  const tenantDetailMatchRaw = useMatch(PATHS.TENANT_DETAIL)
  const tenantDetailMatch = tenantCreateMatch ? null : tenantDetailMatchRaw
  const { data: currentUser } = useCurrentUser()
  const { data: detailUser } = useUserDetail(userDetailMatch?.params.id ?? null)
  const { data: detailTenant } = useTenantDetail(
    tenantDetailMatch?.params.id ?? null
  )
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
    : tenantDetailMatch
      ? [
          { labelKey: "breadcrumb.home" },
          { labelKey: "breadcrumb.platformAdministration" },
          {
            labelKey: "breadcrumb.tenantManagement",
            path: PATHS.TENANT_MANAGEMENT,
          },
          { label: detailTenant?.name ?? "…" },
        ]
      : auditDetailMatch
        ? [
            { labelKey: "breadcrumb.home" },
            { labelKey: "breadcrumb.platformAdministration" },
            { labelKey: "breadcrumb.auditTrail", path: PATHS.AUDIT_TRAIL },
            { labelKey: "breadcrumb.auditEvent" },
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
          <Button
            variant="ghost"
            data-testid="header-profile-button"
            className="h-auto items-center gap-2 rounded-xl px-2 py-1"
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
          </Button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-xl shadow-lg min-w-[160px] py-1">
                <Link
                  to={PATHS.SETTINGS_PROFILE}
                  onClick={() => setProfileOpen(false)}
                  data-testid="header-my-profile-link"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <User size={14} />
                  {t("nav.myProfile")}
                </Link>
                <div className="mx-3 my-1 h-px bg-border" />
                <Button
                  variant="ghost"
                  data-testid="header-logout-button"
                  onClick={() => {
                    setProfileOpen(false)
                    doLogout()
                  }}
                  disabled={isLoggingOut}
                  className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                >
                  <LogOut size={14} />
                  {t("nav.logout")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
