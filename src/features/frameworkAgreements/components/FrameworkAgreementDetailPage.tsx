import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFrameworkAgreementDetail } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementDetail"
import {
  isFrameworkAgreementNotFoundError,
  getFrameworkAgreementDisplayStatus,
} from "@/features/frameworkAgreements/utils"
import { ActivateFrameworkAgreementDialog } from "@/features/frameworkAgreements/components/ActivateFrameworkAgreementDialog"
import { SuspendFrameworkAgreementDialog } from "@/features/frameworkAgreements/components/SuspendFrameworkAgreementDialog"
import { TerminateFrameworkAgreementDialog } from "@/features/frameworkAgreements/components/TerminateFrameworkAgreementDialog"
import { TemplatesAndDocumentsTab } from "@/features/frameworkAgreements/components/TemplatesAndDocumentsTab"
import { UtilizationTab } from "@/features/frameworkAgreements/components/UtilizationTab"
import { FinancingsTab } from "@/features/frameworkAgreements/components/FinancingsTab"
import { AuditHistoryTab } from "@/features/frameworkAgreements/components/AuditHistoryTab"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { formatDateTime, formatCurrency } from "@/lib/formatters"
import { COPIED_RESET_DELAY_MS } from "@/lib/constants"
import { frameworkAgreementEdit } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES,
  FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES,
} from "@/features/frameworkAgreements/types"
import { FA_STATUS_BADGE_VARIANT } from "@/features/frameworkAgreements/constants"
import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import { ReviewRow } from "@/features/frameworkAgreements/components/ReviewRow"

function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation("frameworkAgreements")
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), COPIED_RESET_DELAY_MS)
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      data-testid="copy-agreement-id-button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground"
      title={copied ? t("detail.copied") : undefined}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  )
}

