/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import App from "@/App"
import { PATHS } from "./paths"

const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"))
const ProtectedLayout = lazy(() => import("./ProtectedLayout"))

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
])
