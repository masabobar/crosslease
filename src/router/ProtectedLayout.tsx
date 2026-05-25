import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { PATHS } from "@/router/paths"
import { AppLayout } from "@/components/layout/AppLayout"

export default function ProtectedLayout() {
  const accessToken = useAuthStore(s => s.accessToken)

  if (!accessToken) {
    return <Navigate to={PATHS.LOGIN} replace />
  }

  return <AppLayout />
}
