/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import App from "@/App"
import { PATHS } from "./paths"

const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"))
const ForgotPasswordPage = lazy(
  () => import("@/features/auth/components/ForgotPasswordPage")
)
const ResetPasswordPage = lazy(
  () => import("@/features/auth/components/ResetPasswordPage")
)
const ProtectedLayout = lazy(() => import("./ProtectedLayout"))
const NotFoundPage = lazy(
  () => import("@/features/not-found/components/NotFoundPage")
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
    ],
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
