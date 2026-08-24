import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { logout } from "@/features/auth/api/logoutApi"
import { useAuthStore } from "@/store/authStore"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import { PATHS } from "@/router/paths"
import { showApiError } from "@/lib/apiErrorMessage"

export function useLogout(): UseMutationResult<void, Error, void> {
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
      showApiError(err, t)
    },
    onSettled: () => {
      clearAuth()
      setSelectedTenantId(null)
      queryClient.clear()
      navigate(PATHS.LOGIN, { replace: true })
    },
  })
}
