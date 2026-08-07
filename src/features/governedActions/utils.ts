import {
  roleChangeSnapshot,
  platformInviteSnapshot,
  emailChangeSnapshot,
  displaySnapshot,
  GovernedActionTypeSchema,
  TenantCreateSnapshotSchema,
  TenantIdSnapshotSchema,
  ModuleActivateSnapshotSchema,
  AuditorPeriodUpdateSnapshotSchema,
  PartnerIdSnapshotSchema,
  PartnerMergeSnapshotSchema,
  TemplateNameSnapshotSchema,
} from "@/features/governedActions/api/schema"
import type {
  ActorSnapshot,
  GovernedAction,
  GovernedActionType,
} from "@/features/governedActions/api/schema"

const ACTION_TYPE = GovernedActionTypeSchema.enum

// Absent-value placeholder, matching the "—" every field renderer in this feature uses.
export const NO_VALUE = "—"

/**
 * Format an actor snapshot's display name.
 *
 * Every field on `ActorSnapshotSchema` is optional because real snapshots are observed
 * missing individual fields — so the parts are filtered before joining. Interpolating
 * them directly (`` `${first_name} ${last_name}` ``) is what previously rendered
 * "Ana undefined" whenever a snapshot carried a first name but no last name.
 *
 * Shared by the row list, the review modal, the detail drawer and the result toasts;
 * all five previously carried their own copy of this expression.
 */
export function formatActorName(
  snapshot: ActorSnapshot | null | undefined
): string {
  if (!snapshot) return NO_VALUE
  const name = [snapshot.first_name, snapshot.last_name]
    .filter(part => !!part?.trim())
    .join(" ")
  return name || NO_VALUE
}

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
// Typed as Set<GovernedActionType> rather than the inferred Set<string> so a stale or
// misspelled entry is a compile error instead of a section that silently stops rendering.
export const HAS_CHANGE_SECTION: ReadonlySet<GovernedActionType> = new Set([
  ACTION_TYPE.user_role_change,
  ACTION_TYPE.user_email_change,
  ACTION_TYPE.user_platform_invite,
  ACTION_TYPE.user_auditor_period_update,
  ACTION_TYPE.tenant_create,
  ACTION_TYPE.tenant_suspend,
  ACTION_TYPE.tenant_reactivate,
  ACTION_TYPE.tenant_archive,
  ACTION_TYPE.module_activate,
  ACTION_TYPE.partner_archive,
  ACTION_TYPE.partner_role_assign,
  ACTION_TYPE.partner_identity_change,
  ACTION_TYPE.partner_merge,
  ACTION_TYPE.product_template_activate,
  ACTION_TYPE.product_template_deprecate,
])

// Resolves the entity a governed action is "about" — used by both the row
// list (ActionRow) and the detail views (PendingApprovalDetailDrawer,
// ReviewRequestModal), which previously each carried their own copy of this
// switch. Callers map `kind` to their own namespaced i18n label key.
export function getGovernedActionSubject(
  action: GovernedAction
): GovernedActionSubject {
  switch (action.action_type) {
    case ACTION_TYPE.user_platform_invite:
      return {
        kind: "user",
        value: platformInviteSnapshot(action).full_name ?? null,
      }
    case ACTION_TYPE.user_role_change:
      return {
        kind: "user",
        value: roleChangeSnapshot(action).affected_user_email ?? null,
      }
    case ACTION_TYPE.user_email_change:
      return {
        kind: "user",
        value: emailChangeSnapshot(action).old_email ?? null,
      }
    case ACTION_TYPE.user_auditor_period_update:
      return {
        kind: "user",
        value:
          displaySnapshot(action, AuditorPeriodUpdateSnapshotSchema).user_id ??
          null,
      }
    case ACTION_TYPE.tenant_create:
      return {
        kind: "tenant",
        value: displaySnapshot(action, TenantCreateSnapshotSchema).name ?? null,
      }
    case ACTION_TYPE.tenant_suspend:
    case ACTION_TYPE.tenant_reactivate:
    case ACTION_TYPE.tenant_archive:
      return {
        kind: "tenant",
        value:
          displaySnapshot(action, TenantIdSnapshotSchema).tenant_id ?? null,
      }
    case ACTION_TYPE.module_activate:
      return {
        kind: "module",
        value:
          displaySnapshot(action, ModuleActivateSnapshotSchema).module_key ??
          null,
      }
    case ACTION_TYPE.partner_merge:
      return {
        kind: "partner",
        value:
          displaySnapshot(action, PartnerMergeSnapshotSchema)
            .source_partner_id ?? null,
      }
    case ACTION_TYPE.partner_archive:
    case ACTION_TYPE.partner_confirm:
    case ACTION_TYPE.partner_role_assign:
    case ACTION_TYPE.partner_identity_change:
      return {
        kind: "partner",
        value:
          displaySnapshot(action, PartnerIdSnapshotSchema).partner_id ?? null,
      }
    case ACTION_TYPE.product_template_activate:
    case ACTION_TYPE.product_template_deprecate:
      return {
        kind: "template",
        value:
          displaySnapshot(action, TemplateNameSnapshotSchema).template_name ??
          null,
      }
    default: {
      // Exhaustiveness guard: every GovernedActionType is handled above, so this is
      // unreachable and `action_type` narrows to `never`. Adding a type to the schema
      // without a case here fails type-check instead of silently rendering the new
      // action as "User: —".
      const unhandled: never = action.action_type
      void unhandled
      return { kind: "user", value: null }
    }
  }
}
