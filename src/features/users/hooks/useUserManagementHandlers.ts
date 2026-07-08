import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useToastStore } from "@/store/toastStore"
import { adminUserDetail, PATHS } from "@/router/paths"
import { buildActionToastPayload } from "@/features/users/utils"
import { UserStatusSchema } from "@/features/users/api/schema"
import type { UserListItem, UserDetail } from "@/features/users/api/schema"
import type {
  UserActionType,
  UserModalActionType,
  InviteSuccessResult,
} from "@/features/users/types"

type ActiveAction = {
  type: UserModalActionType
  user: { id: string; first_name: string; last_name: string }
}

type ResetMfaUser = { id: string; first_name: string; last_name: string }

export function useUserManagementHandlers() {
  const navigate = useNavigate()
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null)
  const [resetMfaUser, setResetMfaUser] = useState<ResetMfaUser | null>(null)

  function handleAction(type: UserActionType, user: UserListItem) {
    if (type === "approve") {
      navigate(PATHS.PENDING_APPROVALS, { state: { highlightUserId: user.id } })
      return
    }
    if (type === "reset-mfa") {
      setResetMfaUser({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      })
      return
    }
    // Defer dialog open so Base UI Menu finishes its close/focus-restore cycle
    // before the Dialog mounts. Without this, the menu's cleanup races with
    // the dialog and the dialog never appears (see mui/base-ui#3149).
    setTimeout(() => {
      setActiveAction({
        type,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      })
    }, 0)
  }

  function handleDrawerAction(type: UserActionType, user: UserDetail) {
    setSelectedUserId(null)
    if (type === "approve") {
      navigate(PATHS.PENDING_APPROVALS, { state: { highlightUserId: user.id } })
      return
    }
    if (type === "reset-mfa") {
      setResetMfaUser({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      })
      return
    }
    setActiveAction({
      type,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    })
  }

  function handleActionSuccess() {
    if (!activeAction) return
    const name = `${activeAction.user.first_name} ${activeAction.user.last_name}`
    showToast(buildActionToastPayload(activeAction.type, name, t))
    setActiveAction(null)
  }

  function handleResetMfaSuccess() {
    if (!resetMfaUser) return
    const name = `${resetMfaUser.first_name} ${resetMfaUser.last_name}`
    showToast({
      variant: "success",
      title: t("actions.resetMfa.success.title"),
      message: t("actions.resetMfa.success.message", { name }),
    })
    setResetMfaUser(null)
  }

  function handleInviteSuccess(result: InviteSuccessResult) {
    if (result.type === UserStatusSchema.enum.pending_approval) {
      const name = `${result.firstName} ${result.lastName}`
      showToast({
        variant: "warning",
        title: t("inviteBanner.pendingApproval.title"),
        message: t("inviteBanner.pendingApproval.message", { name }),
        actionLabel: result.subjectId
          ? t("inviteBanner.pendingApproval.viewProfile")
          : undefined,
        onAction: result.subjectId
          ? () => navigate(adminUserDetail(result.subjectId!))
          : undefined,
      })
    } else {
      const name = `${result.user.first_name} ${result.user.last_name}`
      showToast({
        variant: "success",
        title: t("inviteBanner.invited.title"),
        message: t("inviteBanner.invited.message", {
          name,
          email: result.user.email,
        }),
        actionLabel: t("inviteBanner.invited.viewProfile"),
        onAction: () => navigate(adminUserDetail(result.user.id)),
      })
    }
  }

  return {
    selectedUserId,
    setSelectedUserId,
    activeAction,
    setActiveAction,
    resetMfaUser,
    setResetMfaUser,
    handleAction,
    handleDrawerAction,
    handleActionSuccess,
    handleResetMfaSuccess,
    handleInviteSuccess,
  }
}
