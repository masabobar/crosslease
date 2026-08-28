import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { EntityAuditHistoryTab } from "@/features/audit/components/EntityAuditHistoryTab"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useDocumentRequirementCatalogList } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogList"
import { useDocumentRequirementCatalogDetail } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogDetail"
import { DocumentRequirementCatalogIdentityTab } from "@/features/documentRequirements/components/DocumentRequirementCatalogIdentityTab"
import { DocumentRequirementCatalogRequirementsTab } from "@/features/documentRequirements/components/DocumentRequirementCatalogRequirementsTab"
import { DocumentTypesTab } from "@/features/documentRequirements/components/DocumentTypesTab"
import {
  DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES,
  DOCUMENT_TYPE_MANAGE_ALLOWED_ROLES,
} from "@/features/documentRequirements/types"
import type { DocumentRequirementCatalogDetailTab } from "@/features/documentRequirements/types"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

const AUDIT_ENTITY_TYPE = "document_requirement_catalog"

// UI-only enum, never crosses the wire — a plain type guard is enough (no Zod schema needed
// per .claude/rules/enums-and-constants.md §3).
const DETAIL_TABS: readonly DocumentRequirementCatalogDetailTab[] = [
  "identity",
  "requirements",
  "audit",
  "documentTypes",
]

function isDetailTab(
  value: string | null
): value is DocumentRequirementCatalogDetailTab {
  return DETAIL_TABS.includes(value as DocumentRequirementCatalogDetailTab)
}

/**
 * The bank's single document catalogue (PRD1042-1794 DRC usability).
 *
 * There is one catalogue per bank (CR-DRC A2), so it is never named, listed or created by hand: the
 * bank goes straight to authoring required documents. This page resolves that single catalogue from
 * the tenant (the list endpoint's first — and only — item; the catalogue is created up front at
 * bank-tenant creation) and renders its Requirements / validity / audit directly under a fixed
 * "Document Catalog" heading. No catalogue-list page and no create dialog exist anymore.
 */
export default function DocumentCatalogPage() {
  const { t } = useTranslation("documentRequirements")
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? undefined

  // `?tab=` is read once as the initial tab, not kept in sync afterwards: the only thing that
  // writes it is the redirect from the retired /document-types route, which needs to land on the
  // registry rather than on Requirements.
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] =
    useState<DocumentRequirementCatalogDetailTab>(
      isDetailTab(tabParam) ? tabParam : "requirements"
    )

  const canManage = Boolean(
    currentUser?.role &&
    DOCUMENT_REQUIREMENT_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  // The document-type registry is Bank Power User only. This page's own guard is the WIDER
  // catalogue READ set, which also admits support_user and auditor for read-only diagnostics —
  // so the tab carries its own gate rather than inheriting the page's. Without this, moving the
  // registry off its own route would hand an authoring surface to two roles that were
  // deliberately excluded from it.
  const canManageDocumentTypes = Boolean(
    currentUser?.role &&
    DOCUMENT_TYPE_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  // Resolve the one catalogue: one per bank, so the first item IS the catalogue. A single page of
  // one is all that can come back.
  const {
    data: list,
    isPending: isListPending,
    isError: isListError,
    error: listError,
  } = useDocumentRequirementCatalogList(tenantId, { page: 1, per_page: 1 })

  const catalogId = list?.items?.[0]?.id

  const {
    data: catalog,
    isPending: isDetailPending,
    isError: isDetailError,
    error: detailError,
  } = useDocumentRequirementCatalogDetail(catalogId)

  if (isListPending || (catalogId && isDetailPending)) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="document-catalog-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isListError) {
    return (
      <div className="p-8">
        <p
          data-testid="document-catalog-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(listError, t)}
        </p>
      </div>
    )
  }

  // The catalogue is created with the bank tenant, so this is not the normal path — but a tenant
  // provisioned before that change (and not yet backfilled) would have none. Say so plainly rather
  // than render an empty catalogue that looks broken.
  if (!catalogId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          {t("catalog.title")}
        </h1>
        <Alert data-testid="document-catalog-missing">
          <AlertTitle>{t("catalog.missing.title")}</AlertTitle>
          <AlertDescription>
            {t("catalog.missing.description")}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isDetailError || !catalog) {
    return (
      <div className="p-8">
        <p
          data-testid="document-catalog-detail-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(detailError, t)}
        </p>
      </div>
    )
  }

  return (
    <div
      className="p-8 flex flex-col gap-4"
      data-testid="document-catalog-page"
    >
      <h1 className="text-2xl font-semibold text-foreground">
        {t("catalog.title")}
      </h1>

      <UnderlineTabBar
        tabs={[
          {
            key: "requirements",
            label: t("detail.tabs.requirements"),
            testId: "tab-requirements",
          },
          {
            key: "identity",
            label: t("detail.tabs.identity"),
            testId: "tab-identity",
          },
          {
            key: "audit",
            label: t("detail.tabs.audit"),
            testId: "tab-audit",
          },
          ...(canManageDocumentTypes
            ? [
                {
                  key: "documentTypes" as const,
                  label: t("detail.tabs.documentTypes"),
                  testId: "tab-document-types",
                },
              ]
            : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="pt-2">
        {activeTab === "requirements" && (
          <DocumentRequirementCatalogRequirementsTab
            catalog={catalog}
            canManage={canManage}
          />
        )}
        {activeTab === "identity" && (
          <DocumentRequirementCatalogIdentityTab
            catalog={catalog}
            canManage={canManage}
          />
        )}
        {activeTab === "audit" && (
          <EntityAuditHistoryTab
            entityType={AUDIT_ENTITY_TYPE}
            entityId={catalog.id}
          />
        )}
        {activeTab === "documentTypes" && canManageDocumentTypes && (
          <DocumentTypesTab
            tenantId={tenantId}
            canManage={canManageDocumentTypes}
          />
        )}
      </div>
    </div>
  )
}
