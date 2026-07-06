import { useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { Archive, SquarePen, SquareCode, Landmark, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import {
  OverviewTab,
  RolesList,
} from "@/features/partners/components/tabs/OverviewTab"
import { ResolutionCandidatesTab } from "@/features/partners/components/tabs/ResolutionCandidatesTab"
import { RolesTab } from "@/features/partners/components/tabs/RolesTab"
import { UboTab } from "@/features/partners/components/tabs/UboTab"
import { IdentityChangesTab } from "@/features/partners/components/tabs/IdentityChangesTab"
import { ConfirmationHistoryTab } from "@/features/partners/components/tabs/ConfirmationHistoryTab"
import { ArchivePartnerDialog } from "@/features/partners/components/ArchivePartnerDialog"
import { ProposeIdentityChangeDialog } from "@/features/partners/components/ProposeIdentityChangeDialog"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  fetchPartnerRoles,
  PARTNERS_QUERY_KEYS,
} from "@/features/partners/api/partnersApi"
import { PartnerStatusSchema } from "@/features/partners/api/schema"
import { PARTNER_SUBMIT_ALLOWED_ROLES } from "@/features/partners/types"
import { FRONT_OFFICE_ROLE } from "@/features/users/types"

type TabKey =
  | "overview"
  | "resolution"
  | "roles"
  | "ubo"
  | "identity-changes"
  | "confirmation-history"

export default function PartnerDetailPage() {
  const { t } = useTranslation("partners")
  const { id } = useParams<{ id: string }>()
  const { data: partner, isLoading, isError } = usePartnerDetail(id ?? null)
  const { data: currentUser } = useCurrentUser()
  const { data: rolesData } = useQuery({
    queryKey: PARTNERS_QUERY_KEYS.roles(partner?.partner_id ?? ""),
    queryFn: () => fetchPartnerRoles(partner?.partner_id ?? ""),
    enabled: !!partner,
  })

  const [archiveOpen, setArchiveOpen] = useState(false)
  const [proposeOpen, setProposeOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  const canAction =
    !!currentUser && PARTNER_SUBMIT_ALLOWED_ROLES.includes(currentUser.role)

  const canArchive =
    canAction && partner?.status === PartnerStatusSchema.enum.confirmed
  const canAssignRole =
    canAction && partner?.status === PartnerStatusSchema.enum.confirmed
  const canProposeIdentityChange =
    currentUser?.role === FRONT_OFFICE_ROLE &&
    partner?.status === PartnerStatusSchema.enum.confirmed

  const showResolutionTab =
    partner?.status === PartnerStatusSchema.enum.pending_confirmation

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-28 bg-muted rounded-[10px] animate-pulse" />
        <div className="h-64 bg-muted rounded-[10px] animate-pulse" />
      </div>
    )
  }

  if (isError || !partner) {
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
              <RolesList roles={rolesData?.roles ?? []} />
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
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as TabKey)}
        className="bg-muted border border-border rounded-[10px] flex flex-col gap-0"
      >
        <TabsList
          variant="line"
          className="h-10 w-full justify-start rounded-none px-3 border-b border-border"
        >
          <TabsTrigger value="overview" data-testid="tab-overview">
            {t("detail.tabs.overview")}
          </TabsTrigger>
          {showResolutionTab && (
            <TabsTrigger value="resolution" data-testid="tab-resolution">
              {t("detail.tabs.resolutionCandidates")}
            </TabsTrigger>
          )}
          <TabsTrigger value="roles" data-testid="tab-roles">
            {t("detail.tabs.roles")}
          </TabsTrigger>
          <TabsTrigger value="ubo" data-testid="tab-ubo">
            {t("detail.tabs.ubo")}
          </TabsTrigger>
          <TabsTrigger
            value="confirmation-history"
            data-testid="tab-confirmation-history"
          >
            {t("detail.tabs.confirmationHistory")}
          </TabsTrigger>
          <TabsTrigger
            value="identity-changes"
            data-testid="tab-identity-changes"
          >
            {t("detail.tabs.identityChanges")}
          </TabsTrigger>
        </TabsList>
        <div className="bg-card border border-border rounded-b-[10px] px-3">
          <TabsContent value="overview">
            <OverviewTab partner={partner} roles={rolesData?.roles ?? []} />
          </TabsContent>
          {showResolutionTab && (
            <TabsContent value="resolution">
              <ResolutionCandidatesTab partnerId={partner.partner_id} />
            </TabsContent>
          )}
          <TabsContent value="roles">
            <RolesTab
              partnerId={partner.partner_id}
              partnerStatus={partner.status}
              canAssignRole={canAssignRole}
            />
          </TabsContent>
          <TabsContent value="ubo">
            <UboTab
              partnerId={partner.partner_id}
              partnerType={partner.partner_type}
            />
          </TabsContent>
          <TabsContent value="identity-changes">
            <IdentityChangesTab partnerId={partner.partner_id} />
          </TabsContent>
          <TabsContent value="confirmation-history">
            <ConfirmationHistoryTab partnerId={partner.partner_id} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Dialogs */}
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
