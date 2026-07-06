import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
} from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ActionStatusBadge } from "@/features/governed-actions/components/ActionStatusBadge"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { formatDateTime } from "@/lib/formatters"
import {
  roleChangeSnapshot,
  platformInviteSnapshot,
  emailChangeSnapshot,
  initiatorSnapshot,
  approverSnapshot,
  displaySnapshot,
} from "@/features/governed-actions/api/schema"
import type {
  ActorSnapshot,
  GovernedAction,
  GovernedActionStatus,
  PartnerArchiveSnapshot,
  PartnerRoleAssignSnapshot,
  PartnerIdentityChangeSnapshot,
  PartnerMergeSnapshot,
  ProductTemplateActivateSnapshot,
  ProductTemplateDeprecateSnapshot,
} from "@/features/governed-actions/api/schema"

type Props = {
  open: boolean
  onClose: () => void
  action: GovernedAction | null
}

function InfoCard({
  title,
  headerAction,
  showBody = true,
  children,
}: {
  title: string
  headerAction?: React.ReactNode
  showBody?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col border border-border rounded-[10px] bg-slate-100 overflow-hidden w-full">
      <div className="flex h-8 items-center justify-between px-2">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        {headerAction}
      </div>
      {showBody && (
        <div className="border border-border rounded-[10px] bg-white p-4">
          {children}
        </div>
      )}
    </div>
  )
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-foreground shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function ChainEntry({
  description,
  date,
  status,
  correlationId,
}: {
  description: string
  date: string
  status: GovernedActionStatus
  correlationId?: string | null
}) {
  const { t } = useTranslation("pendingApprovals")
  const dotColor: Record<GovernedActionStatus, string> = {
    pending: "bg-amber-600",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    expired: "bg-slate-300",
    withdrawn: "bg-slate-300",
  }
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-start gap-2 w-full">
        <div className="flex items-start self-stretch pr-2 pt-1.5 shrink-0">
          <div
            className={cn("size-2 rounded-full shrink-0", dotColor[status])}
          />
        </div>
        <div className="flex flex-1 items-center min-w-0 gap-3">
          <div className="flex flex-col flex-1 min-w-0 opacity-80">
            <p className="text-sm text-foreground">{description}</p>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
          <ActionStatusBadge status={status} />
        </div>
      </div>
      {correlationId && (
        <div className="flex flex-col gap-0.5 pl-4">
          <p className="text-xs text-muted-foreground">
            {t("drawer.correlationId")}
          </p>
          <p className="text-xs font-mono text-foreground/70 break-all">
            {correlationId}
          </p>
        </div>
      )}
    </div>
  )
}

