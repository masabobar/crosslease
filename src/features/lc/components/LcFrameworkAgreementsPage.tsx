import { useTranslation } from "react-i18next"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionCard } from "@/features/frameworkAgreements/components/SectionCard"
import { useLcPortalFrameworkAgreements } from "@/features/lc/hooks/useLcPortalFrameworkAgreements"
import { getLcPortalDocumentDownloadUrl } from "@/features/lc/api/lcPortalApi"
import {
  isFrameworkAgreementNotFoundError,
  isFrameworkAgreementExpiredByDate,
  getLcPortalAgreementLifecycle,
} from "@/features/frameworkAgreements/utils"
import {
  FA_DOCUMENT_BYTES_PER_MB,
  FA_STATUS_BADGE_VARIANT,
} from "@/features/frameworkAgreements/constants"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { formatCurrency } from "@/lib/formatters"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import type { LCPortalFAListItem } from "@/features/lc/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

function FrameworkAgreementCard({ fa }: { fa: LCPortalFAListItem }) {
  const { t } = useTranslation("lc")

  // LCPortalFAListItem carries no `is_expired` (unlike the bank-side list and detail
  // responses), so it is derived here — otherwise the same agreement would read
  // "Active" here and "Expired" in the bank portal. See Q-033.
  const displayStatus = getLcPortalAgreementLifecycle(
    fa.status,
    isFrameworkAgreementExpiredByDate(fa.valid_until)
  )

  return (
    <div
      className="border border-border rounded-xl bg-background overflow-hidden"
      data-testid={`lc-fa-card-${fa.id}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">
          {fa.agreement_name}
        </h2>
        <Badge variant={FA_STATUS_BADGE_VARIANT[displayStatus]}>
          {t(`frameworkAgreements.status.${displayStatus}`)}
        </Badge>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {t("frameworkAgreements.fields.maxVolumeEur")}
            </p>
            <p className="text-sm text-foreground">
              {formatCurrency(fa.max_volume_eur, EUR_CURRENCY_CODE)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">
              {t("frameworkAgreements.fields.validity")}
            </p>
            <p className="text-sm text-foreground">
              {fa.valid_from} –{" "}
              {fa.valid_until ?? t("frameworkAgreements.fields.openEnded")}
            </p>
          </div>
        </div>

        <SectionCard
          title={t("frameworkAgreements.fields.permittedProductTemplates")}
        >
          {fa.product_templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("frameworkAgreements.templatesEmptyState")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fa.product_templates.map(template => (
                <Badge
                  key={template.id}
                  variant="outline"
                  data-testid={`lc-fa-template-${template.id}`}
                >
                  {template.template_name ??
                    t("frameworkAgreements.templateUnresolved")}
                </Badge>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={t("frameworkAgreements.fields.frameworkDocuments")}>
          {fa.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("frameworkAgreements.documentsEmptyState")}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {fa.documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                  data-testid={`lc-fa-document-${doc.id}`}
                >
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
                    {t(
                      `frameworkAgreements.documentTypes.${doc.document_type}`
                    )}
                  </Badge>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {Math.round(doc.file_size_bytes / FA_DOCUMENT_BYTES_PER_MB)}{" "}
                    MB
                  </span>
                  {/* NOTE: raw <a> — shadcn Button's `render` prop can only
                      compose onto a non-<button> element with
                      nativeButton={false}, which forces role="button" onto
                      this anchor and overrides its native link semantics; a
                      plain styled <a> preserves correct link semantics for a
                      download action */}
                  <a
                    href={getLcPortalDocumentDownloadUrl(fa.id, doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("frameworkAgreements.downloadButton")}
                    data-testid={`lc-fa-download-${doc.id}`}
                  >
                    <Download size={16} className="text-muted-foreground" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

export default function LcFrameworkAgreementsPage() {
  const { t } = useTranslation("lc")
  // The failures this screen can surface are the framework-agreement codes, which are keyed in
  // that feature's namespace (plus the shared ones in `common`, reached via fallbackNS). The
  // `lc` namespace only ever carried its own nested copy of VALIDATION_ERROR, so resolving
  // errors through it left every FA_* code on the generic message.
  const { t: tErrors } = useTranslation("frameworkAgreements")
  const { data, isLoading, isError, error } = useLcPortalFrameworkAgreements()

  if (isFrameworkAgreementNotFoundError(error)) {
    return <NotFoundPage />
  }

  return (
    <div
      data-testid="lc-framework-agreements-page"
      className="flex flex-col gap-6 p-6 max-w-4xl"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("frameworkAgreements.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("frameworkAgreements.subtitle")}
        </p>
      </div>

      {isLoading && <Skeleton className="h-48 rounded-xl" />}

      {isError && !isLoading && (
        <p className="text-sm text-destructive py-8 text-center">
          {resolveApiErrorMessage(error, tErrors)}
        </p>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("frameworkAgreements.emptyState")}
        </p>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="flex flex-col gap-4">
          {data.items.map(fa => (
            <FrameworkAgreementCard key={fa.id} fa={fa} />
          ))}
        </div>
      )}
    </div>
  )
}
