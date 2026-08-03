import { useTranslation } from "react-i18next"
import { ArrowRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/formatters"
import {
  roleChangeSnapshot,
  emailChangeSnapshot,
  platformInviteSnapshot,
  displaySnapshot,
  AuditorPeriodUpdateSnapshotSchema,
  TenantCreateSnapshotSchema,
  TenantIdSnapshotSchema,
  ModuleActivateSnapshotSchema,
  PartnerArchiveSnapshotSchema,
  PartnerRoleAssignSnapshotSchema,
  PartnerIdentityChangeSnapshotSchema,
  PartnerMergeSnapshotSchema,
  ProductTemplateDeprecateSnapshotSchema,
} from "@/features/governedActions/api/schema"
import type { GovernedAction } from "@/features/governedActions/api/schema"
import { FieldRow } from "@/features/governedActions/components/FieldRow"

export type ChangeSectionPrefix = "drawer" | "modal"

// The two hosts use different copy for the role-diff boxes (drawer: "PREVIOUS"
// / "CURRENT", modal: "CURRENT" / "PROPOSED") — not just a namespace prefix —
// so these are looked up explicitly rather than templated.
const BEFORE_LABEL_KEY: Record<
  ChangeSectionPrefix,
  "drawer.previous" | "modal.current"
> = {
  drawer: "drawer.previous",
  modal: "modal.current",
}
const AFTER_LABEL_KEY: Record<
  ChangeSectionPrefix,
  "drawer.current" | "modal.proposed"
> = {
  drawer: "drawer.current",
  modal: "modal.proposed",
}
// modal.actionType previously mislabeled the platform-invite role field
// ("Action type" instead of "Role") — corrected to a dedicated role key,
// matching drawer.role, as part of unifying the two implementations.
const ROLE_LABEL_KEY: Record<
  ChangeSectionPrefix,
  "drawer.role" | "modal.role"
> = {
  drawer: "drawer.role",
  modal: "modal.role",
}

// The remaining fields share the same key name under both namespaces
// (`drawer.<field>` / `modal.<field>`) — this composes the literal key type
// the same way the generated i18next key union expects, since a plain
// template-literal expression (`${p}.field`) would otherwise widen to `string`.
function prefixedKey<Field extends string>(
  prefix: ChangeSectionPrefix,
  field: Field
): `drawer.${Field}` | `modal.${Field}` {
  return `${prefix}.${field}` as `drawer.${Field}` | `modal.${Field}`
}

const CHANGE_BOX_STYLES = {
  before: {
    wrapper:
      "bg-red-500/10 border border-red-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3",
    label: "text-xs font-semibold text-red-700 uppercase",
    value: "text-sm text-red-700 mt-1",
  },
  after: {
    wrapper:
      "bg-green-500/10 border border-green-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3",
    label: "text-xs font-semibold text-green-700 uppercase",
    value: "text-sm text-green-700 mt-1",
  },
} as const

function ChangeBox({
  variant,
  label,
  breakAll = false,
  children,
}: {
  variant: "before" | "after"
  label: string
  breakAll?: boolean
  children: React.ReactNode
}) {
  const styles = CHANGE_BOX_STYLES[variant]
  return (
    <div className={cn(styles.wrapper, breakAll && "break-all")}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{children}</p>
    </div>
  )
}

export function ChangeSection({
  action,
  keyPrefix,
}: {
  action: GovernedAction
  keyPrefix: ChangeSectionPrefix
}) {
  const { t } = useTranslation("pendingApprovals")
  const p = keyPrefix

  if (action.action_type === "user_role_change") {
    const s = roleChangeSnapshot(action)
    return (
      <div className="flex items-center gap-2">
        <ChangeBox variant="before" label={t(BEFORE_LABEL_KEY[p])}>
          {s.old_role
            ? t(`roles.${s.old_role}`, { defaultValue: s.old_role })
            : "—"}
        </ChangeBox>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <ChangeBox variant="after" label={t(AFTER_LABEL_KEY[p])}>
          {s.new_role
            ? t(`roles.${s.new_role}`, { defaultValue: s.new_role })
            : "—"}
        </ChangeBox>
      </div>
    )
  }

  if (action.action_type === "user_email_change") {
    const s = emailChangeSnapshot(action)
    return (
      <div className="flex items-center gap-2">
        <ChangeBox variant="before" label={t(BEFORE_LABEL_KEY[p])} breakAll>
          {s.old_email ?? "—"}
        </ChangeBox>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <ChangeBox variant="after" label={t(AFTER_LABEL_KEY[p])} breakAll>
          {s.new_email ?? "—"}
        </ChangeBox>
      </div>
    )
  }

  if (action.action_type === "user_auditor_period_update") {
    const s = displaySnapshot(action, AuditorPeriodUpdateSnapshotSchema)
    return (
      <div className="flex items-center gap-2">
        <ChangeBox variant="before" label={t(BEFORE_LABEL_KEY[p])}>
          {s.old_access_valid_until
            ? formatDate(s.old_access_valid_until)
            : t(prefixedKey(p, "noExpiry"))}
        </ChangeBox>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <ChangeBox variant="after" label={t(AFTER_LABEL_KEY[p])}>
          {s.new_access_valid_until
            ? formatDate(s.new_access_valid_until)
            : t(prefixedKey(p, "noExpiry"))}
        </ChangeBox>
      </div>
    )
  }

  if (action.action_type === "tenant_create") {
    const s = displaySnapshot(action, TenantCreateSnapshotSchema)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "tenantName"))}>
          <span>{s.name ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "tenantCode"))}>
          <span>{s.code ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "tenantCountry"))}>
          <span>{s.country ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "tenantLegalEntityName"))}>
          <span>{s.legal_entity_name ?? "—"}</span>
        </FieldRow>
      </div>
    )
  }

  if (
    action.action_type === "tenant_suspend" ||
    action.action_type === "tenant_reactivate" ||
    action.action_type === "tenant_archive"
  ) {
    const s = displaySnapshot(action, TenantIdSnapshotSchema)
    return (
      <FieldRow label={t(prefixedKey(p, "tenantId"))}>
        <span>{s.tenant_id ?? "—"}</span>
      </FieldRow>
    )
  }

  if (action.action_type === "module_activate") {
    const s = displaySnapshot(action, ModuleActivateSnapshotSchema)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "tenantId"))}>
          <span>{s.tenant_id ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "moduleKey"))}>
          <span>{s.module_key ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "moduleAction"))}>
          <span>{s.action ?? "—"}</span>
        </FieldRow>
      </div>
    )
  }

  if (action.action_type === "user_platform_invite") {
    const s = platformInviteSnapshot(action)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "email"))}>
          <span>{s.email ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(ROLE_LABEL_KEY[p])}>
          <span>
            {s.role_label
              ? t(`roles.${s.role_label}`, { defaultValue: s.role_label })
              : "—"}
          </span>
        </FieldRow>
      </div>
    )
  }

  if (action.action_type === "partner_archive") {
    const s = displaySnapshot(action, PartnerArchiveSnapshotSchema)
    return (
      <FieldRow label={t(prefixedKey(p, "archiveReason"))}>
        <span>{s.reason ?? "—"}</span>
      </FieldRow>
    )
  }

  if (action.action_type === "partner_role_assign") {
    const s = displaySnapshot(action, PartnerRoleAssignSnapshotSchema)
    return (
      <FieldRow label={t(prefixedKey(p, "roleToAssign"))}>
        <span>
          {s.role ? t(`roles.${s.role}`, { defaultValue: s.role }) : "—"}
        </span>
      </FieldRow>
    )
  }

  if (action.action_type === "partner_identity_change") {
    const s = displaySnapshot(action, PartnerIdentityChangeSnapshotSchema)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "targetAnchors"))}>
          <span>{s.target_anchors?.join(", ") || "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "changeReason"))}>
          <span>{s.change_reason ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "highRisk"))}>
          <span>
            {s.is_high_risk
              ? t(prefixedKey(p, "yes"))
              : t(prefixedKey(p, "no"))}
          </span>
        </FieldRow>
      </div>
    )
  }

  if (action.action_type === "partner_merge") {
    const s = displaySnapshot(action, PartnerMergeSnapshotSchema)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "mergeSource"))}>
          <span>{s.source_partner_id ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "mergeTarget"))}>
          <span>{s.target_partner_id ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "mergeReasonCode"))}>
          <span>{s.merge_reason_code ?? "—"}</span>
        </FieldRow>
      </div>
    )
  }

  if (
    action.action_type === "product_template_activate" ||
    action.action_type === "product_template_deprecate"
  ) {
    const s = displaySnapshot(action, ProductTemplateDeprecateSnapshotSchema)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t(prefixedKey(p, "templateName"))}>
          <span>{s.template_name ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t(prefixedKey(p, "versionNumber"))}>
          <span>{s.version_number ?? "—"}</span>
        </FieldRow>
        {action.action_type === "product_template_deprecate" && (
          <FieldRow label={t(prefixedKey(p, "justification"))}>
            <span>{s.justification ?? "—"}</span>
          </FieldRow>
        )}
      </div>
    )
  }

  return null
}
