import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SelectField } from "@/components/ui/select"
import { TemplateVersionStatusBadge } from "@/features/productTemplates/components/TemplateVersionStatusBadge"
import { CompareVersionsModal } from "@/features/productTemplates/components/CompareVersionsModal"
import { useTemplateVersions } from "@/features/productTemplates/hooks/useTemplateVersions"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"
import { PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES } from "@/features/productTemplates/types"
import { canAccessAuditTrail } from "@/features/audit/types"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  TemplateStatus,
  TemplateVersionSummary,
} from "@/features/productTemplates/api/schema"
import { PATHS, productTemplateNewVersionEdit } from "@/router/paths"
import { formatDateTime } from "@/lib/formatters"
import {
  isProductTemplateNotFoundError,
  showApiError,
} from "@/features/productTemplates/utils"
import NotFoundPage from "@/features/errors/components/NotFoundPage"

// Timeline-rail dot color per status — the colored dot sits on the left rail
// connecting rows; the status badge itself (TemplateVersionStatusBadge) is a plain
// colored pill with no dot, matching the Figma "steps" rail + "Soft Badge" split.
const TIMELINE_DOT_CLASSES: Record<TemplateStatus, string> = {
  draft: "bg-primary",
  published: "bg-green-600",
  deprecated: "bg-amber-600",
  discarded: "bg-slate-300",
  awaiting_activation_countersignature: "bg-amber-600",
  awaiting_deprecation_countersignature: "bg-amber-600",
}

// Audit events for a product template are recorded by the backend against the
// TEMPLATE id (the version id is carried in the event payload, not entity_id),
// so the drill-down must filter by templateId — filtering by a version id
// returns no rows. The audit list endpoint has no per-version filter param.
function auditTrailLink(templateId: string): string {
  return `${PATHS.AUDIT_TRAIL}?entity_type=product_template&entity_id=${templateId}`
}

