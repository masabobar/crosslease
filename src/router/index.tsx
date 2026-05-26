/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import App from "@/App"
import { PATHS } from "./paths"
import { RoleGuard } from "@/router/RoleGuard"
import { USER_MANAGEMENT_ALLOWED_ROLES } from "@/features/users/types"

const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"))
const ForgotPasswordPage = lazy(
  () => import("@/features/auth/components/ForgotPasswordPage")
)
const ResetPasswordPage = lazy(
  () => import("@/features/auth/components/ResetPasswordPage")
)
const ActivateAccountPage = lazy(
  () => import("@/features/auth/components/ActivateAccountPage")
)
const ProtectedLayout = lazy(() => import("./ProtectedLayout"))
const NotFoundPage = lazy(
  () => import("@/features/not-found/components/NotFoundPage")
)
const ForbiddenPage = lazy(
  () => import("@/features/errors/components/ForbiddenPage")
)
const UserManagementPage = lazy(
  () => import("@/features/users/components/UserManagementPage")
)
const UserDetailPage = lazy(
  () => import("@/features/users/components/UserDetailPage")
)

export const router = createBrowserRouter([
  {
    path: PATHS.LOGIN,
    element: (
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: PATHS.FORGOT_PASSWORD,
    element: (
      <Suspense fallback={null}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: PATHS.RESET_PASSWORD,
    element: (
      <Suspense fallback={null}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
  {
    path: PATHS.ACTIVATE_ACCOUNT,
    element: (
      <Suspense fallback={null}>
        <ActivateAccountPage />
      </Suspense>
    ),
  },
  {
    element: (
      <Suspense fallback={null}>
        <ProtectedLayout />
      </Suspense>
    ),
    children: [
      {
        path: PATHS.DASHBOARD,
        element: <App />,
      },
      {
        path: PATHS.USER_MANAGEMENT,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={USER_MANAGEMENT_ALLOWED_ROLES}>
              <UserManagementPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.USER_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={USER_MANAGEMENT_ALLOWED_ROLES}>
              <UserDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
    ],
  },
  {
    path: PATHS.FORBIDDEN,
    element: (
      <Suspense fallback={null}>
        <ForbiddenPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={null}>
        <NotFoundPage />
      </Suspense>
    ),
  },
])
