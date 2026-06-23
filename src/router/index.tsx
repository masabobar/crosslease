/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import App from "@/App"
import { PATHS } from "./paths"
import { RoleGuard } from "@/router/RoleGuard"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  INTERNAL_BANK_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"
import { AUDIT_TRAIL_ALLOWED_ROLES } from "@/features/audit/types"
import { TENANT_MANAGEMENT_ALLOWED_ROLES } from "@/features/tenants/types"

const LoginPage = lazy(() => import("@/features/auth/components/LoginPage"))
const ForgotPasswordPage = lazy(
  () => import("@/features/auth/components/ForgotPasswordPage")
)
const ResetPasswordPage = lazy(
  () => import("@/features/auth/components/ResetPasswordPage")
)
const ResetPasswordVerifyPage = lazy(
  () => import("@/features/auth/components/ResetPasswordVerifyPage")
)
const MfaVerifyPage = lazy(
  () => import("@/features/auth/components/MfaVerifyPage")
)
const MfaEnrollPage = lazy(
  () => import("@/features/auth/components/MfaEnrollPage")
)
const ActivateAccountPage = lazy(
  () => import("@/features/auth/components/ActivateAccountPage")
)
const VerifyEmailPage = lazy(
  () => import("@/features/auth/components/VerifyEmailPage")
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
const LeasingCompanyWorkspacePage = lazy(
  () => import("@/features/lc/components/LeasingCompanyWorkspacePage")
)
const PendingApprovalsPage = lazy(
  () => import("@/features/governed-actions/components/PendingApprovalsPage")
)
const SelfProfilePage = lazy(
  () => import("@/features/users/components/SelfProfilePage")
)
const AuditTrailPage = lazy(
  () => import("@/features/audit/components/AuditTrailPage")
)
const AuditEventDetailPage = lazy(
  () => import("@/features/audit/components/AuditEventDetailPage")
)
const TenantManagementPage = lazy(
  () => import("@/features/tenants/components/TenantManagementPage")
)
const CreateTenantPage = lazy(
  () => import("@/features/tenants/components/CreateTenantPage")
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
    path: PATHS.RESET_PASSWORD_VERIFY,
    element: (
      <Suspense fallback={null}>
        <ResetPasswordVerifyPage />
      </Suspense>
    ),
  },
  {
    path: PATHS.MFA_VERIFY,
    element: (
      <Suspense fallback={null}>
        <MfaVerifyPage />
      </Suspense>
    ),
  },
  {
    path: PATHS.MFA_ENROLL,
    element: (
      <Suspense fallback={null}>
        <MfaEnrollPage />
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
    path: PATHS.VERIFY_EMAIL,
    element: (
      <Suspense fallback={null}>
        <VerifyEmailPage />
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
        element: (
          <RoleGuard allowed={INTERNAL_BANK_ROLES}>
            <App />
          </RoleGuard>
        ),
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
      {
        path: PATHS.PENDING_APPROVALS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={USER_MANAGEMENT_ALLOWED_ROLES}>
              <PendingApprovalsPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.TENANT_MANAGEMENT,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={TENANT_MANAGEMENT_ALLOWED_ROLES}>
              <TenantManagementPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.TENANT_MANAGEMENT_CREATE,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={TENANT_MANAGEMENT_ALLOWED_ROLES}>
              <CreateTenantPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.AUDIT_TRAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={AUDIT_TRAIL_ALLOWED_ROLES}>
              <AuditTrailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.AUDIT_TRAIL_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={AUDIT_TRAIL_ALLOWED_ROLES}>
              <AuditEventDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.SETTINGS_PROFILE,
        element: (
          <Suspense fallback={null}>
            <SelfProfilePage />
          </Suspense>
        ),
      },
      {
        path: PATHS.LC_WORKSPACE,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LeasingCompanyWorkspacePage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.LC_REQUESTS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LeasingCompanyWorkspacePage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.LC_STATUS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LeasingCompanyWorkspacePage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.LC_DOCUMENTS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LeasingCompanyWorkspacePage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.LC_PROPOSALS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LeasingCompanyWorkspacePage />
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
