import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { logout } from "@/features/auth/api/logoutApi"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"

export function useLogout() {
  const clearTokens = useAuthStore(s => s.clearTokens)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearTokens()
      navigate(PATHS.LOGIN, { replace: true })
    },
  })
}
