import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PATHS } from "@/router/paths"
import type { UserRole } from "@/features/users/types"

type RoleGuardProps = {
  allowed: readonly UserRole[]
  children: ReactNode
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { data: currentUser, isLoading, isError } = useCurrentUser()

  // isError is unreachable in practice: RoleGuard only ever renders inside
  // ProtectedLayout's <Outlet />, and ProtectedLayout already renders a full
  // error state (and unmounts this subtree) for the same useCurrentUser query
  // before RoleGuard would ever see it fail — see src/router/ProtectedLayout.tsx.
  if (isLoading || isError) return null

  if (!currentUser || !allowed.includes(currentUser.role)) {
    return <Navigate to={PATHS.FORBIDDEN} replace />
  }

  return <>{children}</>
}
