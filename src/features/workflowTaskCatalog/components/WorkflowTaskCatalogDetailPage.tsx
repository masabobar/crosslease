import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Landmark, ListFilter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { ApiError } from "@/lib/api"
import { isUuidRouteParam } from "@/lib/routeParams"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { IdentityScopeTab } from "@/features/workflowTaskCatalog/components/IdentityScopeTab"
import { TaskDefinitionsTab } from "@/features/workflowTaskCatalog/components/TaskDefinitionsTab"
import { AuditTrailTab } from "@/features/workflowTaskCatalog/components/AuditTrailTab"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUsers } from "@/features/users/hooks/useUsers"
import { resolveUserDisplayName } from "@/features/users/utils"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useWorkflowTaskCatalogDetail } from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogDetail"
import { WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/workflowTaskCatalog/types"
import type { WorkflowTaskCatalogDetailTab } from "@/features/workflowTaskCatalog/types"
import { CatalogStateSchema } from "@/features/workflowTaskCatalog/api/schema"

// The detail response returns created_by and tenant_id as UUIDs with no display names, so they
// are resolved against the tenant's user list — the same join SupportGrantsTab uses for a
// grant's "granted by". Generous page size because created_by may be any user in the tenant;
// an id outside the page falls back to the raw UUID rather than rendering blank. The durable
// fix is BE-side (see open-questions.md Q-042 — the audit-trail half of that entry is now
// fixed server-side, this detail-response half is not).
const NAME_LOOKUP_PAGE_SIZE = 100

// The "identity" and "taskDefinitions" tab values render as ONE combined tab trigger — the
// Figma design ("Identity & task definitions") stacks the identity cards and the task table
// under a single tab. Both values are accepted from ?tab= and displayed identically.
function toDisplayTab(
  tab: WorkflowTaskCatalogDetailTab
): "identity" | "auditTrail" {
  return tab === "taskDefinitions" ? "identity" : tab
}

// UI-only enum, never crosses the wire — a plain type guard is enough (no Zod schema
// needed per .claude/rules/enums-and-constants.md §3).
const DETAIL_TABS: readonly WorkflowTaskCatalogDetailTab[] = [
  "identity",
  "taskDefinitions",
  "auditTrail",
]

function isDetailTab(
  value: string | null
): value is WorkflowTaskCatalogDetailTab {
  return DETAIL_TABS.includes(value as WorkflowTaskCatalogDetailTab)
}

export default function WorkflowTaskCatalogDetailPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const { id: idParam } = useParams<{ id: string }>()
  const id = isUuidRouteParam(idParam) ? idParam : undefined
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()

  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<WorkflowTaskCatalogDetailTab>(
    isDetailTab(tabParam) ? tabParam : "identity"
  )

  const {
    data: catalog,
    isLoading,
    isError,
    error,
  } = useWorkflowTaskCatalogDetail(id)

  const { data: usersData } = useUsers({
    tenant_id: catalog?.tenant_id,
    per_page: NAME_LOOKUP_PAGE_SIZE,
  })
  const { data: templates } = useSelectableProductTemplates()

  const canManage = Boolean(
    currentUser?.role &&
    WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

  const displayTab = toDisplayTab(activeTab)

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="catalog-detail-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Unknown id, cross-tenant id and non-authorised role all come back as the same 404
  // (WTC_CATALOG_NOT_FOUND) by design — existence non-disclosure — so one message covers all
  // three without revealing which it was.
  if (isError || !catalog) {
    return (
      <div className="p-8">
        <p
          data-testid="catalog-detail-error"
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

  const users = usersData?.users ?? []
  // Resolves to the raw UUID when created_by is outside the fetched page — the same fallback
  // IdentityScopeTab applies for a null name, so the rendered value is unchanged.
  const createdByName = resolveUserDisplayName(
    users,
    catalog.created_by,
    catalog.created_by
  )
  // Taken from a user *of this catalogue's tenant* rather than the first user in the page
  // that happens to carry a name. GET /tenants/{id} is not used because it is admin/support
  // scoped, while this screen is also read by tenant-level roles — a lookup there would 403.
  const tenantName =
    users.find(u => u.tenant_id === catalog.tenant_id && u.tenant_name)
      ?.tenant_name ?? null
  const productTemplateName = catalog.entity_id
    ? ((templates?.items ?? []).find(i => i.template_id === catalog.entity_id)
        ?.template_name ?? null)
    : null

  // No draft state exists on the wire — a catalogue is created directly active and nothing
  // transitions it, so "active" is the editable state and "archived" is terminal read-only.
  // current_version_id is the only source of the version every task mutation needs: with no
  // version there is no request to build, so authoring is off rather than failing on submit.
  const canEditTasks =
    canManage &&
    catalog.catalog_state === CatalogStateSchema.enum.active &&
    catalog.current_version_id !== null

  return (
    <div
      className="p-8 flex flex-col gap-4"
      data-testid="workflow-task-catalog-detail-page"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {catalog.catalog_name}
            </h1>
            <Badge variant="secondary">
              {t(`catalogLayers.${catalog.catalog_layer}`)}
            </Badge>
            <WorkflowTaskCatalogStateBadge state={catalog.catalog_state} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-lg bg-muted px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm">
          <Landmark size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.tenant")}
          </span>
          <span className="text-foreground">
            {tenantName ?? catalog.tenant_id}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <ListFilter size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.entityType")}
          </span>
          <span className="text-foreground">
            {catalog.entity_type
              ? t(`entityTypes.${catalog.entity_type}`)
              : t("detail.identity.notApplicable")}
          </span>
        </span>
      </div>

      <UnderlineTabBar
        tabs={[
          {
            key: "identity",
            label: t("detail.tabs.identityAndTaskDefinitions"),
            testId: "tab-identity-and-task-definitions",
          },
          {
            key: "auditTrail",
            label: t("detail.tabs.auditTrail"),
            testId: "tab-audit-trail",
          },
        ]}
        activeTab={displayTab}
        onChange={setActiveTab}
      />

      <div className="pt-2">
        {displayTab === "identity" && (
          <div className="flex flex-col gap-6">
            <IdentityScopeTab
              catalog={catalog}
              tenantName={tenantName}
              createdByName={createdByName}
              productTemplateName={productTemplateName}
            />
            <TaskDefinitionsTab
              catalogId={catalog.id}
              versionId={catalog.current_version_id}
              catalogLayer={catalog.catalog_layer}
              entityType={catalog.entity_type}
              tenantId={catalog.tenant_id}
              tasks={catalog.tasks}
              canEdit={canEditTasks}
            />
          </div>
        )}
        {displayTab === "auditTrail" && (
          <AuditTrailTab catalogId={catalog.id} />
        )}
      </div>
    </div>
  )
}
