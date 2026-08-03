import {
  roleChangeSnapshot,
  platformInviteSnapshot,
  emailChangeSnapshot,
  displaySnapshot,
  TenantCreateSnapshotSchema,
  TenantIdSnapshotSchema,
  ModuleActivateSnapshotSchema,
  AuditorPeriodUpdateSnapshotSchema,
  PartnerIdSnapshotSchema,
  PartnerMergeSnapshotSchema,
  TemplateNameSnapshotSchema,
} from "@/features/governedActions/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"

export type GovernedActionSubjectKind =
  | "user"
  | "partner"
  | "template"
  | "tenant"
  | "module"

export type GovernedActionSubject = {
  kind: GovernedActionSubjectKind
  value: string | null
}

// Action types that render a "CHANGE" section at all — shared by both hosts
// (PendingApprovalDetailDrawer wraps this in an InfoCard, ReviewRequestModal
// wraps it in its own section-label div) so the gate can't drift between them.
export const HAS_CHANGE_SECTION = new Set([
  "user_role_change",
  "user_email_change",
  "user_platform_invite",
  "user_auditor_period_update",
  "tenant_create",
  "tenant_suspend",
  "tenant_reactivate",
  "tenant_archive",
  "module_activate",
  "partner_archive",
  "partner_role_assign",
  "partner_identity_change",
  "partner_merge",
  "product_template_activate",
  "product_template_deprecate",
])

// Resolves the entity a governed action is "about" — used by both the row
// list (ActionRow) and the detail views (PendingApprovalDetailDrawer,
// ReviewRequestModal), which previously each carried their own copy of this
// switch. Callers map `kind` to their own namespaced i18n label key.
export function getGovernedActionSubject(
  action: GovernedAction
): GovernedActionSubject {
  switch (action.action_type) {
    case "user_platform_invite":
      return {
        kind: "user",
        value: platformInviteSnapshot(action).full_name ?? null,
      }
    case "user_role_change":
      return {
        kind: "user",
        value: roleChangeSnapshot(action).affected_user_email ?? null,
      }
    case "user_email_change":
      return {
        kind: "user",
        value: emailChangeSnapshot(action).old_email ?? null,
      }
    case "user_auditor_period_update":
      return {
        kind: "user",
        value:
          displaySnapshot(action, AuditorPeriodUpdateSnapshotSchema).user_id ??
          null,
      }
    case "tenant_create":
      return {
        kind: "tenant",
        value: displaySnapshot(action, TenantCreateSnapshotSchema).name ?? null,
      }
    case "tenant_suspend":
    case "tenant_reactivate":
    case "tenant_archive":
      return {
        kind: "tenant",
        value:
          displaySnapshot(action, TenantIdSnapshotSchema).tenant_id ?? null,
      }
    case "module_activate":
      return {
        kind: "module",
        value:
          displaySnapshot(action, ModuleActivateSnapshotSchema).module_key ??
          null,
      }
    case "partner_merge":
      return {
        kind: "partner",
        value:
          displaySnapshot(action, PartnerMergeSnapshotSchema)
            .source_partner_id ?? null,
      }
    case "partner_archive":
    case "partner_confirm":
    case "partner_role_assign":
    case "partner_identity_change":
      return {
        kind: "partner",
        value:
          displaySnapshot(action, PartnerIdSnapshotSchema).partner_id ?? null,
      }
    case "product_template_activate":
    case "product_template_deprecate":
      return {
        kind: "template",
        value:
          displaySnapshot(action, TemplateNameSnapshotSchema).template_name ??
          null,
      }
    default:
      return { kind: "user", value: null }
  }
}
