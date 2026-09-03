import { useLocation, useMatch } from "react-router-dom"
import { PATHS } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUserDetail } from "@/features/users/hooks/useUserDetail"
import { useTenantDetail } from "@/features/tenants/hooks/useTenantDetail"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { useDuplicatePairs } from "@/features/partners/hooks/useDuplicatePairs"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import { TENANT_LIST_ALLOWED_ROLES } from "@/features/tenants/types"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"

export type BreadcrumbLabelKey =
  | "breadcrumb.home"
  | "breadcrumb.platformAdministration"
  | "breadcrumb.userManagement"
  | "breadcrumb.pendingApprovals"
  | "breadcrumb.myProfile"
  | "breadcrumb.auditTrail"
  | "breadcrumb.auditEvent"
  | "breadcrumb.notificationConfiguration"
  | "breadcrumb.tenantManagement"
  | "breadcrumb.createTenant"
  | "breadcrumb.partnerManagement"
  | "breadcrumb.submitPartner"
  | "breadcrumb.duplicateQueue"
  | "breadcrumb.cases"

export type Crumb = {
  labelKey?: BreadcrumbLabelKey
  label?: string
  path?: string
}

const BREADCRUMBS: Record<string, Crumb[]> = {
  [PATHS.CASE_LIST]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.cases" },
  ],
  [PATHS.USER_MANAGEMENT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.userManagement" },
  ],
  [PATHS.PENDING_APPROVALS]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.pendingApprovals" },
  ],
  [PATHS.SETTINGS_PROFILE]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.myProfile" },
  ],
  [PATHS.AUDIT_TRAIL]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.auditTrail" },
  ],
  [PATHS.NOTIFICATION_CONFIGURATION]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.notificationConfiguration" },
  ],
  [PATHS.TENANT_MANAGEMENT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.tenantManagement" },
  ],
  [PATHS.TENANT_MANAGEMENT_CREATE]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.tenantManagement", path: PATHS.TENANT_MANAGEMENT },
    { labelKey: "breadcrumb.createTenant" },
  ],
  [PATHS.PARTNER_REGISTRY]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.partnerManagement" },
  ],
  [PATHS.PARTNER_SUBMIT]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.partnerManagement", path: PATHS.PARTNER_REGISTRY },
    { labelKey: "breadcrumb.submitPartner" },
  ],
  [PATHS.PARTNER_DUPLICATES]: [
    { labelKey: "breadcrumb.home" },
    { labelKey: "breadcrumb.platformAdministration" },
    { labelKey: "breadcrumb.duplicateQueue" },
  ],
}

/**
 * Resolves the breadcrumb trail for the current route, fetching whichever
 * detail record (user / tenant / partner / duplicate pair) the route needs
 * to render its final crumb label.
 */
export function useBreadcrumbs(): Crumb[] {
  const location = useLocation()
  const userDetailMatch = useMatch(PATHS.USER_DETAIL)
  const auditDetailMatch = useMatch(PATHS.AUDIT_TRAIL_DETAIL)
  const tenantCreateMatch = useMatch(PATHS.TENANT_MANAGEMENT_CREATE)
  const tenantDetailMatchRaw = useMatch(PATHS.TENANT_DETAIL)
  const tenantDetailMatch = tenantCreateMatch ? null : tenantDetailMatchRaw
  const partnerSubmitMatch = useMatch(PATHS.PARTNER_SUBMIT)
  const partnerDuplicateDetailMatch = useMatch(PATHS.PARTNER_DUPLICATE_DETAIL)
  const partnerDetailMatchRaw = useMatch(PATHS.PARTNER_DETAIL)
  const partnerDetailMatch = partnerSubmitMatch ? null : partnerDetailMatchRaw

  const { data: currentUser } = useCurrentUser()
  const { data: detailUser } = useUserDetail(userDetailMatch?.params.id ?? null)
  const { data: detailTenant } = useTenantDetail(
    tenantDetailMatch?.params.id ?? null
  )
  const { data: detailPartner } = usePartnerDetail(
    partnerDetailMatch?.params.id ?? null
  )
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const duplicatesTenantId =
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)
  const { data: duplicatePairs } = useDuplicatePairs(
    partnerDuplicateDetailMatch ? duplicatesTenantId : null
  )
  const duplicatePair = duplicatePairs?.items.find(
    p => p.pair_id === partnerDuplicateDetailMatch?.params.pairId
  )
  const { data: duplicatePartnerA } = usePartnerDetail(
    duplicatePair?.partner_a_id ?? null
  )
  const { data: duplicatePartnerB } = usePartnerDetail(
    duplicatePair?.partner_b_id ?? null
  )

  if (userDetailMatch) {
    return [
      { labelKey: "breadcrumb.home" },
      { labelKey: "breadcrumb.platformAdministration" },
      { labelKey: "breadcrumb.userManagement", path: PATHS.USER_MANAGEMENT },
      {
        label: detailUser
          ? `${detailUser.first_name} ${detailUser.last_name}`
          : "…",
      },
    ]
  }

  if (tenantDetailMatch) {
    // The Bank Admin reaches its own tenant directly and has no tenant list (US 29.3),
    // so the parent crumb is plain text for them — linking it would land on /403.
    const canReachTenantList =
      !!currentUser && TENANT_LIST_ALLOWED_ROLES.includes(currentUser.role)
    return [
      { labelKey: "breadcrumb.home" },
      { labelKey: "breadcrumb.platformAdministration" },
      {
        labelKey: "breadcrumb.tenantManagement",
        ...(canReachTenantList && { path: PATHS.TENANT_MANAGEMENT }),
      },
      { label: detailTenant?.name ?? "…" },
    ]
  }

  if (auditDetailMatch) {
    return [
      { labelKey: "breadcrumb.home" },
      { labelKey: "breadcrumb.platformAdministration" },
      { labelKey: "breadcrumb.auditTrail", path: PATHS.AUDIT_TRAIL },
      { labelKey: "breadcrumb.auditEvent" },
    ]
  }

  if (partnerDuplicateDetailMatch) {
    return [
      { labelKey: "breadcrumb.home" },
      { labelKey: "breadcrumb.platformAdministration" },
      {
        labelKey: "breadcrumb.duplicateQueue",
        path: PATHS.PARTNER_DUPLICATES,
      },
      {
        label:
          duplicatePartnerA && duplicatePartnerB
            ? `${duplicatePartnerA.display_name} vs ${duplicatePartnerB.display_name}`
            : "…",
      },
    ]
  }

  if (partnerDetailMatch) {
    return [
      { labelKey: "breadcrumb.home" },
      { labelKey: "breadcrumb.platformAdministration" },
      {
        labelKey: "breadcrumb.partnerManagement",
        path: PATHS.PARTNER_REGISTRY,
      },
      { label: detailPartner?.display_name ?? "…" },
    ]
  }

  return (
    BREADCRUMBS[location.pathname] ??
    Object.entries(BREADCRUMBS)
      .filter(([path]) => location.pathname.startsWith(path + "/"))
      .map(([, c]) => c)[0] ?? [{ labelKey: "breadcrumb.home" }]
  )
}
