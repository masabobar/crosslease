import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { TemplateVersionStatusBadge } from "@/features/productTemplates/components/TemplateVersionStatusBadge"
import { DEPRECATION_JUSTIFICATION_MIN_LENGTH } from "@/features/productTemplates/constants"
import { useTemplateVersions } from "@/features/productTemplates/hooks/useTemplateVersions"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"
import { useCreateNewProductTemplateVersion } from "@/features/productTemplates/hooks/useCreateNewProductTemplateVersion"
import { useDeprecateProductTemplateVersion } from "@/features/productTemplates/hooks/useDeprecateProductTemplateVersion"
import { PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES } from "@/features/productTemplates/types"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type {
  IncrementType,
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

function auditTrailLink(versionId: string): string {
  return `${PATHS.AUDIT_TRAIL}?entity_type=product_template&entity_id=${versionId}`
}

export default function VersionHistoryPage() {
  const { t } = useTranslation("productTemplates")
  const { t: tCommon } = useTranslation("common")
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [discardTarget, setDiscardTarget] =
    useState<TemplateVersionSummary | null>(null)
  const [newVersionTarget, setNewVersionTarget] =
    useState<TemplateVersionSummary | null>(null)
  const [incrementType, setIncrementType] = useState<IncrementType | null>(null)
  const [deprecateTarget, setDeprecateTarget] =
    useState<TemplateVersionSummary | null>(null)
  const [deprecationJustification, setDeprecationJustification] = useState("")

  const { data: currentUser } = useCurrentUser()
  const canManageDraft = Boolean(
    currentUser?.role &&
    PRODUCT_TEMPLATE_CREATE_ALLOWED_ROLES.includes(currentUser.role)
  )

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
  const { mutateAsync: createNewVersion, isPending: isCreatingNewVersion } =
    useCreateNewProductTemplateVersion()
  const { mutateAsync: deprecateVersion, isPending: isDeprecating } =
    useDeprecateProductTemplateVersion()

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

  async function handleConfirmAuthorNewVersion() {
    if (!newVersionTarget || !templateId || !incrementType) return
    try {
      const result = await createNewVersion({
        templateId,
        body: { increment_type: incrementType },
      })
      setNewVersionTarget(null)
      setIncrementType(null)
      navigate(productTemplateNewVersionEdit(templateId, result.version_number))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleConfirmDeprecate() {
    if (!deprecateTarget || !templateId) return
    try {
      await deprecateVersion({
        templateId,
        versionNumber: deprecateTarget.version_number,
        body: { justification: deprecationJustification },
      })
      setDeprecateTarget(null)
      setDeprecationJustification("")
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
              const isPublished =
                version.version_status === TemplateStatusSchema.enum.published
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
                      {isDraft ? (
                        canManageDraft && (
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
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          {isPublished && canManageDraft && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                data-testid={`deprecate-version-${version.version_number}`}
                                onClick={() => setDeprecateTarget(version)}
                              >
                                {t("versionHistory.deprecate")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                data-testid={`author-new-version-${version.version_number}`}
                                onClick={() => setNewVersionTarget(version)}
                              >
                                {t("versionHistory.authorNewVersion")}
                              </Button>
                            </div>
                          )}
                          <Link
                            to={auditTrailLink(version.id)}
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

      <AlertDialog
        open={newVersionTarget !== null}
        onOpenChange={open => {
          if (!open) {
            setNewVersionTarget(null)
            setIncrementType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.authorNewVersionDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.authorNewVersionDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <RadioGroup
              data-testid="increment-type-radio-group"
              value={incrementType ?? undefined}
              onValueChange={value => setIncrementType(value as IncrementType)}
              className="gap-3"
            >
              <label
                htmlFor="increment-type-major"
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
              >
                <RadioGroupItem id="increment-type-major" value="major" />
                {t("versionHistory.authorNewVersionDialog.majorLabel")}
              </label>
              <label
                htmlFor="increment-type-minor"
                className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer has-data-checked:border-primary has-data-checked:bg-primary/5"
              >
                <RadioGroupItem id="increment-type-minor" value="minor" />
                {t("versionHistory.authorNewVersionDialog.minorLabel")}
              </label>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-new-dialog-keep">
              {t("versionHistory.authorNewVersionDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-new-dialog-confirm"
              onClick={handleConfirmAuthorNewVersion}
              disabled={isCreatingNewVersion || !incrementType}
            >
              {t("versionHistory.authorNewVersionDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deprecateTarget !== null}
        onOpenChange={open => {
          if (!open) {
            setDeprecateTarget(null)
            setDeprecationJustification("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.deprecateDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.deprecateDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <Label htmlFor="deprecate-justification">
              {t("versionHistory.deprecateDialog.justificationLabel")}
            </Label>
            <Textarea
              id="deprecate-justification"
              data-testid="deprecate-justification-input"
              rows={3}
              value={deprecationJustification}
              onChange={e => setDeprecationJustification(e.target.value)}
            />
            <p className="text-sm text-muted-foreground opacity-80">
              {t("versionHistory.deprecateDialog.justificationHint")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-deprecate-dialog-keep">
              {t("versionHistory.deprecateDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-deprecate-dialog-confirm"
              onClick={handleConfirmDeprecate}
              disabled={
                isDeprecating ||
                deprecationJustification.trim().length <
                  DEPRECATION_JUSTIFICATION_MIN_LENGTH
              }
            >
              {t("versionHistory.deprecateDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
