/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import { PATHS } from "./paths"
import { RoleGuard } from "@/router/RoleGuard"
import {
  USER_MANAGEMENT_ALLOWED_ROLES,
  INTERNAL_BANK_ROLES,
  LC_ONLY_ROLES,
} from "@/features/users/types"
import { GOVERNED_ACTION_LIST_ALLOWED_ROLES } from "@/features/governedActions/constants"
import { AUDIT_TRAIL_ALLOWED_ROLES } from "@/features/audit/types"
import { NOTIFICATION_CONFIG_ALLOWED_ROLES } from "@/features/notifications/types"
import {
  TENANT_LIST_ALLOWED_ROLES,
  TENANT_CREATE_ALLOWED_ROLES,
  TENANT_DETAIL_ALLOWED_ROLES,
} from "@/features/tenants/types"
import {
  PARTNER_VIEW_ALLOWED_ROLES,
  PARTNER_SUBMIT_ALLOWED_ROLES,
} from "@/features/partners/types"
import {
  PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES,
  PRODUCT_TEMPLATE_READ_ALLOWED_ROLES,
} from "@/features/productTemplates/types"
import {
  FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES,
  FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES,
} from "@/features/frameworkAgreements/types"
import {
  CASE_CHECKLIST_READ_ALLOWED_ROLES,
  WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES,
} from "@/features/workflowTaskCatalog/types"
import { DOCUMENT_REQUIREMENT_CATALOG_READ_ALLOWED_ROLES } from "@/features/documentRequirements/types"

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
const App = lazy(() => import("@/App"))
const NotFoundPage = lazy(
  () => import("@/features/errors/components/NotFoundPage")
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
const LcFrameworkAgreementsPage = lazy(
  () => import("@/features/lc/components/LcFrameworkAgreementsPage")
)
const PendingApprovalsPage = lazy(
  () => import("@/features/governedActions/components/PendingApprovalsPage")
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
const NotificationConfigPage = lazy(
  () => import("@/features/notifications/components/NotificationConfigPage")
)
const TenantManagementPage = lazy(
  () => import("@/features/tenants/components/TenantManagementPage")
)
const CreateTenantPage = lazy(
  () => import("@/features/tenants/components/CreateTenantPage")
)
const TenantDetailPage = lazy(
  () => import("@/features/tenants/components/TenantDetailPage")
)
const PartnerRegistryPage = lazy(
  () => import("@/features/partners/components/PartnerRegistryPage")
)
const SubmitPartnerPage = lazy(
  () => import("@/features/partners/components/SubmitPartnerPage")
)
const PartnerDetailPage = lazy(
  () => import("@/features/partners/components/PartnerDetailPage")
)
const DuplicateQueuePage = lazy(
  () => import("@/features/partners/components/DuplicateQueuePage")
)
const DuplicatePairDetailPage = lazy(
  () => import("@/features/partners/components/DuplicatePairDetailPage")
)
const ProductTemplateListPage = lazy(
  () => import("@/features/productTemplates/components/ProductTemplateListPage")
)
const CreateProductTemplateWizardPage = lazy(
  () =>
    import("@/features/productTemplates/components/CreateProductTemplateWizardPage")
)
const VersionHistoryPage = lazy(
  () => import("@/features/productTemplates/components/VersionHistoryPage")
)
const ProductTemplateDetailPage = lazy(
  () =>
    import("@/features/productTemplates/components/ProductTemplateDetailPage")
)
const FrameworkAgreementListPage = lazy(
  () =>
    import("@/features/frameworkAgreements/components/FrameworkAgreementListPage")
)
const CreateFrameworkAgreementWizardPage = lazy(
  () =>
    import("@/features/frameworkAgreements/components/CreateFrameworkAgreementWizardPage")
)
const EditFrameworkAgreementWizardPage = lazy(
  () =>
    import("@/features/frameworkAgreements/components/EditFrameworkAgreementWizardPage")
)
const FrameworkAgreementDetailPage = lazy(
  () =>
    import("@/features/frameworkAgreements/components/FrameworkAgreementDetailPage")
)
const WorkflowTaskCatalogListPage = lazy(
  () =>
    import("@/features/workflowTaskCatalog/components/WorkflowTaskCatalogListPage")
)
const CaseChecklistPage = lazy(
  () => import("@/features/workflowTaskCatalog/components/CaseChecklistPage")
)
const WorkflowTaskCatalogDetailPage = lazy(
  () =>
    import("@/features/workflowTaskCatalog/components/WorkflowTaskCatalogDetailPage")
)
const DocumentRequirementCatalogListPage = lazy(
  () =>
    import("@/features/documentRequirements/components/DocumentRequirementCatalogListPage")
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
          <Suspense fallback={null}>
            <RoleGuard allowed={INTERNAL_BANK_ROLES}>
              <App />
            </RoleGuard>
          </Suspense>
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
            <RoleGuard allowed={GOVERNED_ACTION_LIST_ALLOWED_ROLES}>
              <PendingApprovalsPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.TENANT_MANAGEMENT,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={TENANT_LIST_ALLOWED_ROLES}>
              <TenantManagementPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.TENANT_MANAGEMENT_CREATE,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={TENANT_CREATE_ALLOWED_ROLES}>
              <CreateTenantPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.TENANT_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={TENANT_DETAIL_ALLOWED_ROLES}>
              <TenantDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PARTNER_REGISTRY,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PARTNER_VIEW_ALLOWED_ROLES}>
              <PartnerRegistryPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PARTNER_SUBMIT,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PARTNER_SUBMIT_ALLOWED_ROLES}>
              <SubmitPartnerPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PARTNER_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PARTNER_VIEW_ALLOWED_ROLES}>
              <PartnerDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PARTNER_DUPLICATES,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PARTNER_VIEW_ALLOWED_ROLES}>
              <DuplicateQueuePage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PARTNER_DUPLICATE_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PARTNER_VIEW_ALLOWED_ROLES}>
              <DuplicatePairDetailPage />
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
        path: PATHS.NOTIFICATION_CONFIGURATION,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={NOTIFICATION_CONFIG_ALLOWED_ROLES}>
              <NotificationConfigPage />
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
        path: PATHS.PRODUCT_TEMPLATE_LIST,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PRODUCT_TEMPLATE_READ_ALLOWED_ROLES}>
              <ProductTemplateListPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PRODUCT_TEMPLATE_CREATE,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES}>
              <CreateProductTemplateWizardPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PRODUCT_TEMPLATE_VERSION_HISTORY,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PRODUCT_TEMPLATE_READ_ALLOWED_ROLES}>
              <VersionHistoryPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        // Read-only, so the READ role set — unlike NEW_VERSION below, which authors a draft and
        // therefore takes the CREATE set. Both live under `:templateId/versions/:versionNumber`;
        // React Router ranks by specificity, so the longer `/edit` path still wins for edit URLs.
        path: PATHS.PRODUCT_TEMPLATE_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PRODUCT_TEMPLATE_READ_ALLOWED_ROLES}>
              <ProductTemplateDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.PRODUCT_TEMPLATE_NEW_VERSION,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES}>
              <CreateProductTemplateWizardPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.FRAMEWORK_AGREEMENT_LIST,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES}>
              <FrameworkAgreementListPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.FRAMEWORK_AGREEMENT_CREATE,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES}>
              <CreateFrameworkAgreementWizardPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.FRAMEWORK_AGREEMENT_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={FRAMEWORK_AGREEMENT_READ_ALLOWED_ROLES}>
              <FrameworkAgreementDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        // MANAGE, not READ: the detail route above only requires READ, so without the
        // narrower guard a reader could deep-link into an edit form the BE would 403.
        path: PATHS.FRAMEWORK_AGREEMENT_EDIT,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES}>
              <EditFrameworkAgreementWizardPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.WORKFLOW_TASK_CATALOG_LIST,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES}>
              <WorkflowTaskCatalogListPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.WORKFLOW_TASK_CATALOG_DETAIL,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={WORKFLOW_TASK_CATALOG_READ_ALLOWED_ROLES}>
              <WorkflowTaskCatalogDetailPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        path: PATHS.DOCUMENT_REQUIREMENT_CATALOG_LIST,
        element: (
          <Suspense fallback={null}>
            <RoleGuard
              allowed={DOCUMENT_REQUIREMENT_CATALOG_READ_ALLOWED_ROLES}
            >
              <DocumentRequirementCatalogListPage />
            </RoleGuard>
          </Suspense>
        ),
      },
      {
        // Guarded by the RUNTIME read set, not the catalog one: the case workers who work a
        // checklist have no business on the catalogue authoring screens, and vice versa.
        path: PATHS.CASE_CHECKLIST,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={CASE_CHECKLIST_READ_ALLOWED_ROLES}>
              <CaseChecklistPage />
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
      {
        path: PATHS.LC_FRAMEWORK_AGREEMENTS,
        element: (
          <Suspense fallback={null}>
            <RoleGuard allowed={LC_ONLY_ROLES}>
              <LcFrameworkAgreementsPage />
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