function ChangeSection({ action }: { action: GovernedAction }) {
  const { t } = useTranslation("pendingApprovals")

  if (action.action_type === "user_role_change") {
    const s = roleChangeSnapshot(action)
    return (
      <div className="flex items-center gap-2">
        <div className="bg-red-500/10 border border-red-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3">
          <p className="text-xs font-semibold text-red-700 uppercase">
            {t("drawer.previous")}
          </p>
          <p className="text-sm text-red-700 mt-1">
            {s.old_role
              ? t(`roles.${s.old_role}`, { defaultValue: s.old_role })
              : "—"}
          </p>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="bg-green-500/10 border border-green-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3">
          <p className="text-xs font-semibold text-green-700 uppercase">
            {t("drawer.current")}
          </p>
          <p className="text-sm text-green-700 mt-1">
            {s.new_role
              ? t(`roles.${s.new_role}`, { defaultValue: s.new_role })
              : "—"}
          </p>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_email_change") {
    const s = emailChangeSnapshot(action)
    return (
      <div className="flex items-center gap-2">
        <div className="bg-red-500/10 border border-red-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3 break-all">
          <p className="text-xs font-semibold text-red-700 uppercase">
            {t("drawer.previous")}
          </p>
          <p className="text-sm text-red-700 mt-1">{s.old_email ?? "—"}</p>
        </div>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="bg-green-500/10 border border-green-500/50 rounded-[10px] flex-1 min-w-0 px-4 py-3 break-all">
          <p className="text-xs font-semibold text-green-700 uppercase">
            {t("drawer.current")}
          </p>
          <p className="text-sm text-green-700 mt-1">{s.new_email ?? "—"}</p>
        </div>
      </div>
    )
  }

  if (action.action_type === "user_platform_invite") {
    const s = platformInviteSnapshot(action)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t("drawer.email")}>
          <span>{s.email ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t("drawer.role")}>
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
    const s = displaySnapshot<PartnerArchiveSnapshot>(action)
    return (
      <FieldRow label={t("drawer.archiveReason")}>
        <span>{s.reason ?? "—"}</span>
      </FieldRow>
    )
  }

  if (action.action_type === "partner_role_assign") {
    const s = displaySnapshot<PartnerRoleAssignSnapshot>(action)
    return (
      <FieldRow label={t("drawer.roleToAssign")}>
        <span>{t(`roles.${s.role}`, { defaultValue: s.role })}</span>
      </FieldRow>
    )
  }

  if (action.action_type === "partner_identity_change") {
    const s = displaySnapshot<PartnerIdentityChangeSnapshot>(action)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t("drawer.targetAnchors")}>
          <span>{s.target_anchors?.join(", ") || "—"}</span>
        </FieldRow>
        <FieldRow label={t("drawer.changeReason")}>
          <span>{s.change_reason ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t("drawer.highRisk")}>
          <span>{s.is_high_risk ? t("drawer.yes") : t("drawer.no")}</span>
        </FieldRow>
      </div>
    )
  }

  if (action.action_type === "partner_merge") {
    const s = displaySnapshot<PartnerMergeSnapshot>(action)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t("drawer.mergeSource")}>
          <span>{s.source_partner_id}</span>
        </FieldRow>
        <FieldRow label={t("drawer.mergeTarget")}>
          <span>{s.target_partner_id}</span>
        </FieldRow>
        <FieldRow label={t("drawer.mergeReasonCode")}>
          <span>{s.merge_reason_code}</span>
        </FieldRow>
      </div>
    )
  }

  if (
    action.action_type === "product_template_activate" ||
    action.action_type === "product_template_deprecate"
  ) {
    const s = displaySnapshot<
      ProductTemplateActivateSnapshot &
        Partial<ProductTemplateDeprecateSnapshot>
    >(action)
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label={t("drawer.templateName")}>
          <span>{s.template_name ?? "—"}</span>
        </FieldRow>
        <FieldRow label={t("drawer.versionNumber")}>
          <span>{s.version_number ?? "—"}</span>
        </FieldRow>
        {action.action_type === "product_template_deprecate" && (
          <FieldRow label={t("drawer.justification")}>
            <span>{s.justification ?? "—"}</span>
          </FieldRow>
        )}
      </div>
    )
  }

  return null
}

function ActorCard({
  title,
  snapshot,
  dateLabel,
  date,
}: {
  title: string
  snapshot: ActorSnapshot
  dateLabel: string
  date: string | null | undefined
}) {
  const { t } = useTranslation("pendingApprovals")
  const name = snapshot.first_name
    ? `${snapshot.first_name} ${snapshot.last_name}`
    : "—"

  return (
    <InfoCard title={title}>
      <div className="flex flex-col gap-3">
        <FieldRow label={t("drawer.name")}>
          <span className="font-semibold">{name}</span>
        </FieldRow>
        <FieldRow label={t("drawer.roleAtTime")}>
          {snapshot.role && USER_ROLES.includes(snapshot.role as UserRole) ? (
            <RoleBadge role={snapshot.role as UserRole} />
          ) : snapshot.role ? (
            <span className="text-sm">{snapshot.role}</span>
          ) : (
            <span>—</span>
          )}
        </FieldRow>
        <FieldRow label={dateLabel}>
          <span>{date ? formatDateTime(date) : "—"}</span>
        </FieldRow>
      </div>
    </InfoCard>
  )
}

type AffectedEntityLabelKey =
  | "drawer.affectedUser"
  | "drawer.affectedPartner"
  | "drawer.affectedTemplate"

function getAffectedEntity(action: GovernedAction): {
  labelKey: AffectedEntityLabelKey
  value: string
} {
  if (action.action_type === "user_platform_invite") {
    return {
      labelKey: "drawer.affectedUser",
      value: platformInviteSnapshot(action).full_name ?? "—",
    }
  }
  if (action.action_type === "user_role_change") {
    return {
      labelKey: "drawer.affectedUser",
      value: roleChangeSnapshot(action).affected_user_email ?? "—",
    }
  }
  if (action.action_type === "user_email_change") {
    return {
      labelKey: "drawer.affectedUser",
      value: emailChangeSnapshot(action).old_email ?? "—",
    }
  }
  if (action.action_type === "partner_merge") {
    return {
      labelKey: "drawer.affectedPartner",
      value:
        displaySnapshot<PartnerMergeSnapshot>(action).source_partner_id ?? "—",
    }
  }
  if (action.action_type.startsWith("partner_")) {
    return {
      labelKey: "drawer.affectedPartner",
      value: displaySnapshot<{ partner_id: string }>(action).partner_id ?? "—",
    }
  }
  if (action.action_type.startsWith("product_template_")) {
    return {
      labelKey: "drawer.affectedTemplate",
      value:
        displaySnapshot<{ template_name: string }>(action).template_name ?? "—",
    }
  }
  return { labelKey: "drawer.affectedUser", value: "—" }
}

