import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { logout } from "@/features/auth/api/logoutApi"
import { useAuthStore } from "@/store/authStore"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import { ApiError } from "@/lib/api"
import { PATHS } from "@/router/paths"

export function useLogout() {
  const { t } = useTranslation("auth")
  const clearAuth = useAuthStore(s => s.clearAuth)
  const setSelectedTenantId = useTenantSelectionStore(
    s => s.setSelectedTenantId
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onError: err => {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}`, { defaultValue: t("errors.generic") })
          : t("errors.generic")
      )
    },
    onSettled: () => {
      clearAuth()
      setSelectedTenantId(null)
      queryClient.clear()
      navigate(PATHS.LOGIN, { replace: true })
    },
  })
}
