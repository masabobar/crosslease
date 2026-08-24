import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useResetUserMfa } from "@/features/users/hooks/useUserActions"
import { useToastStore } from "@/store/toastStore"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

type UseResetMfaWithToast = {
  resetMfa: (userId: string, name: string, onSettled?: () => void) => void
  isPending: boolean
}

/**
 * Wraps the reset-MFA mutation with the success/error toasts every host surface
 * (list page, detail page, detail drawer) previously duplicated.
 *
 * `onSettled` runs on both outcomes so callers can close their confirm dialog once,
 * instead of repeating the close in a success and an error branch.
 */
export function useResetMfaWithToast(): UseResetMfaWithToast {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const mutation = useResetUserMfa()

  function resetMfa(userId: string, name: string, onSettled?: () => void) {
    mutation.mutate(userId, {
      onSuccess: () => {
        showToast({
          variant: "success",
          title: t("actions.resetMfa.success.title"),
          message: t("actions.resetMfa.success.message", { name }),
        })
      },
      onError: (err: unknown) => {
        toast.error(resolveApiErrorMessage(err, t))
      },
      onSettled: () => onSettled?.(),
    })
  }

  return { resetMfa, isPending: mutation.isPending }
}
