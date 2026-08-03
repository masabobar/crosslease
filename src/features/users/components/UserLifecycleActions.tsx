import {
  Ban,
  Mail,
  ShieldOff,
  UserCheck,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { PATHS } from "@/router/paths"
import { getUserActionVisibility } from "@/features/users/utils"
import { USER_ACTION_TYPE } from "@/features/users/types"
import type { UserModalActionType, UserRole } from "@/features/users/types"
import type { UserDetail } from "@/features/users/api/schema"

const ACTION_BUTTON_CLASS =
  "h-auto gap-[6px] rounded-[12px] px-[10px] py-[8px] text-sm"

type UserLifecycleActionsProps = {
  user: UserDetail
  viewerRole: UserRole | null | undefined
  onModalAction: (action: UserModalActionType) => void
  onResetMfa: () => void
}

/** Suspend / reactivate / deactivate / approve / resend / reset-MFA row on the detail page. */
export function UserLifecycleActions({
  user,
  viewerRole,
  onModalAction,
  onResetMfa,
}: UserLifecycleActionsProps) {
  const { t } = useTranslation("users")
  const navigate = useNavigate()

  const {
    canApprove,
    canResendInvitation,
    canSuspend,
    canReactivate,
    canDeactivate,
    canResetMfa,
    hasAnyAction,
  } = getUserActionVisibility(user.status, user.role, viewerRole)

  if (!hasAnyAction) return null

  return (
    <div className="flex items-center gap-[10px]">
      {canSuspend && (
        <Button
          variant="outline"
          data-testid="detail-suspend-button"
          onClick={() => onModalAction(USER_ACTION_TYPE.SUSPEND)}
          className={ACTION_BUTTON_CLASS}
        >
          <UserRoundX size={16} />
          {t("detail.page.actions.suspendUser")}
        </Button>
      )}
      {canReactivate && (
        <Button
          variant="outline"
          data-testid="detail-reactivate-button"
          onClick={() => onModalAction(USER_ACTION_TYPE.REACTIVATE)}
          className={ACTION_BUTTON_CLASS}
        >
          <UserRoundCheck size={16} />
          {t("actions.reactivate.label")}
        </Button>
      )}
      {canDeactivate && (
        <Button
          variant="outline"
          data-testid="detail-deactivate-button"
          onClick={() => onModalAction(USER_ACTION_TYPE.DEACTIVATE)}
          className={ACTION_BUTTON_CLASS}
        >
          <Ban size={16} />
          {t("detail.page.actions.deactivateUser")}
        </Button>
      )}
      {canApprove && (
        <Button
          variant="outline"
          data-testid="detail-approve-button"
          onClick={() =>
            navigate(PATHS.PENDING_APPROVALS, {
              state: { highlightUserId: user.id },
            })
          }
          className={ACTION_BUTTON_CLASS}
        >
          <UserCheck size={16} />
          {t("table.actions.approve")}
        </Button>
      )}
      {canResendInvitation && (
        <Button
          variant="outline"
          data-testid="detail-resend-invitation-button"
          onClick={() => onModalAction(USER_ACTION_TYPE.RESEND_INVITATION)}
          className={ACTION_BUTTON_CLASS}
        >
          <Mail size={16} />
          {t("actions.resend-invitation.label")}
        </Button>
      )}
      {canResetMfa && (
        <Button
          variant="outline"
          data-testid="detail-reset-mfa-button"
          onClick={onResetMfa}
          className={ACTION_BUTTON_CLASS}
        >
          <ShieldOff size={16} />
          {t("actions.resetMfa.label")}
        </Button>
      )}
    </div>
  )
}
