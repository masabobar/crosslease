import { Navigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { AppLayout } from "@/components/layout/AppLayout"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LC_ONLY_ROLES } from "@/features/users/types"
import { ApiError } from "@/lib/api"
import { TenantSuspendedPage } from "@/features/errors/components/TenantSuspendedPage"
import { Button } from "@/components/ui/button"

const TENANT_NOT_ACTIVE_ERROR_CODE = "TENANT_NOT_ACTIVE"

export default function ProtectedLayout() {
  const { t } = useTranslation("common")
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const {
    data: currentUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useCurrentUser()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  if (isLoading) return null

  if (isError) {
    if (
      error instanceof ApiError &&
      error.code === TENANT_NOT_ACTIVE_ERROR_CODE
    ) {
      return <TenantSuspendedPage />
    }
    return (
      <div
        data-testid="protected-layout-error"
        className="flex min-h-screen flex-col items-center justify-center gap-3"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("errors.title")}
        </h1>
        <p className="max-w-sm text-center text-gray-500">
          {t("errors.generic")}
        </p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          {t("errors.retry")}
        </Button>
      </div>
    )
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
