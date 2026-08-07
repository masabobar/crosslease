import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { FileText, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { AttachFrameworkAgreementDocumentDialog } from "@/features/frameworkAgreements/components/AttachFrameworkAgreementDocumentDialog"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useFrameworkAgreementDocuments } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementDocuments"
import { useDetachFrameworkAgreementDocument } from "@/features/frameworkAgreements/hooks/useDetachFrameworkAgreementDocument"
import { useFrameworkAgreementDocumentDownloadUrl } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementDocumentDownloadUrl"
import { ApiError } from "@/lib/api"
import { formatDateTime } from "@/lib/formatters"
import { FALifecycleStatusSchema } from "@/features/frameworkAgreements/api/schema"
import type {
  AttachDocumentResponse,
  FALifecycleStatus,
} from "@/features/frameworkAgreements/api/schema"
import {
  FA_DOCUMENT_BYTES_PER_MB,
  FA_DOCUMENT_MAX_COUNT,
} from "@/features/frameworkAgreements/constants"

type Props = {
  frameworkAgreementId: string
  frameworkAgreementStatus: FALifecycleStatus
  productTemplateIds: string[]
  canManageFrameworkAgreement: boolean
}

function TemplatesAndDocumentsTab({
  frameworkAgreementId,
  frameworkAgreementStatus,
  productTemplateIds,
  canManageFrameworkAgreement,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [detachTarget, setDetachTarget] =
    useState<AttachDocumentResponse | null>(null)

  const templatesQuery = useSelectableProductTemplates()
  const documentsQuery = useFrameworkAgreementDocuments(frameworkAgreementId)
  const downloadMutation = useFrameworkAgreementDocumentDownloadUrl()
  const detachMutation = useDetachFrameworkAgreementDocument()

  const canManageDocuments =
    canManageFrameworkAgreement &&
    frameworkAgreementStatus === FALifecycleStatusSchema.enum.draft
  const documentsAtLimit =
    (documentsQuery.data?.length ?? 0) >= FA_DOCUMENT_MAX_COUNT

  function handleDownload(docId: string) {
    downloadMutation.mutate(
      { faId: frameworkAgreementId, docId },
      {
        onSuccess: data =>
          window.open(data.url, "_blank", "noopener,noreferrer"),
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  function handleConfirmDetach() {
    if (!detachTarget) return
    detachMutation.mutate(
      { faId: frameworkAgreementId, docId: detachTarget.id },
      {
        onSuccess: () => setDetachTarget(null),
        onError: err => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  const templateMap = new Map(
    (templatesQuery.data?.items ?? []).map(item => [item.template_id, item])
  )

  return (
    <div
      className="flex flex-col gap-6 mt-4"
      data-testid="templates-and-documents-tab"
    >
      <SectionCard title={t("fields.allowedProductTemplates")}>
        {templatesQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
        )}
        {templatesQuery.isError && (
          <p className="text-sm text-destructive">{t("errors.generic")}</p>
        )}
        {!templatesQuery.isLoading &&
          !templatesQuery.isError &&
          productTemplateIds.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("documentsTab.templatesEmptyState")}
            </p>
          )}
        {!templatesQuery.isLoading && !templatesQuery.isError && (
          <div className="flex flex-col gap-2">
            {productTemplateIds.map(id => {
              const template = templateMap.get(id)
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  data-testid={`fa-template-item-${id}`}
                >
                  {template ? (
                    <>
                      <span className="text-sm text-foreground">
                        {template.template_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        v{template.version_number}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t("documentsTab.templateUnresolved")}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("wizard.steps.documents")}>
        <div className="flex flex-col gap-3">
          {canManageDocuments && (
            <div className="flex flex-col items-start gap-1.5">
              <Button
                type="button"
                variant="outline"
                disabled={documentsAtLimit}
                onClick={() => setAttachDialogOpen(true)}
                data-testid="attach-document-button"
              >
                {t("documentsTab.attachButton")}
              </Button>
              {documentsAtLimit && (
                <p className="text-xs text-muted-foreground">
                  {t("documentsTab.limitReachedHint")}
                </p>
              )}
            </div>
          )}

          {documentsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">
              {tCommon("loading")}
            </p>
          )}
          {documentsQuery.isError && (
            <p className="text-sm text-destructive">{t("errors.generic")}</p>
          )}
          {!documentsQuery.isLoading &&
            !documentsQuery.isError &&
            documentsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("documentsTab.documentsEmptyState")}
              </p>
            )}

          {documentsQuery.data?.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              data-testid={`document-row-${doc.id}`}
            >
              <FileText size={20} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">
                  {doc.file_name}
                </p>
                {doc.document_label && (
                  <p className="truncate text-xs text-muted-foreground">
                    {doc.document_label}
                  </p>
                )}
              </div>
              <Badge variant="secondary">
                {t(`documentTypes.${doc.document_type}`)}
              </Badge>
              <span className="shrink-0 text-xs text-muted-foreground">
                {Math.round(doc.file_size_bytes / FA_DOCUMENT_BYTES_PER_MB)} MB
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDateTime(doc.uploaded_at)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDownload(doc.id)}
                aria-label={t("documentsTab.downloadButton")}
                data-testid={`download-document-${doc.id}`}
              >
                <Download size={16} className="text-muted-foreground" />
              </Button>
              {canManageDocuments && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setDetachTarget(doc)}
                  aria-label={t("documentsTab.detachButton")}
                  data-testid={`detach-document-${doc.id}`}
                >
                  <Trash2 size={16} className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <AttachFrameworkAgreementDocumentDialog
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        frameworkAgreementId={frameworkAgreementId}
      />

      <AlertDialog
        open={!!detachTarget}
        onOpenChange={o => !o && setDetachTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("documentsTab.detachConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("documentsTab.detachConfirm.description", {
                fileName: detachTarget?.file_name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="detach-confirm-cancel">
              {t("documentsTab.detachConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="detach-confirm-confirm"
              onClick={handleConfirmDetach}
            >
              {t("documentsTab.detachConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { TemplatesAndDocumentsTab }