export default function VersionHistoryPage() {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [discardTarget, setDiscardTarget] =
    useState<TemplateVersionSummary | null>(null)
  const [compareFrom, setCompareFrom] = useState("")
  const [compareTo, setCompareTo] = useState("")
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const canManageDraft = Boolean(
    currentUser?.role &&
    PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES.includes(currentUser.role)
  )
  const canViewAuditTrail = canAccessAuditTrail(currentUser?.role)

  const {
    data: history,
    isLoading: isLoadingVersions,
    isError: isVersionsError,
    error: versionsError,
  } = useTemplateVersions(templateId ?? "")

  const latestVersionNumber = history?.versions[0]?.version_number ?? null
  const { data: header, isError: isHeaderError } = useTemplateVersionDetail(
    templateId ?? "",
    latestVersionNumber
  )

  const { mutateAsync: discardDraft, isPending: isDiscarding } =
    useDiscardProductTemplateDraft()

  const versionOptions = (history?.versions ?? []).map(version => ({
    value: version.version_number,
    label: t("versionHistory.compare.versionOptionLabel", {
      version: version.version_number,
      status: t(
        `versionStatuses.${version.version_status}` as "versionStatuses.draft"
      ),
    }),
  }))

  if (isProductTemplateNotFoundError(versionsError)) {
    return <NotFoundPage />
  }

  async function handleConfirmDiscard() {
    if (!discardTarget || !templateId) return
    try {
      await discardDraft({
        templateId,
        versionNumber: discardTarget.version_number,
      })
      setDiscardTarget(null)
    } catch (err) {
      showApiError(err, t)
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="version-history-page">
      <div className="px-8 py-6">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("versionHistory.title")}
        </h2>
        {header && (
          <p className="mt-1 text-sm text-muted-foreground">
            {header.template_name}
          </p>
        )}
        {!header && isHeaderError && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("errors.generic")}
          </p>
        )}
      </div>

      {history && !isLoadingVersions && (
        <div className="px-8 pb-6">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-4">
            <span className="text-sm font-medium text-foreground">
              {t("versionHistory.compare.compareLabel")}
            </span>
            <SelectField
              value={compareFrom}
              onValueChange={setCompareFrom}
              options={versionOptions}
              placeholder={t("fields.selectPlaceholder")}
              data-testid="compare-from-select"
            />
            <span className="text-sm font-medium text-foreground">
              {t("versionHistory.compare.withLabel")}
            </span>
            <SelectField
              value={compareTo}
              onValueChange={setCompareTo}
              options={versionOptions}
              placeholder={t("fields.selectPlaceholder")}
              data-testid="compare-to-select"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!compareFrom || !compareTo || compareFrom === compareTo}
              onClick={() => setIsCompareModalOpen(true)}
              data-testid="compare-versions-button"
            >
              {t("versionHistory.compare.compareButton")}
            </Button>
          </div>
        </div>
      )}

      {isLoadingVersions && (
        <div className="px-8 pb-8">
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        </div>
      )}

      {isVersionsError && !isLoadingVersions && (
        <div
          data-testid="version-history-error"
          className="flex items-center justify-center flex-1"
        >
          <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
        </div>
      )}

      {history && !isLoadingVersions && (
        <div className="px-8 pb-8">
          {/* NOTE: raw <div> list instead of shadcn Table — this view is a timeline
              (status dot + rail), not tabular data, and matches the same div-grid
              pattern already used by list tables elsewhere in this codebase (e.g.
              TenantTable, PartnerTable); a full conversion is out of scope here. */}
          <div className="border border-border rounded-xl bg-background overflow-hidden">
            {history.versions.map((version, index) => {
              const isDraft =
                version.version_status === TemplateStatusSchema.enum.draft
              const isLast = index === history.versions.length - 1

              return (
                <div
                  key={version.id}
                  data-testid={`version-row-${version.version_number}`}
                  className={cn(
                    "flex gap-3 px-4 pt-2 pb-3",
                    !isLast && "border-b border-border"
                  )}
                >
                  {/* Timeline rail */}
                  <div className="flex flex-col items-center w-2 pt-1.5 shrink-0">
                    <span
                      className={cn(
                        "size-2 rounded-full shrink-0",
                        TIMELINE_DOT_CLASSES[version.version_status]
                      )}
                    />
                    {!isLast && <span className="flex-1 w-px bg-border mt-1" />}
                  </div>

                  <div className="flex flex-1 items-start justify-between gap-4 min-w-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {version.version_number}
                        </span>
                        <TemplateVersionStatusBadge
                          status={version.version_status}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {version.published_by
                          ? t("versionHistory.publishedBy", {
                              name: version.published_by.display_name,
                              date: formatDateTime(
                                version.published_at ?? null
                              ),
                            })
                          : formatDateTime(version.created_at)}
                      </p>
                      {version.deprecated_by && (
                        <p className="text-xs text-muted-foreground">
                          {t("versionHistory.deprecatedBy", {
                            name: version.deprecated_by.display_name,
                            date: formatDateTime(version.deprecated_at ?? null),
                          })}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {t("versionHistory.bindingsCount", {
                          count: version.bindings_count,
                        })}
                      </span>
                      {isDraft
                        ? canManageDraft && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                data-testid={`discard-version-${version.version_number}`}
                                onClick={() => setDiscardTarget(version)}
                              >
                                {t("versionHistory.discard")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`continue-editing-${version.version_number}`}
                                onClick={() =>
                                  navigate(
                                    productTemplateNewVersionEdit(
                                      templateId ?? "",
                                      version.version_number
                                    )
                                  )
                                }
                              >
                                {t("versionHistory.continueEditing")}
                              </Button>
                            </div>
                          )
                        : canViewAuditTrail && (
                            <div className="flex flex-col items-end gap-2">
                              <Link
                                to={auditTrailLink(templateId ?? "")}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                              >
                                {t("versionHistory.viewAuditTrail")}
                                <ExternalLink size={16} />
                              </Link>
                            </div>
                          )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AlertDialog
        open={discardTarget !== null}
        onOpenChange={open => !open && setDiscardTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.discardDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.discardDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-discard-dialog-keep">
              {t("versionHistory.discardDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-discard-dialog-confirm"
              onClick={handleConfirmDiscard}
              disabled={isDiscarding}
            >
              {t("versionHistory.discardDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CompareVersionsModal
        templateId={templateId ?? ""}
        fromVersion={compareFrom}
        toVersion={compareTo}
        open={isCompareModalOpen}
        onOpenChange={setIsCompareModalOpen}
      />
    </div>
  )
}
