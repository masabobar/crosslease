import { useState } from "react"
import type { ReactNode } from "react"
import {
  UserRoundX,
  Ban,
  RotateCcw,
  CircleUserRound,
  UserCheck,
  Mail,
  ShieldOff,
  ShieldAlert,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useResetUserMfa } from "@/features/users/hooks/useUserActions"
import { formatLastLogin, getInitials } from "@/lib/formatters"
import { getUserActionVisibility } from "@/features/users/utils"
import { useToastStore } from "@/store/toastStore"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"
import type { UserActionType, UserRole } from "@/features/users/types"
import type { UserDetail } from "@/features/users/api/schema"

type UserDetailDrawerProps = {
  userId: string | null
  onClose: () => void
  onAction: (type: UserActionType, user: UserDetail) => void
  viewerRole?: UserRole | null
  currentUserId?: string
}

function DrawerSectionCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
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

function Row({ label, children }: { label: string; children: ReactNode }) {
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
  viewerRole,
  currentUserId,
}: {
  user: UserDetail
  onClose: () => void
  onAction: (type: UserActionType, user: UserDetail) => void
  viewerRole?: UserRole | null
  currentUserId?: string
}) {
  const { t } = useTranslation("users")
  const navigate = useNavigate()
  const showToast = useToastStore(s => s.showToast)
  const resetMfaMutation = useResetUserMfa()
  const [showMfaResetConfirm, setShowMfaResetConfirm] = useState(false)

  const initials = getInitials(user.first_name, user.last_name)
  const name = `${user.first_name} ${user.last_name}`
  const isSelf = user.id === currentUserId

  const {
    canApprove,
    canResendInvitation,
    canSuspend,
    canReactivate,
    canDeactivate,
    canResetMfa,
  } = getUserActionVisibility(user.status, user.role, viewerRole)

  function handleMfaReset() {
    void resetMfaMutation
      .mutateAsync(user.id)
      .then(() => {
        setShowMfaResetConfirm(false)
        onClose()
        showToast({
          variant: "success",
          title: t("actions.resetMfa.success.title"),
          message: t("actions.resetMfa.success.message", { name }),
        })
      })
      .catch((err: unknown) => {
        setShowMfaResetConfirm(false)
        toast.error(
          err instanceof ApiError
            ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
            : t("errors.generic")
        )
      })
  }

  function handleOpenFullProfile() {
    onClose()
    navigate(
      isSelf
        ? PATHS.SETTINGS_PROFILE
        : PATHS.USER_DETAIL.replace(":id", user.id)
    )
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
        <DrawerSectionCard title={t("detail.drawer.sections.identity")}>
          <Row label={t("detail.drawer.fields.userId")}>{user.user_id}</Row>
          <Row label={t("detail.drawer.fields.email")}>{user.email}</Row>
          <Row label={t("detail.drawer.fields.invitedBy")}>
            {user.invited_by?.name ?? "—"}
          </Row>
          <Row label={t("detail.drawer.fields.approvedBy")}>
            {user.approved_by?.name ?? "—"}
          </Row>
        </DrawerSectionCard>

        {/* ROLE & SCOPE card */}
        <DrawerSectionCard title={t("detail.drawer.sections.roleScope")}>
          <Row label={t("detail.drawer.fields.role")}>
            <RoleBadge role={user.role} />
          </Row>
          <Row label={t("detail.drawer.fields.tenant")}>
            {user.tenant_name ?? "—"}
          </Row>
        </DrawerSectionCard>

        {/* STATUS card */}
        <DrawerSectionCard title={t("detail.drawer.sections.status")}>
          <Row label={t("detail.drawer.fields.accountStatus")}>
            <UserStatusBadge status={user.status} />
          </Row>
          <Row label={t("detail.drawer.fields.mfa")}>{"—"}</Row>
          <Row label={t("detail.drawer.fields.lastLogin")}>
            {formatLastLogin(user.last_login, t)}
          </Row>
        </DrawerSectionCard>
      </div>

      {/* Bottom buttons */}
      <div className="px-3 py-4 border-t border-border bg-muted/30 flex flex-col gap-3 shrink-0">
        <Button
          data-testid="drawer-open-full-profile-button"
          className="w-full gap-2"
          onClick={handleOpenFullProfile}
        >
          <CircleUserRound size={15} />
          {t("detail.drawer.openFullProfile")}
        </Button>
        {!isSelf && canApprove && (
          <Button
            variant="outline"
            data-testid="drawer-approve-button"
            className="w-full gap-1.5 text-sm"
            onClick={() => onAction("approve", user)}
          >
            <UserCheck size={14} />
            {t("table.actions.approve")}
          </Button>
        )}
        {!isSelf && canResendInvitation && (
          <Button
            variant="outline"
            data-testid="drawer-resend-invitation-button"
            className="w-full gap-1.5 text-sm"
            onClick={() => onAction("resend-invitation", user)}
          >
            <Mail size={14} />
            {t("actions.resend-invitation.label")}
          </Button>
        )}
        {!isSelf && (canSuspend || canReactivate || canDeactivate) && (
          <div className="flex gap-3">
            {canSuspend && (
              <Button
                variant="outline"
                data-testid="drawer-suspend-button"
                className="flex-1 gap-1.5 text-sm"
                onClick={() => onAction("suspend", user)}
              >
                <UserRoundX size={14} />
                {t("detail.page.actions.suspendUser")}
              </Button>
            )}
            {canReactivate && (
              <Button
                variant="outline"
                data-testid="drawer-reactivate-button"
                className="flex-1 gap-1.5 text-sm"
                onClick={() => onAction("reactivate", user)}
              >
                <RotateCcw size={14} />
                {t("actions.reactivate.label")}
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="outline"
                data-testid="drawer-deactivate-button"
                className="flex-1 gap-1.5 text-sm"
                onClick={() => onAction("deactivate", user)}
              >
                <Ban size={14} />
                {t("detail.page.actions.deactivateUser")}
              </Button>
            )}
          </div>
        )}
        {!isSelf && canResetMfa && (
          <Button
            variant="outline"
            data-testid="drawer-reset-mfa-button"
            className="w-full gap-1.5 text-sm"
            onClick={() => setShowMfaResetConfirm(true)}
          >
            <ShieldOff size={14} />
            {t("actions.resetMfa.label")}
          </Button>
        )}
      </div>

      <Dialog
        open={showMfaResetConfirm}
        onOpenChange={o => {
          if (!o) setShowMfaResetConfirm(false)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[420px] gap-0 p-0 overflow-hidden"
        >
          <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
            <DialogTitle>{t("actions.resetMfa.title", { name })}</DialogTitle>
          </DialogHeader>
          <div className="px-4 py-4">
            <div className="flex items-start gap-2 rounded-[10px] border border-amber-600 bg-amber-500/10 px-[10px] py-2">
              <ShieldAlert
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <span className="text-sm text-amber-600/80">
                {t("actions.resetMfa.description", { name })}
              </span>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0">
            <Button
              variant="outline"
              onClick={() => setShowMfaResetConfirm(false)}
              disabled={resetMfaMutation.isPending}
              data-testid="drawer-mfa-reset-cancel"
            >
              {t("modal.actions.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMfaReset}
              disabled={resetMfaMutation.isPending}
              data-testid="drawer-mfa-reset-confirm"
            >
              {t("actions.resetMfa.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserDetailDrawer({
  userId,
  onClose,
  onAction,
  viewerRole,
  currentUserId,
}: UserDetailDrawerProps) {
  const { t } = useTranslation("users")
  const { data: user, isLoading, isError } = useUserDetail(userId)

  return (
    <Sheet
      open={!!userId}
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[420px] gap-0 p-0 bg-card"
        showCloseButton={false}
        data-testid="user-detail-drawer"
      >
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
          <DrawerContent
            user={user}
            onClose={onClose}
            onAction={onAction}
            viewerRole={viewerRole}
            currentUserId={currentUserId}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

export { UserDetailDrawer }
