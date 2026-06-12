import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { AppLayout } from "@/components/layout/AppLayout"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LC_ONLY_ROLES } from "@/features/users/types"

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: currentUser, isLoading, isError } = useCurrentUser()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  // Wait for user profile before deciding where to land; treat a fetch error the
  // same as loading — don't proceed into the app with a null user profile
  if (isLoading || isError) return null

  // LC users must land on their dedicated workspace, not the internal dashboard
  if (currentUser && LC_ONLY_ROLES.includes(currentUser.role)) {
    const isOnLcPath = location.pathname.startsWith(PATHS.LC_WORKSPACE)
    if (!isOnLcPath) {
      return <Navigate to={PATHS.LC_WORKSPACE} replace />
    }
  }

  return <AppLayout />
}