export default function FrameworkAgreementDetailPage() {
  const { t } = useTranslation("frameworkAgreements")
  const { id } = useParams<{ id: string }>()
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const navigate = useNavigate()

  const { data, isLoading, isError, error } = useFrameworkAgreementDetail(
    id ?? ""
  )
  const { data: currentUser } = useCurrentUser()
  const canManageFrameworkAgreement = Boolean(
    currentUser?.role &&
    FRAMEWORK_AGREEMENT_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )
  const canViewAuditHistory = Boolean(
    currentUser?.role &&
    FRAMEWORK_AGREEMENT_AUDIT_READ_ALLOWED_ROLES.includes(currentUser.role)
  )

  if (isFrameworkAgreementNotFoundError(error)) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return null
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">{t("detail.loadError")}</p>
      </div>
    )
  }

  const displayStatus = getFrameworkAgreementDisplayStatus(
    data.status,
    data.is_expired
  )

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {data.agreement_name}
            </h1>
            <Badge variant={FA_STATUS_BADGE_VARIANT[displayStatus]}>
              {t(`statuses.${displayStatus}`)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {t("detail.fields.agreementId")}: {data.id}
            </span>
            <span>
              {t("fields.leasingCompany")}: {data.lc_partner_name ?? "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {data.status !== FALifecycleStatusSchema.enum.terminated &&
            canManageFrameworkAgreement && (
              <Button
                variant="outline"
                data-testid="edit-fa-button"
                onClick={() => navigate(frameworkAgreementEdit(data.id))}
              >
                {t("detail.actions.edit")}
              </Button>
            )}
          {data.status === FALifecycleStatusSchema.enum.draft &&
            canManageFrameworkAgreement && (
              <Button
                variant="outline"
                data-testid="activate-fa-button"
                onClick={() => setActivateDialogOpen(true)}
              >
                {t("detail.actions.activate")}
              </Button>
            )}
          {data.status === FALifecycleStatusSchema.enum.active &&
            canManageFrameworkAgreement && (
              <>
                <Button
                  variant="outline"
                  data-testid="suspend-fa-button"
                  onClick={() => setSuspendDialogOpen(true)}
                >
                  {t("detail.actions.suspend")}
                </Button>
                <Button
                  variant="outline"
                  data-testid="terminate-fa-button"
                  onClick={() => setTerminateDialogOpen(true)}
                >
                  {t("detail.actions.terminate")}
                </Button>
              </>
            )}
          {/* Reactivation is hidden from the UI per PRD1042-1495 (B5) — MVP lifecycle
              is CRUD + Suspend/Terminate only. ReactivateFrameworkAgreementDialog and
              its hook are retained, unused, for when this is re-enabled. */}
          {data.status === FALifecycleStatusSchema.enum.suspended &&
            canManageFrameworkAgreement && (
              <Button
                variant="outline"
                data-testid="terminate-fa-button"
                onClick={() => setTerminateDialogOpen(true)}
              >
                {t("detail.actions.terminate")}
              </Button>
            )}
        </div>
      </div>

      <Tabs defaultValue="agreementDetails">
        <TabsList>
          <TabsTrigger
            value="agreementDetails"
            data-testid="tab-agreement-details"
          >
            {t("detail.tabs.agreementDetails")}
          </TabsTrigger>
          <TabsTrigger
            value="templatesAndDocuments"
            data-testid="tab-templates-and-documents"
          >
            {t("detail.tabs.templatesAndDocuments")}
          </TabsTrigger>
          <TabsTrigger value="utilization" data-testid="tab-utilization">
            {t("detail.tabs.utilization")}
          </TabsTrigger>
          <TabsTrigger value="financings" data-testid="tab-financings">
            {t("detail.tabs.financings")}
          </TabsTrigger>
          {canViewAuditHistory && (
            <TabsTrigger value="auditHistory" data-testid="tab-audit-history">
              {t("detail.tabs.auditHistory")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="agreementDetails">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div className="border border-border rounded-xl bg-background overflow-hidden">
              <div className="bg-muted px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.sections.identity")}
                </p>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <ReviewRow
                  label={t("detail.fields.agreementId")}
                  value={
                    <span className="flex items-center gap-1.5">
                      {data.id}
                      <CopyButton text={data.id} />
                    </span>
                  }
                />
                <ReviewRow
                  label={t("fields.agreementName")}
                  value={data.agreement_name}
                />
                <ReviewRow
                  label={t("fields.leasingCompany")}
                  value={data.lc_partner_name ?? "—"}
                />
                <ReviewRow
                  label={t("fields.bankEntity")}
                  value={
                    data.bank_entity
                      ? t(
                          `bankEntities.${data.bank_entity}` as "bankEntities.sparkasse"
                        )
                      : "—"
                  }
                />
                <ReviewRow label={t("fields.currency")} value={data.currency} />
              </div>
            </div>

            <div className="border border-border rounded-xl bg-background overflow-hidden">
              <div className="bg-muted px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.sections.creditEnvelope")}
                </p>
              </div>
              <div className="p-4 flex flex-col gap-4">
                <ReviewRow
                  label={t("fields.maxVolumeEur")}
                  value={formatCurrency(data.max_volume_eur, data.currency)}
                />
                <ReviewRow label={t("fields.currency")} value={data.currency} />
              </div>
            </div>

            {data.effective_rate !== null && (
              <div className="border border-border rounded-xl bg-background overflow-hidden col-span-2">
                <div className="bg-muted px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("detail.sections.pricing")}
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <ReviewRow
                    label={t("fields.effectiveRate")}
                    value={`${data.effective_rate}%`}
                  />
                  {data.vfe_rate !== null && (
                    <ReviewRow
                      label={t("fields.vfeRate")}
                      value={`${data.vfe_rate}%`}
                    />
                  )}
                </div>
              </div>
            )}

            {data.special_conditions && (
              <div className="border border-border rounded-xl bg-background overflow-hidden col-span-2">
                <div className="bg-muted px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("detail.sections.specialConditions")}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {data.special_conditions}
                  </p>
                </div>
              </div>
            )}

            <div className="border border-border rounded-xl bg-background overflow-hidden col-span-2">
              <div className="bg-muted px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {t("detail.sections.lifecycle")}
                </p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <ReviewRow
                  label={t("detail.fields.status")}
                  value={t(`statuses.${displayStatus}`)}
                />
                {data.created_by_name && (
                  <ReviewRow
                    label={t("detail.fields.createdBy")}
                    value={data.created_by_name}
                  />
                )}
                <ReviewRow
                  label={t("detail.fields.createdAt")}
                  value={formatDateTime(data.created_at)}
                />
                {data.activated_by_name && (
                  <ReviewRow
                    label={t("detail.fields.activatedBy")}
                    value={data.activated_by_name}
                  />
                )}
                {data.activated_at && (
                  <ReviewRow
                    label={t("detail.fields.activatedAt")}
                    value={formatDateTime(data.activated_at)}
                  />
                )}
                <ReviewRow
                  label={t("fields.validFrom")}
                  value={data.valid_from}
                />
                <ReviewRow
                  label={t("fields.validUntil")}
                  value={data.valid_until ?? t("fields.openEnded")}
                />
                {data.suspended_at && (
                  <ReviewRow
                    label={t("detail.fields.suspendedAt")}
                    value={formatDateTime(data.suspended_at)}
                  />
                )}
                {data.terminated_at && (
                  <ReviewRow
                    label={t("detail.fields.terminatedAt")}
                    value={formatDateTime(data.terminated_at)}
                  />
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templatesAndDocuments">
          <TemplatesAndDocumentsTab
            frameworkAgreementId={data.id}
            frameworkAgreementStatus={data.status}
            productTemplateIds={data.product_template_ids}
            canManageFrameworkAgreement={canManageFrameworkAgreement}
          />
        </TabsContent>

        <TabsContent value="utilization">
          <UtilizationTab
            frameworkAgreementId={data.id}
            currency={data.currency}
          />
        </TabsContent>

        <TabsContent value="financings">
          <FinancingsTab frameworkAgreementId={data.id} />
        </TabsContent>

        {canViewAuditHistory && (
          <TabsContent value="auditHistory">
            <AuditHistoryTab
              frameworkAgreementId={data.id}
              currentUserRole={currentUser?.role ?? null}
            />
          </TabsContent>
        )}
      </Tabs>

      <ActivateFrameworkAgreementDialog
        open={activateDialogOpen}
        onOpenChange={setActivateDialogOpen}
        frameworkAgreementId={data.id}
        validFrom={data.valid_from}
        validUntil={data.valid_until}
      />
      <SuspendFrameworkAgreementDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        frameworkAgreementId={data.id}
      />
      <TerminateFrameworkAgreementDialog
        open={terminateDialogOpen}
        onOpenChange={setTerminateDialogOpen}
        frameworkAgreementId={data.id}
      />
    </div>
  )
}
