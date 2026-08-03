import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChangeSection } from "@/features/governedActions/components/ChangeSection"
import { FieldRow } from "@/features/governedActions/components/FieldRow"
import { ChainEntry } from "@/features/governedActions/components/ChainEntry"
import { RoleBadge } from "@/features/users/components/RoleBadge"
import { USER_ROLES } from "@/features/users/types"
import type { UserRole } from "@/features/users/types"
import { formatDateTime } from "@/lib/formatters"
import {
  getGovernedActionSubject,
  HAS_CHANGE_SECTION,
  type GovernedActionSubjectKind,
} from "@/features/governedActions/utils"
import {
  initiatorSnapshot,
  approverSnapshot,
} from "@/features/governedActions/api/schema"
import type {
  ActorSnapshot,
  GovernedAction,
} from "@/features/governedActions/api/schema"

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
  | "drawer.affectedTenant"
  | "drawer.affectedModule"

// The request chain renders only the current action until the correlation_id lookup
// lands (see the TODO at the REQUEST CHAIN block below), so the count it displays is
// pinned to the single <ChainEntry> rendered there rather than inlined in the markup.
const RENDERED_CHAIN_ENTRY_COUNT = 1

const AFFECTED_ENTITY_LABEL_KEY: Record<
  GovernedActionSubjectKind,
  AffectedEntityLabelKey
> = {
  user: "drawer.affectedUser",
  partner: "drawer.affectedPartner",
  template: "drawer.affectedTemplate",
  tenant: "drawer.affectedTenant",
  module: "drawer.affectedModule",
}

export function PendingApprovalDetailDrawer({ open, onClose, action }: Props) {
  const { t } = useTranslation("pendingApprovals")
  const [justificationExpanded, setJustificationExpanded] = useState(true)
  const [chainExpanded, setChainExpanded] = useState(true)

  if (!action) return null

  const initiator = initiatorSnapshot(action)
  const approver = approverSnapshot(action)
  const subject = getGovernedActionSubject(action)

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
              <FieldRow label={t(AFFECTED_ENTITY_LABEL_KEY[subject.kind])}>
                <span className="font-semibold">{subject.value ?? "—"}</span>
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
              <ChangeSection action={action} keyPrefix="drawer" />
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
                  data-testid="drawer-justification-toggle"
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
                data-testid="drawer-request-chain-toggle"
                onClick={() => setChainExpanded(v => !v)}
                className="h-auto p-0 gap-1 text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-transparent"
              >
                <span>
                  {RENDERED_CHAIN_ENTRY_COUNT} {t("drawer.request")}
                </span>
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
