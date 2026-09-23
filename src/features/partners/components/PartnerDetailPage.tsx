import { useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Archive,
  CircleCheck,
  CircleX,
  SquarePen,
  SquareCode,
  Landmark,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { isUuidRouteParam } from "@/lib/routeParams"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import {
  OverviewTab,
  RolesList,
} from "@/features/partners/components/tabs/OverviewTab"
import { ResolutionCandidatesTab } from "@/features/partners/components/tabs/ResolutionCandidatesTab"
import { AssessmentTab } from "@/features/partners/components/tabs/AssessmentTab"
import { ConnectionsTab } from "@/features/partners/components/tabs/ConnectionsTab"
import { PartnerAddressesPanel } from "@/features/partners/components/PartnerAddressesPanel"
import { RelationshipsTab } from "@/features/partners/components/tabs/RelationshipsTab"
import { PartnerDocumentsTab } from "@/features/partners/components/tabs/PartnerDocumentsTab"
import { RolesTab } from "@/features/partners/components/tabs/RolesTab"
import { UboTab } from "@/features/partners/components/tabs/UboTab"
import { IdentityChangesTab } from "@/features/partners/components/tabs/IdentityChangesTab"
import { ConfirmationHistoryTab } from "@/features/partners/components/tabs/ConfirmationHistoryTab"
import { MergeHistoryTab } from "@/features/partners/components/tabs/MergeHistoryTab"
import { DecisionHistoryTab } from "@/features/partners/components/tabs/DecisionHistoryTab"
import { ArchivePartnerDialog } from "@/features/partners/components/ArchivePartnerDialog"
import { ConfirmPartnerDialog } from "@/features/partners/components/ConfirmPartnerDialog"
import { RejectPartnerDialog } from "@/features/partners/components/RejectPartnerDialog"
import { ProposeIdentityChangeDialog } from "@/features/partners/components/ProposeIdentityChangeDialog"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { usePartnerRoles } from "@/features/partners/hooks/usePartnerRoles"
import { useBankAccounts } from "@/features/partners/hooks/useBankAccounts"
import {
  usePartnerAssessments,
  usePartnerConnections,
  usePartnerDocuments,
  usePartnerRelationships,
} from "@/features/partners/hooks/useAssessments"
import { BankAccountsSection } from "@/features/partners/components/BankAccountsSection"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  PartnerStatusSchema,
  PartnerTypeSchema,
} from "@/features/partners/api/schema"
import { PARTNER_SUBMIT_ALLOWED_ROLES } from "@/features/partners/types"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  AUDITOR_ROLE,
  FRONT_OFFICE_ROLE,
  SYSTEM_ADMIN_ROLE,
} from "@/features/users/types"

type TabKey =
  | "overview"
  | "assessment"
  | "bank-accounts"
  | "connections"
  | "relationships"
  | "documents"
  | "resolution"
  | "roles"
  | "ubo"
  | "identity-changes"
  | "confirmation-history"
  | "merge-history"
  | "decision-history"

/**
 * `Documents 2` — the tab's name with how much is behind it.
 *
 * Undefined while the query is in flight rather than zero: a tab that flashes "0" and then says
 * "3" reads as data that changed, not as data that arrived.
 */
function withCount(label: string, count: number | undefined): string {
  return count === undefined ? label : `${label} ${count}`
}

