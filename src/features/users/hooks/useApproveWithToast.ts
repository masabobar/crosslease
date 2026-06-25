import { useTranslation } from "react-i18next"
import { useApproveUser } from "@/features/users/hooks/useApproveUser"
import { useToastStore } from "@/store/toastStore"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"

export function useApproveWithToast() {
  const { t } = useTranslation("users")
  const showToast = useToastStore(s => s.showToast)
  const { mutateAsync: approve, isPending } = useApproveUser()

  async function handleApprove(
    userId: string,
    onSuccess?: () => void
  ): Promise<void> {
    try {
      const result = await approve(userId)
      const name = `${result.user.first_name} ${result.user.last_name}`
      showToast({
        variant: "success",
        title: t("approveSuccess.title"),
        message: t("approveSuccess.message", {
          name,
          email: result.user.email,
        }),
      })
      onSuccess?.()
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, {
              defaultValue: t("approveSuccess.errorFallback"),
            })
          : t("approveSuccess.errorFallback")
      )
    }
  }

  return { handleApprove, isPending }
}
