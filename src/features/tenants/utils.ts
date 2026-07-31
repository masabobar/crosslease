import {
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  SUPPORT_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"

export type TenantDetailTabKey =
  | "overview"
  | "modules"
  | "governance"
  | "grants"
  | "licence_limits"

export type TenantDetailViewer = {
  role: UserRole | null | undefined
  /** The viewer's own tenant — null for platform roles. */
  tenantId: string | null
  /** Auditor engagement window; null for every other role. */
  accessValidUntil: string | null
}

/**
 * Derives Tenant Detail tab visibility from the viewer's role, per the US 29.4
 * permission matrix:
 *
 * - System Admin: every tab.
 * - Support User: Identity & Status + Module Profile (requires an active grant, which
 *   the backend enforces — it answers 404 without one).
 * - Auditor: Governance History only, own tenant, inside the engagement window.
 * - Power User (Bank Admin): Identity & Status + Module Profile, **own tenant only**,
 *   read-only. Governance History is ✗ in the matrix even though the backend grants
 *   `tenant:governance_history` to the role — see Q-048 in input/open-questions.md.
 */
export function getTenantDetailTabVisibility(
  viewer: TenantDetailViewer,
  tenantId: string | undefined
): Record<TenantDetailTabKey, boolean> {
  const isAdmin = viewer.role === SYSTEM_ADMIN_ROLE
  const isSupportUser = viewer.role === SUPPORT_USER_ROLE
  const isAuditorEngaged =
    viewer.role === AUDITOR_ROLE &&
    !!viewer.tenantId &&
    viewer.tenantId === tenantId &&
    !!viewer.accessValidUntil &&
    new Date(viewer.accessValidUntil) > new Date()
  const isBankAdminOwnTenant =
    viewer.role === BANK_POWER_USER_ROLE &&
    !!viewer.tenantId &&
    viewer.tenantId === tenantId

  const canReadIdentityAndModules =
    isAdmin || isSupportUser || isBankAdminOwnTenant

  return {
    overview: canReadIdentityAndModules,
    modules: canReadIdentityAndModules,
    governance: isAdmin || isAuditorEngaged,
    grants: isAdmin,
    licence_limits: isAdmin,
  }
}
