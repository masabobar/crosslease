import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Check, X, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { PartnerTypeBadge } from "@/features/partners/components/PartnerTypeBadge"
import { OverviewTab } from "@/features/partners/components/tabs/OverviewTab"
import { ResolutionCandidatesTab } from "@/features/partners/components/tabs/ResolutionCandidatesTab"
import { RolesTab } from "@/features/partners/components/tabs/RolesTab"
import { UboTab } from "@/features/partners/components/tabs/UboTab"
import { IdentityChangesTab } from "@/features/partners/components/tabs/IdentityChangesTab"
import { ConfirmationHistoryTab } from "@/features/partners/components/tabs/ConfirmationHistoryTab"
import { ConfirmPartnerDialog } from "@/features/partners/components/ConfirmPartnerDialog"
import { RejectPartnerDialog } from "@/features/partners/components/RejectPartnerDialog"
import { ArchivePartnerDialog } from "@/features/partners/components/ArchivePartnerDialog"
import { usePartnerDetail } from "@/features/partners/hooks/usePartnerDetail"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { PartnerStatusSchema } from "@/features/partners/api/schema"
import { PARTNER_SUBMIT_ALLOWED_ROLES } from "@/features/partners/types"

export default function PartnerDetailPage() {
  const { t } = useTranslation("partners")
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: partner, isLoading, isError } = usePartnerDetail(id ?? null)
  const { data: currentUser } = useCurrentUser()

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const canAction =
    !!currentUser && PARTNER_SUBMIT_ALLOWED_ROLES.includes(currentUser.role)

  const canConfirmReject =
    canAction &&
    partner?.status === PartnerStatusSchema.enum.pending_confirmation
  const canArchive =
    canAction && partner?.status === PartnerStatusSchema.enum.confirmed

  const showResolutionTab =
    partner?.status === PartnerStatusSchema.enum.pending_confirmation

  if (isLoading) {
    return (
      <div className="px-8 py-6 flex flex-col gap-4">
        <div className="h-8 bg-muted rounded-xl animate-pulse w-48" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (isError || !partner) {
    return (
      <p className="text-sm text-destructive px-8 py-8">
        {t("errors.NOT_FOUND")}
      </p>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-8 py-5 border-b border-border">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate(-1)}
          data-testid="detail-back"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {partner.display_name}
          </h1>
          <PartnerTypeBadge type={partner.partner_type} />
          <PartnerStatusBadge status={partner.status} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canConfirmReject && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectOpen(true)}
                data-testid="action-reject"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
              >
                <X size={14} />
                {t("rejectDialog.submit")}
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                data-testid="action-confirm"
                className="gap-1.5"
              >
                <Check size={14} />
                {t("confirmDialog.submit")}
              </Button>
            </>
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

      {/* Tabs */}
      <div className="flex-1 overflow-auto px-8 py-4">
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              {t("detail.tabs.overview")}
            </TabsTrigger>
            {showResolutionTab && (
              <TabsTrigger value="resolution">
                {t("detail.tabs.resolutionCandidates")}
              </TabsTrigger>
            )}
            <TabsTrigger value="roles">{t("detail.tabs.roles")}</TabsTrigger>
            <TabsTrigger value="ubo">{t("detail.tabs.ubo")}</TabsTrigger>
            <TabsTrigger value="identity-changes">
              {t("detail.tabs.identityChanges")}
            </TabsTrigger>
            <TabsTrigger value="confirmation-history">
              {t("detail.tabs.confirmationHistory")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab partner={partner} />
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
              canAssignRole={canAction}
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
        </Tabs>
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
    </div>
  )
}
