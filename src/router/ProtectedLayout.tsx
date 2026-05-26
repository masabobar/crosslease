import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { AppLayout } from "@/components/layout/AppLayout"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LC_ONLY_ROLES } from "@/features/users/types"

export default function ProtectedLayout() {
  const accessToken = useAuthStore(s => s.accessToken)
  const { data: currentUser, isLoading } = useCurrentUser()

  if (!accessToken) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  // Wait for user profile before deciding where to land
  if (isLoading) return null

  // LC users must land on their dedicated workspace, not the internal dashboard
  if (currentUser && LC_ONLY_ROLES.includes(currentUser.role)) {
    const isOnLcPath = window.location.pathname.startsWith(PATHS.LC_WORKSPACE)
    if (!isOnLcPath) {
      return <Navigate to={PATHS.LC_WORKSPACE} replace />
    }
  }

  return <AppLayout />
}
