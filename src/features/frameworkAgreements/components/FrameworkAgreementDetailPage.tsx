import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useFrameworkAgreementDetail } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementDetail"
import { isFrameworkAgreementNotFoundError } from "@/features/frameworkAgreements/utils"
import { ActivateFrameworkAgreementPanel } from "@/features/frameworkAgreements/components/ActivateFrameworkAgreementPanel"
import { TerminateFrameworkAgreementPanel } from "@/features/frameworkAgreements/components/TerminateFrameworkAgreementPanel"
import { TemplatesAndDocumentsTab } from "@/features/frameworkAgreements/components/TemplatesAndDocumentsTab"
import { UtilizationTab } from "@/features/frameworkAgreements/components/UtilizationTab"
import { FinancingsTab } from "@/features/frameworkAgreements/components/FinancingsTab"
import { AuditHistoryTab } from "@/features/frameworkAgreements/components/AuditHistoryTab"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { formatDateTime, formatCurrency } from "@/lib/formatters"
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard"
import { Skeleton } from "@/components/ui/skeleton"
import { isUuidRouteParam } from "@/lib/routeParams"
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
  const { isCopied, copy } = useCopyToClipboard()

  async function handleCopy() {
    // The hook returns false rather than toasting itself, so a refused clipboard
    // write has to be surfaced here — otherwise the icon never flips and nothing
    // tells the user why.
    const didCopy = await copy(text)
    if (!didCopy) toast.error(t("detail.copyFailed"))
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      data-testid="copy-agreement-id-button"
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground"
      title={isCopied ? t("detail.copied") : undefined}
    >
      {isCopied ? <Check size={14} /> : <Copy size={14} />}
    </Button>
  )
}

export default function FrameworkAgreementDetailPage() {
  const { t } = useTranslation("frameworkAgreements")
  const { id } = useParams<{ id: string }>()
  // `/framework-agreements/create` — a mistyped `/new` — matches this route's `:id`, so a
  // param that is not a UUID reads as not-found rather than a 422 behind a generic message.
  const agreementId = isUuidRouteParam(id) ? id : undefined
  // Mutually exclusive — a draft can only be activated, an active agreement only
  // terminated, so there is never a reason for both panels to be open at once.
  const [openPanel, setOpenPanel] = useState<"activate" | "terminate" | null>(
    null
  )
  const navigate = useNavigate()

  const { data, isLoading, isError, error } = useFrameworkAgreementDetail(
    agreementId ?? ""
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

  if (agreementId === undefined || isFrameworkAgreementNotFoundError(error)) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col gap-4" data-testid="fa-detail-loading">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive">{t("detail.loadError")}</p>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {data.agreement_name}
            </h1>
            <Badge variant={FA_STATUS_BADGE_VARIANT[data.agreement_lifecycle]}>
              {t(`statuses.${data.agreement_lifecycle}`)}
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
            canManageFrameworkAgreement &&
            openPanel !== "activate" && (
              <Button
                variant="outline"
                data-testid="activate-fa-button"
                onClick={() => setOpenPanel("activate")}
              >
                {t("detail.actions.activate")}
              </Button>
            )}
          {data.status === FALifecycleStatusSchema.enum.active &&
            canManageFrameworkAgreement &&
            openPanel !== "terminate" && (
              <Button
                variant="outline"
                data-testid="terminate-fa-button"
                onClick={() => setOpenPanel("terminate")}
              >
                {t("detail.actions.terminate")}
              </Button>
            )}
        </div>
      </div>

      {openPanel === "activate" && (
        <ActivateFrameworkAgreementPanel
          frameworkAgreementId={data.id}
          onCancel={() => setOpenPanel(null)}
          onActivated={() => setOpenPanel(null)}
        />
      )}
      {openPanel === "terminate" && (
        <TerminateFrameworkAgreementPanel
          frameworkAgreementId={data.id}
          onCancel={() => setOpenPanel(null)}
          onTerminated={() => setOpenPanel(null)}
        />
      )}

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

            {data.vfe_amount_eur !== null && (
              <div className="border border-border rounded-xl bg-background overflow-hidden col-span-2">
                <div className="bg-muted px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                    {t("detail.sections.pricing")}
                  </p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <ReviewRow
                    label={t("fields.vfeAmountEur")}
                    value={formatCurrency(data.vfe_amount_eur, data.currency)}
                  />
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
                  value={t(`statuses.${data.agreement_lifecycle}`)}
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
    </div>
  )
}