export default function PartnerDetailPage() {
  const { t } = useTranslation("partners")
  const { id: idParam } = useParams<{ id: string }>()
  const id = isUuidRouteParam(idParam) ? idParam : undefined
  const {
    data: partner,
    isLoading,
    isError,
    error,
  } = usePartnerDetail(id ?? null)
  const { data: currentUser } = useCurrentUser()
  const { data: rolesData, isError: isRolesError } = usePartnerRoles(
    partner?.partner_id ?? null
  )

  // Read here only to put a count beside each tab. Every one of these is the same query its tab
  // runs, so React Query serves the tab from cache the moment it opens — the counts cost nothing
  // beyond the first load.
  const assessments = usePartnerAssessments(partner?.partner_id)
  const bankAccounts = useBankAccounts(partner?.partner_id ?? "")
  const connections = usePartnerConnections(partner?.partner_id)
  const relationships = usePartnerRelationships(partner?.partner_id)
  const partnerDocuments = usePartnerDocuments(partner?.partner_id)

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [proposeOpen, setProposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const canAction =
    !!currentUser && PARTNER_SUBMIT_ALLOWED_ROLES.includes(currentUser.role)

  // Draft → Confirmed is a single-actor FO action per US 13.5 (PRD1042-1449);
  // BO/Risk is not in this flow.
  const canConfirmOrReject =
    canAction &&
    (partner?.status === PartnerStatusSchema.enum.draft ||
      partner?.status === PartnerStatusSchema.enum.pending_confirmation)

  const canArchive =
    canAction && partner?.status === PartnerStatusSchema.enum.confirmed
  const canProposeIdentityChange =
    currentUser?.role === FRONT_OFFICE_ROLE &&
    partner?.status === PartnerStatusSchema.enum.confirmed
  const canCaptureUbo =
    currentUser?.role === FRONT_OFFICE_ROLE &&
    partner?.status === PartnerStatusSchema.enum.confirmed &&
    partner?.partner_type === PartnerTypeSchema.enum.legal_entity

  const showResolutionTab =
    partner?.status === PartnerStatusSchema.enum.pending_confirmation
  const showAuditReconstructTabs =
    currentUser?.role === AUDITOR_ROLE ||
    currentUser?.role === SYSTEM_ADMIN_ROLE

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
        <div className="h-64 bg-muted rounded-[10px] animate-pulse" />
      </div>
    )
  }

  // A 403 or a 500 is not a missing partner. Reporting every failure as "not found" sent
  // users hunting for a record that is there but unreadable to them.
  if (isError) {
    return (
      <p
        className="text-sm text-destructive p-8"
        data-testid="partner-load-error"
      >
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  if (!partner) {
    return (
      <p className="text-sm text-destructive p-8">{t("errors.NOT_FOUND")}</p>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-6" data-testid="partner-detail-page">
      {/* Hero card */}
      <div className="flex flex-col border border-border rounded-[10px]">
        {/* Top row: name + badges + actions */}
        <div className="bg-card flex items-center gap-3 px-3 py-4 rounded-t-[10px]">
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <p className="text-2xl font-semibold text-foreground truncate">
              {partner.display_name}
            </p>
            <div className="flex items-center gap-2">
              <PartnerTypeBadge type={partner.partner_type} />
              <PartnerStatusBadge status={partner.status} />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canConfirmOrReject && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectOpen(true)}
                  data-testid="action-reject-partner"
                  className="gap-1.5 text-destructive"
                >
                  <CircleX size={14} />
                  {t("rejectDialog.triggerButton")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  data-testid="action-confirm-partner"
                  className="gap-1.5"
                >
                  <CircleCheck size={14} />
                  {t("confirmDialog.triggerButton")}
                </Button>
              </>
            )}
            {canProposeIdentityChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProposeOpen(true)}
                data-testid="action-propose-identity-change"
                className="gap-1.5"
              >
                <SquarePen size={14} />
                {t("proposeIdentityChangeDialog.triggerButton")}
              </Button>
            )}
            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchiveOpen(true)}
                data-testid="action-archive"
                className="gap-1.5"
              >
                <Archive size={14} />
                {t("archiveDialog.submit")}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="bg-muted border-t border-border flex items-center gap-6 px-3 py-3 rounded-b-[10px]">
          <div className="flex items-center gap-2">
            <SquareCode size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("detail.header.id")}
            </span>
            <span className="text-sm text-foreground">
              {partner.partner_id}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("detail.header.roles")}
            </span>
            <span className="text-sm text-foreground">
              {isRolesError ? (
                <span className="text-destructive">{t("errors.generic")}</span>
              ) : (
                <RolesList roles={rolesData?.roles ?? []} />
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {t("detail.overview.fields.country")}
            </span>
            <span className="text-sm text-foreground">
              {partner.identity.country}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-muted border border-border rounded-[10px] flex flex-col">
        <UnderlineTabBar
          tabClassName="pb-1"
          tabs={[
            // The prototype's order and its counts. A count beside a tab is how a reader decides
            // whether opening it is worth the click — "Documents 2" and "Documents" are different
            // pieces of information, and all five come from data these tabs already fetch.
            {
              key: "overview" as const,
              label: t("detail.tabs.overview"),
              testId: "tab-overview",
            },
            {
              key: "assessment" as const,
              label: withCount(
                t("detail.tabs.assessment"),
                assessments.data?.items.length
              ),
              testId: "tab-assessment",
            },
            // Bank accounts had no tab of its own at all — the section was buried at the foot of
            // the Party tab, where the prototype's reader would never look for it.
            {
              key: "bank-accounts" as const,
              label: withCount(
                t("detail.tabs.bankAccounts"),
                bankAccounts.data?.items.length
              ),
              testId: "tab-bank-accounts",
            },
            {
              key: "connections" as const,
              label: withCount(
                t("detail.tabs.connections"),
                connections.data?.items.length
              ),
              testId: "tab-connections",
            },
            {
              key: "relationships" as const,
              label: withCount(
                t("detail.tabs.relationships"),
                relationships.data?.items.length
              ),
              testId: "tab-relationships",
            },
            {
              key: "documents" as const,
              label: withCount(
                t("detail.tabs.documents"),
                partnerDocuments.data?.items.length
              ),
              testId: "tab-documents",
            },
            ...(showResolutionTab
              ? [
                  {
                    key: "resolution" as const,
                    label: t("detail.tabs.resolutionCandidates"),
                    testId: "tab-resolution",
                  },
                ]
              : []),
            {
              key: "roles" as const,
              label: t("detail.tabs.roles"),
              testId: "tab-roles",
            },
            {
              key: "ubo" as const,
              label: t("detail.tabs.ubo"),
              testId: "tab-ubo",
            },
            {
              key: "confirmation-history" as const,
              label: t("detail.tabs.confirmationHistory"),
              testId: "tab-confirmation-history",
            },
            {
              key: "identity-changes" as const,
              label: t("detail.tabs.identityChanges"),
              testId: "tab-identity-changes",
            },
            ...(showAuditReconstructTabs
              ? [
                  {
                    key: "merge-history" as const,
                    label: t("detail.tabs.mergeHistory"),
                    testId: "tab-merge-history",
                  },
                  {
                    key: "decision-history" as const,
                    label: t("detail.tabs.decisionHistory"),
                    testId: "tab-decision-history",
                  },
                ]
              : []),
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="px-3"
        />
        <div className="bg-card border border-border rounded-b-[10px] px-3 pt-3">
          {/* The prototype puts the addresses beside the identity on this tab — a party's
              addresses are part of who it is, not a screen of their own. */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              <OverviewTab partner={partner} roles={rolesData?.roles ?? []} />
              <PartnerAddressesPanel partnerId={partner.partner_id} />
            </div>
          )}
          {activeTab === "resolution" && showResolutionTab && (
            <ResolutionCandidatesTab partnerId={partner.partner_id} />
          )}
          {activeTab === "assessment" && (
            <AssessmentTab partnerId={partner.partner_id} />
          )}
          {activeTab === "connections" && (
            <ConnectionsTab partnerId={partner.partner_id} />
          )}
          {activeTab === "bank-accounts" && (
            <BankAccountsSection partnerId={partner.partner_id} />
          )}
          {activeTab === "relationships" && (
            <RelationshipsTab partnerId={partner.partner_id} />
          )}
          {activeTab === "documents" && (
            <PartnerDocumentsTab partnerId={partner.partner_id} />
          )}
          {activeTab === "roles" && <RolesTab partnerId={partner.partner_id} />}
          {activeTab === "ubo" && (
            <UboTab
              partnerId={partner.partner_id}
              canCaptureUbo={canCaptureUbo}
            />
          )}
          {activeTab === "identity-changes" && (
            <IdentityChangesTab
              partnerId={partner.partner_id}
              partnerType={partner.partner_type}
            />
          )}
          {activeTab === "confirmation-history" && (
            <ConfirmationHistoryTab partnerId={partner.partner_id} />
          )}
          {activeTab === "merge-history" && showAuditReconstructTabs && (
            <MergeHistoryTab partnerId={partner.partner_id} />
          )}
          {activeTab === "decision-history" && showAuditReconstructTabs && (
            <DecisionHistoryTab partnerId={partner.partner_id} />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmPartnerDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        partnerId={partner.partner_id}
        partnerName={partner.display_name}
        partnerStatus={partner.status}
      />
      <RejectPartnerDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        partnerId={partner.partner_id}
        partnerName={partner.display_name}
        partnerStatus={partner.status}
      />
      <ArchivePartnerDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        partnerId={partner.partner_id}
        partnerName={partner.display_name}
        partnerStatus={partner.status}
      />
      <ProposeIdentityChangeDialog
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        partnerId={partner.partner_id}
        identity={partner.identity}
      />
    </div>
  )
}
