import { useTranslation } from "react-i18next"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { DetailRow as SharedDetailRow } from "@/components/shared/DetailRow"
import type { CatalogDetailResponse } from "@/features/workflowTaskCatalog/api/schema"

type Props = {
  catalog: CatalogDetailResponse
  // Resolved by the page from one users query; null falls back to the raw UUID rather than
  // rendering blank, so an unresolvable id stays diagnosable (see Q-042).
  tenantName: string | null
  createdByName: string | null
  productTemplateName: string | null
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <SharedDetailRow label={label} variant="emphasized">
      {value}
    </SharedDetailRow>
  )
}

// The field set US 15.23 asks for: Layer, Entity Type, Product Template, Tenant, Created At/By,
// Operational State, Valid From/Until. Active version, Published at and Published by are
// deliberately absent — the story does not ask for them and the wire has no source for any of
// the three (versioning is a hidden implementation detail with a single active version).
function IdentityScopeTab({
  catalog,
  tenantName,
  createdByName,
  productTemplateName,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const notApplicable = t("detail.identity.notApplicable")

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
            value={catalog.catalog_name}
          />
          <DetailRow
            label={t("detail.identity.layer")}
            value={t(`catalogLayers.${catalog.catalog_layer}`)}
          />
          {/* The scope key first, then the object it derives — the order they matter in. */}
          <DetailRow
            label={t("detail.identity.caseType")}
            value={
              catalog.case_type
                ? t(`caseTypes.${catalog.case_type}`)
                : notApplicable
            }
          />
          <DetailRow
            label={t("detail.identity.entityType")}
            value={
              catalog.entity_type
                ? t(`entityTypes.${catalog.entity_type}`)
                : notApplicable
            }
          />
          <DetailRow
            label={t("detail.identity.productTemplate")}
            value={productTemplateName ?? catalog.entity_id ?? notApplicable}
          />
          <DetailRow
            label={t("detail.identity.tenant")}
            value={tenantName ?? catalog.tenant_id}
          />
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
            value={
              <WorkflowTaskCatalogStateBadge state={catalog.catalog_state} />
            }
          />
          <DetailRow
            label={t("detail.lifecycle.createdAt")}
            value={formatDateTime(catalog.created_at)}
          />
          <DetailRow
            label={t("detail.lifecycle.createdBy")}
            value={createdByName ?? catalog.created_by}
          />
          <DetailRow
            label={t("detail.lifecycle.validFrom")}
            value={
              catalog.valid_from
                ? formatDate(catalog.valid_from)
                : t("detail.lifecycle.notSet")
            }
          />
          <DetailRow
            label={t("detail.lifecycle.validUntil")}
            value={
              catalog.valid_until
                ? formatDate(catalog.valid_until)
                : t("detail.lifecycle.openEnded")
            }
          />
        </div>
      </div>
    </div>
  )
}

export { IdentityScopeTab }
