import { useTranslation } from "react-i18next"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { formatDate, formatDateTime } from "@/lib/formatters"
import type {
  CatalogEntityType,
  CatalogLayer,
  CatalogState,
} from "@/features/workflowTaskCatalog/api/schema"

type Props = {
  catalogName: string
  catalogLayer: CatalogLayer
  entityType: CatalogEntityType
  productTemplateName: string | null
  tenantName: string
  catalogState: CatalogState
  createdAt: string
  createdBy: string
  activeVersion: string
  publishedAt: string | null
  publishedBy: string | null
  validFrom: string
  validUntil: string | null
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

function IdentityScopeTab({
  catalogName,
  catalogLayer,
  entityType,
  productTemplateName,
  tenantName,
  catalogState,
  createdAt,
  createdBy,
  activeVersion,
  publishedAt,
  publishedBy,
  validFrom,
  validUntil,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  return (
    <div className="grid grid-cols-2 gap-6" data-testid="identity-scope-tab">
      <div className="border border-border rounded-xl bg-background overflow-hidden">
        <div className="bg-muted px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {t("detail.identity.sectionTitle")}
          </p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <DetailRow
            label={t("detail.identity.catalogName")}
            value={catalogName}
          />
          <DetailRow
            label={t("detail.identity.layer")}
            value={t(`catalogLayers.${catalogLayer}`)}
          />
          <DetailRow
            label={t("detail.identity.entityType")}
            value={t(`entityTypes.${entityType}`)}
          />
          <DetailRow
            label={t("detail.identity.productTemplate")}
            value={productTemplateName ?? t("detail.identity.notApplicable")}
          />
          <DetailRow label={t("detail.identity.tenant")} value={tenantName} />
        </div>
      </div>

      <div className="border border-border rounded-xl bg-background overflow-hidden">
        <div className="bg-muted px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {t("detail.lifecycle.sectionTitle")}
          </p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <DetailRow
            label={t("detail.lifecycle.status")}
            value={<WorkflowTaskCatalogStateBadge state={catalogState} />}
          />
          <DetailRow
            label={t("detail.lifecycle.createdAt")}
            value={formatDateTime(createdAt)}
          />
          <DetailRow
            label={t("detail.lifecycle.createdBy")}
            value={createdBy}
          />
          <DetailRow
            label={t("detail.lifecycle.activeVersion")}
            value={activeVersion}
          />
          <DetailRow
            label={t("detail.lifecycle.publishedAt")}
            value={
              publishedAt
                ? formatDateTime(publishedAt)
                : t("detail.lifecycle.notPublished")
            }
          />
          <DetailRow
            label={t("detail.lifecycle.publishedBy")}
            value={publishedBy ?? t("detail.lifecycle.notPublished")}
          />
          <DetailRow
            label={t("detail.lifecycle.validFrom")}
            value={formatDate(validFrom)}
          />
          <DetailRow
            label={t("detail.lifecycle.validUntil")}
            value={
              validUntil
                ? formatDate(validUntil)
                : t("detail.lifecycle.openEnded")
            }
          />
        </div>
      </div>
    </div>
  )
}

export { IdentityScopeTab }
