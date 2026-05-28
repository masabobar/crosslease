import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { logout } from "@/features/auth/api/logoutApi"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"

export function useLogout() {
  const clearAuth = useAuthStore(s => s.clearAuth)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
      clearAuth()
      navigate(PATHS.LOGIN, { replace: true })
    },
  })
}
