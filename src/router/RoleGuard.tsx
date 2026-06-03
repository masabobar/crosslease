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
  const { data: currentUser, isLoading } = useCurrentUser()

  if (isLoading) return null

  if (!currentUser || !allowed.includes(currentUser.role)) {
    return <Navigate to={PATHS.FORBIDDEN} replace />
  }

  return <>{children}</>
}
