import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ShieldCheck, ListFilter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { EntityAuditHistoryTab } from "@/features/audit/components/EntityAuditHistoryTab"
import { ApiError } from "@/lib/api"
import { isUuidRouteParam } from "@/lib/routeParams"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useDocumentRequirementCatalogDetail } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogDetail"
import { DocumentRequirementCatalogIdentityTab } from "@/features/documentRequirements/components/DocumentRequirementCatalogIdentityTab"
import { DocumentRequirementCatalogRequirementsTab } from "@/features/documentRequirements/components/DocumentRequirementCatalogRequirementsTab"
import { DocumentRequirementCatalogSourceLayerTab } from "@/features/documentRequirements/components/DocumentRequirementCatalogSourceLayerTab"
import { DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/documentRequirements/types"
import type { DocumentRequirementCatalogDetailTab } from "@/features/documentRequirements/types"

const AUDIT_ENTITY_TYPE = "document_requirement_catalog"

const DETAIL_TABS: readonly DocumentRequirementCatalogDetailTab[] = [
  "identity",
  "requirements",
  "sourceLayer",
  "audit",
]

function isDetailTab(
  value: string | null
): value is DocumentRequirementCatalogDetailTab {
  return DETAIL_TABS.includes(value as DocumentRequirementCatalogDetailTab)
}

export default function DocumentRequirementCatalogDetailPage() {
  const { t } = useTranslation("documentRequirements")
  const { id: idParam } = useParams<{ id: string }>()
  const id = isUuidRouteParam(idParam) ? idParam : undefined
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()

  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] =
    useState<DocumentRequirementCatalogDetailTab>(
      isDetailTab(tabParam) ? tabParam : "identity"
    )

  const {
    data: catalog,
    isLoading,
    isError,
    error,
  } = useDocumentRequirementCatalogDetail(id)

  const { data: templates } = useSelectableProductTemplates()

  const canManage = Boolean(
    currentUser?.role &&
    DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="document-requirement-catalog-detail-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Unknown id, cross-tenant id and non-authorised role all come back as the same 404
  // (existence non-disclosure), so one message covers all three without revealing which it was.
  if (isError || !catalog) {
    return (
      <div className="p-8">
        <p
          data-testid="document-requirement-catalog-detail-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {error instanceof ApiError
            ? t(`errors.${error.code}` as "errors.generic", {
                defaultValue: t("errors.generic"),
              })
            : t("errors.generic")}
        </p>
      </div>
    )
  }

  const productTemplateName = catalog.product_template_id
    ? ((templates?.items ?? []).find(
        i => i.template_id === catalog.product_template_id
      )?.template_name ?? catalog.product_template_id)
    : null

  return (
    <div
      className="p-8 flex flex-col gap-4"
      data-testid="document-requirement-catalog-detail-page"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {catalog.catalog_name}
          </h1>
          <Badge variant="secondary">
            {t(
              `catalogTypes.${catalog.catalog_type}` as "catalogTypes.global_default"
            )}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-lg bg-muted px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm">
          <ShieldCheck size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.productTemplate")}
          </span>
          <span className="text-foreground">
            {productTemplateName ?? t("detail.identity.notApplicable")}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <ListFilter size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.processContexts")}
          </span>
          <span className="text-foreground">
            {catalog.applicable_process_contexts
              .map(value =>
                t(`processContexts.${value}` as "processContexts.financing", {
                  defaultValue: value,
                })
              )
              .join(", ")}
          </span>
        </span>
      </div>

      <UnderlineTabBar
        tabs={[
          {
            key: "identity",
            label: t("detail.tabs.identity"),
            testId: "tab-identity",
          },
          {
            key: "requirements",
            label: t("detail.tabs.requirements"),
            testId: "tab-requirements",
          },
          {
            key: "sourceLayer",
            label: t("detail.tabs.sourceLayer"),
            testId: "tab-source-layer",
          },
          {
            key: "audit",
            label: t("detail.tabs.audit"),
            testId: "tab-audit",
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="pt-2">
        {activeTab === "identity" && (
          <DocumentRequirementCatalogIdentityTab
            catalog={catalog}
            productTemplateName={productTemplateName}
            canManage={canManage}
          />
        )}
        {activeTab === "requirements" && (
          <DocumentRequirementCatalogRequirementsTab
            catalog={catalog}
            canManage={canManage}
          />
        )}
        {activeTab === "sourceLayer" && (
          <DocumentRequirementCatalogSourceLayerTab
            requirements={catalog.requirements}
          />
        )}
        {activeTab === "audit" && (
          <EntityAuditHistoryTab
            entityType={AUDIT_ENTITY_TYPE}
            entityId={catalog.id}
          />
        )}
      </div>
    </div>
  )
}