const HAS_CHANGE_SECTION = new Set([
  "user_role_change",
  "user_email_change",
  "user_platform_invite",
  "partner_archive",
  "partner_role_assign",
  "partner_identity_change",
  "partner_merge",
  "product_template_activate",
  "product_template_deprecate",
])

export function PendingApprovalDetailDrawer({ open, onClose, action }: Props) {
  const { t } = useTranslation("pendingApprovals")
  const [justificationExpanded, setJustificationExpanded] = useState(true)
  const [chainExpanded, setChainExpanded] = useState(true)

  if (!action) return null

  const initiator = initiatorSnapshot(action)
  const approver = approverSnapshot(action)
  const affectedEntity = getAffectedEntity(action)

  return (
    <Sheet
      open={open}
      onOpenChange={o => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-[440px] sm:max-w-[440px] gap-0 p-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">
            {t(`actionTypes.${action.action_type}`)}
          </SheetTitle>
          <SheetClose
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                data-testid="details-drawer-close"
              />
            }
          >
            <XIcon className="size-4" />
          </SheetClose>
        </div>

        {/* Scrollable content */}
        <div className="flex flex-col gap-4 px-3 pb-4 overflow-y-auto flex-1">
          {/* ACTION */}
          <InfoCard title={t("drawer.action")}>
            <div className="flex flex-col gap-3">
              <FieldRow label={t("drawer.actionType")}>
                <span>{t(`actionTypes.${action.action_type}`)}</span>
              </FieldRow>
              <FieldRow label={t(affectedEntity.labelKey)}>
                <span className="font-semibold">{affectedEntity.value}</span>
              </FieldRow>
              {action.tenant_id && (
                <FieldRow label={t("drawer.tenant")}>
                  <span>{action.tenant_id}</span>
                </FieldRow>
              )}
            </div>
          </InfoCard>

          {/* CHANGE */}
          {HAS_CHANGE_SECTION.has(action.action_type) && (
            <InfoCard title={t("drawer.change")}>
              <ChangeSection action={action} />
            </InfoCard>
          )}

          {/* SUBMISSION */}
          {initiator && (
            <ActorCard
              title={t("drawer.submission")}
              snapshot={initiator}
              dateLabel={t("drawer.submittedAt")}
              date={action.created_at}
            />
          )}

          {/* REASON FROM SUBMITTER */}
          {action.reason && (
            <InfoCard title={t("drawer.reasonFromSubmitter")}>
              <p className="text-sm text-foreground/80">
                &ldquo;{action.reason}&rdquo;
              </p>
            </InfoCard>
          )}

          {/* APPROVER */}
          {approver && (
            <ActorCard
              title={t("drawer.approver")}
              snapshot={approver}
              dateLabel={t("drawer.resolvedAt")}
              date={action.resolved_at}
            />
          )}

          {/* APPROVER JUSTIFICATION — only if present, collapsible */}
          {action.approver_comment && (
            <InfoCard
              title={t("drawer.approverJustification")}
              showBody={justificationExpanded}
              headerAction={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setJustificationExpanded(v => !v)}
                  className="text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  {justificationExpanded ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                </Button>
              }
            >
              <p className="text-sm text-foreground/80">
                &ldquo;{action.approver_comment}&rdquo;
              </p>
            </InfoCard>
          )}

          {/* REQUEST CHAIN — collapsible
              TODO #no-ticket (Q-002 backend gap): currently shows only the current action.
              When GET /governed-actions?correlation_id= is available:
              1. Fetch all actions sharing action.correlation_id
              2. Sort by created_at ascending
              3. Render each as <ChainEntry> and replace the hardcoded "1 request" count */}
          <InfoCard
            title={t("drawer.requestChain")}
            showBody={chainExpanded}
            headerAction={
              <Button
                type="button"
                variant="ghost"
                onClick={() => setChainExpanded(v => !v)}
                className="h-auto p-0 gap-1 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <span>1 {t("drawer.request")}</span>
                {chainExpanded ? (
                  <ChevronUpIcon className="size-4" />
                ) : (
                  <ChevronDownIcon className="size-4" />
                )}
              </Button>
            }
          >
            <ChainEntry
              description={t("drawer.chainCurrentRequest")}
              date={action.created_at ? formatDateTime(action.created_at) : "—"}
              status={action.status}
              correlationId={action.correlation_id}
            />
          </InfoCard>
        </div>
      </SheetContent>
    </Sheet>
  )
}
