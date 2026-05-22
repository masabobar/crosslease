import { UserRoundX, Ban, RotateCcw, CircleUserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { formatLastLogin, getInitials } from "@/features/users/utils"
import { PATHS } from "@/router/paths"
import type { UserModalActionType } from "@/features/users/types"
import type { UserDetail } from "@/features/users/api/schema"

type UserDetailDrawerProps = {
  userId: string | null
  onClose: () => void
  onAction: (type: UserModalActionType, user: UserDetail) => void
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/70 px-4 py-2.5">
        <span className="text-xs font-semibold text-foreground tracking-wide">
          {title}
        </span>
      </div>
      <div className="bg-card divide-y divide-border/50">{children}</div>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center px-4 py-3 gap-4">
      <span className="text-sm text-muted-foreground w-[108px] shrink-0">
        {label}
      </span>
      <span className="text-sm text-foreground min-w-0">{children}</span>
    </div>
  )
}

function DrawerContent({
  user,
  onClose,
  onAction,
}: {
  user: UserDetail
  onClose: () => void
  onAction: (type: UserModalActionType, user: UserDetail) => void
}) {
  const { t } = useTranslation("users")
  const navigate = useNavigate()

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`

  const isActive = user.status === "active"
  const isSuspended = user.status === "suspended"

  function handleOpenFullProfile() {
    onClose()
    navigate(PATHS.USER_DETAIL.replace(":id", user.id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="size-10 bg-muted border border-border rounded-full shrink-0 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 bg-card">
        {/* IDENTITY card */}
        <SectionCard title={t("detail.drawer.sections.identity")}>
          <Row label={t("detail.drawer.fields.userId")}>{user.user_id}</Row>
          <Row label={t("detail.drawer.fields.email")}>{user.email}</Row>
          <Row label={t("detail.drawer.fields.invitedBy")}>
            {user.invited_by_user_id ?? "—"}
          </Row>
          <Row label={t("detail.drawer.fields.approvedBy")}>—</Row>
        </SectionCard>

        {/* ROLE & SCOPE card */}
        <SectionCard title={t("detail.drawer.sections.roleScope")}>
          <Row label={t("detail.drawer.fields.role")}>
            <RoleBadge role={user.role} />
          </Row>
          <Row label={t("detail.drawer.fields.tenant")}>
            {user.tenant_name ?? "—"}
          </Row>
        </SectionCard>

        {/* STATUS card */}
        <SectionCard title={t("detail.drawer.sections.status")}>
          <Row label={t("detail.drawer.fields.accountStatus")}>
            <UserStatusBadge status={user.status} />
          </Row>
          <Row label={t("detail.drawer.fields.mfa")}>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm text-foreground">
                {t("detail.page.values.on")}
              </span>
            </span>
          </Row>
          <Row label={t("detail.drawer.fields.lastLogin")}>
            {formatLastLogin(user.last_login)}
          </Row>
        </SectionCard>
      </div>

      {/* Bottom buttons */}
      <div className="px-3 py-4 border-t border-border bg-muted/30 flex flex-col gap-3 shrink-0">
        <Button className="w-full gap-2" onClick={handleOpenFullProfile}>
          <CircleUserRound size={15} />
          {t("detail.drawer.openFullProfile")}
        </Button>
        <div className="flex gap-3">
          {isActive && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-sm"
              onClick={() => onAction("suspend", user)}
            >
              <UserRoundX size={14} />
              {t("detail.page.actions.suspendUser")}
            </Button>
          )}
          {isSuspended && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-sm"
              onClick={() => onAction("reactivate", user)}
            >
              <RotateCcw size={14} />
              {t("actions.reactivate.label")}
            </Button>
          )}
          {(isActive || isSuspended) && (
            <Button
              variant="outline"
              className="flex-1 gap-1.5 text-sm"
              onClick={() => onAction("deactivate", user)}
            >
              <Ban size={14} />
              {t("detail.page.actions.deactivateUser")}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function UserDetailDrawer({
  userId,
  onClose,
  onAction,
}: UserDetailDrawerProps) {
  const { t } = useTranslation("users")
  const { data: user, isLoading, isError } = useUserDetail(userId)

  if (!userId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[420px] z-40 bg-card border-l border-border shadow-xl flex flex-col">
        {isLoading && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
              <div className="size-10 bg-muted rounded-full animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-28" />
                <div className="h-3 bg-muted rounded animate-pulse w-36" />
              </div>
            </div>
            <div className="flex-1 p-3 flex flex-col gap-3">
              {[120, 80, 100].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <div className="bg-muted/70 h-9 animate-pulse" />
                  <div className="p-4 space-y-3">
                    {[...Array(i === 0 ? 4 : i === 1 ? 2 : 3)].map((_, j) => (
                      <div
                        key={j}
                        className="h-4 bg-muted rounded animate-pulse"
                        style={{ width: `${55 + (j % 3) * 15}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-sm text-muted-foreground text-center">
              {t("detail.loadError")}
            </p>
          </div>
        )}

        {user && !isLoading && (
          <DrawerContent user={user} onClose={onClose} onAction={onAction} />
        )}
      </div>
    </>
  )
}

export { UserDetailDrawer }
