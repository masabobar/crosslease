import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ChevronRight,
  Bell,
  ClipboardList,
  Settings,
  LogOut,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { getInitials } from "@/lib/formatters"
import { useBreadcrumbs } from "@/components/layout/useBreadcrumbs"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

export function Header() {
  const { t } = useTranslation("common")
  const { data: currentUser } = useCurrentUser()
  const crumbs = useBreadcrumbs()
  const { mutate: doLogout, isPending: isLoggingOut } = useLogout()

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
          const label = crumb.label ?? t(crumb.labelKey ?? "breadcrumb.home")
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
            <Button
              key={i}
              variant="ghost"
              size="icon"
              disabled
              className="rounded-xl text-muted-foreground opacity-40"
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger
            data-testid="header-profile-button"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto items-center gap-2 rounded-xl px-2 py-1"
            )}
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem
              data-testid="header-my-profile-link"
              render={<Link to={PATHS.SETTINGS_PROFILE} />}
            >
              <User size={14} />
              {t("nav.myProfile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              data-testid="header-logout-button"
              disabled={isLoggingOut}
              onClick={() => {
                doLogout(undefined, {
                  onError: err => {
                    toast.error(resolveApiErrorMessage(err, t))
                  },
                })
              }}
            >
              <LogOut size={14} />
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
