import {
  AUDITOR_ROLE,
  BACK_OFFICE_ROLE,
  BANK_POWER_USER_ROLE,
  SUPPORT_USER_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import type {
  GovernedActionType,
  GovernedActionStatus,
} from "@/features/governedActions/api/schema"

// Roles that hold `governed_action:list` in refinext-api's
// `src/app/shared/permissions/matrix.py`. front_office holds NO governed_action:*
// permission at all, so it 403s on the pending-approvals query — it must not reach
// the screen (PRD1042-1496). Do not reuse USER_MANAGEMENT_ALLOWED_ROLES here: that
// list includes front_office and is wider than the permission it fronts.
export const GOVERNED_ACTION_LIST_ALLOWED_ROLES: readonly UserRole[] = [
  SYSTEM_ADMIN_ROLE,
  SUPPORT_USER_ROLE,
  AUDITOR_ROLE,
  BANK_POWER_USER_ROLE,
  BACK_OFFICE_ROLE,
]

// Mirrors ACTION_TYPE_POLICY.approve_roles in refinext-api's governed_actions/constants.py.
// Platform-level types are approved by System Admin only; tenant-level partner_* types
// are approved by Back Office only — System Admin is deliberately excluded from those
// even though it holds the route-level governed_action:approve permission.
export const GOVERNED_ACTION_APPROVE_ROLES: Record<
  GovernedActionType,
  UserRole
> = {
  tenant_create: SYSTEM_ADMIN_ROLE,
  tenant_suspend: SYSTEM_ADMIN_ROLE,
  tenant_reactivate: SYSTEM_ADMIN_ROLE,
  tenant_archive: SYSTEM_ADMIN_ROLE,
  user_platform_invite: SYSTEM_ADMIN_ROLE,
  user_role_change: SYSTEM_ADMIN_ROLE,
  user_auditor_period_update: SYSTEM_ADMIN_ROLE,
  user_email_change: SYSTEM_ADMIN_ROLE,
  module_activate: SYSTEM_ADMIN_ROLE,
  product_template_activate: SYSTEM_ADMIN_ROLE,
  product_template_deprecate: SYSTEM_ADMIN_ROLE,
  partner_archive: BACK_OFFICE_ROLE,
  partner_confirm: BACK_OFFICE_ROLE,
  partner_role_assign: BACK_OFFICE_ROLE,
  partner_identity_change: BACK_OFFICE_ROLE,
  partner_merge: BACK_OFFICE_ROLE,
}

export function canReviewGovernedAction(
  actionType: GovernedActionType,
  role: UserRole | undefined
): boolean {
  return !!role && GOVERNED_ACTION_APPROVE_ROLES[actionType] === role
}

// Shared status → dot-color mapping, used by ActionRow's status indicator and
// by ChainEntry's request-chain dots. Previously defined independently in
// three places with drifted values for withdrawn/expired (gray-400 vs
// slate-300) and pending (amber-400 vs amber-600) — reconciled to the value
// used in the majority of the original definitions.
export const GOVERNED_ACTION_STATUS_DOT_COLOR: Record<
  GovernedActionStatus,
  string
> = {
  pending: "bg-amber-600",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-slate-300",
  expired: "bg-slate-300",
}
