import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { AppLayout } from "@/components/layout/AppLayout"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LC_ONLY_ROLES } from "@/features/users/types"
import { ApiError } from "@/lib/api"
import { TenantSuspendedPage } from "@/features/errors/components/TenantSuspendedPage"

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: currentUser, isLoading, isError, error } = useCurrentUser()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  if (isLoading) return null

  if (isError) {
    if (error instanceof ApiError && error.code === "TENANT_NOT_ACTIVE") {
      return <TenantSuspendedPage />
    }
    return null
  }

  // LC users must land on their dedicated workspace, not the internal dashboard
  if (currentUser && LC_ONLY_ROLES.includes(currentUser.role)) {
    const isOnLcPath = location.pathname.startsWith(PATHS.LC_WORKSPACE)
    if (!isOnLcPath) {
      return <Navigate to={PATHS.LC_WORKSPACE} replace />
    }
  }

  return <AppLayout />
}
