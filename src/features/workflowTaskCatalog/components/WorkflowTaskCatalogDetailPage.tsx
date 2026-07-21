import { useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, Landmark, ListFilter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { WorkflowTaskCatalogStateBadge } from "@/features/workflowTaskCatalog/components/WorkflowTaskCatalogStateBadge"
import { IdentityScopeTab } from "@/features/workflowTaskCatalog/components/IdentityScopeTab"
import { TaskDefinitionsTab } from "@/features/workflowTaskCatalog/components/TaskDefinitionsTab"
import { VersionHistoryTab } from "@/features/workflowTaskCatalog/components/VersionHistoryTab"
import { MigrationHistoryTab } from "@/features/workflowTaskCatalog/components/MigrationHistoryTab"
import { AuditTrailTab } from "@/features/workflowTaskCatalog/components/AuditTrailTab"
import { EffectiveTaskSetPreviewSheet } from "@/features/workflowTaskCatalog/components/EffectiveTaskSetPreviewSheet"
import { SubmitForActivationDialog } from "@/features/workflowTaskCatalog/components/SubmitForActivationDialog"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES } from "@/features/workflowTaskCatalog/types"
import type { WorkflowTaskCatalogDetailTab } from "@/features/workflowTaskCatalog/types"
import {
  CATALOG_STATE,
  PLACEHOLDER_CATALOG_DETAIL_META,
  PLACEHOLDER_CATALOG_ROWS,
} from "@/features/workflowTaskCatalog/constants"

// The "identity" and "taskDefinitions" tab values from WorkflowTaskCatalogDetailTab
// render as ONE combined tab trigger — the Figma design ("Identity & task
// definitions") shows the Identity/Lifecycle cards and the Task definitions table
// stacked under a single tab, not two separate ones. Both values are accepted from
// ?tab= (and from WorkflowTaskCatalogListPage row actions) and displayed identically.
function toDisplayTab(
  tab: WorkflowTaskCatalogDetailTab
): "identity" | "versionHistory" | "migrationHistory" | "auditTrail" {
  return tab === "taskDefinitions" ? "identity" : tab
}

// UI-only enum, never crosses the wire — a plain type guard is enough (no Zod schema
// needed per .claude/rules/enums-and-constants.md §3).
const DETAIL_TABS: readonly WorkflowTaskCatalogDetailTab[] = [
  "identity",
  "taskDefinitions",
  "versionHistory",
  "migrationHistory",
  "auditTrail",
]

function isDetailTab(
  value: string | null
): value is WorkflowTaskCatalogDetailTab {
  return DETAIL_TABS.includes(value as WorkflowTaskCatalogDetailTab)
}

export default function WorkflowTaskCatalogDetailPage() {
  const { t } = useTranslation("workflowTaskCatalog")
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { data: currentUser } = useCurrentUser()

  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<WorkflowTaskCatalogDetailTab>(
    isDetailTab(tabParam) ? tabParam : "identity"
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)

  // Placeholder-only lookup — no detail endpoint exists yet for Epic 15 (see
  // CLAUDE.md). Reusing the matching list row keeps the header consistent with
  // whichever row the user navigated from; falls back to the first row directly.
  const row =
    PLACEHOLDER_CATALOG_ROWS.find(r => r.id === id) ??
    PLACEHOLDER_CATALOG_ROWS[0]

  const canManage = Boolean(
    currentUser?.role &&
    WORKFLOW_TASK_CATALOG_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )
  const isDraft = row.catalogState === CATALOG_STATE.DRAFT
  const canEditTasks = canManage && isDraft

  const displayTab = toDisplayTab(activeTab)

  return (
    <div
      className="p-8 flex flex-col gap-4"
      data-testid="workflow-task-catalog-detail-page"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {row.catalogName}
            </h1>
            <Badge variant="secondary">
              {t(`catalogLayers.${row.catalogLayer}`)}
            </Badge>
            <WorkflowTaskCatalogStateBadge state={row.catalogState} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="preview-effective-tasks-button"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={16} />
            {t("detail.header.previewEffectiveTasksButton")}
          </Button>
          {canEditTasks && (
            <Button
              type="button"
              data-testid="submit-for-activation-button"
              onClick={() => setSubmitDialogOpen(true)}
            >
              {t("detail.header.submitForActivationButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-lg bg-muted px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm">
          <Landmark size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.tenant")}
          </span>
          <span className="text-foreground">
            {PLACEHOLDER_CATALOG_DETAIL_META.tenantName}
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <ListFilter size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">
            {t("detail.header.entityType")}
          </span>
          <span className="text-foreground">
            {t(`entityTypes.${row.entityType}`)}
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
            key: "versionHistory",
            label: t("detail.tabs.versionHistory"),
            testId: "tab-version-history",
          },
          {
            key: "migrationHistory",
            label: t("detail.tabs.migrationHistory"),
            testId: "tab-migration-history",
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
              catalogName={row.catalogName}
              catalogLayer={row.catalogLayer}
              entityType={row.entityType}
              productTemplateName={row.productTemplateName}
              tenantName={PLACEHOLDER_CATALOG_DETAIL_META.tenantName}
              catalogState={row.catalogState}
              createdAt={PLACEHOLDER_CATALOG_DETAIL_META.createdAt}
              createdBy={PLACEHOLDER_CATALOG_DETAIL_META.createdBy}
              activeVersion={row.version}
              publishedAt={row.publishedAt}
              publishedBy={
                row.publishedAt
                  ? PLACEHOLDER_CATALOG_DETAIL_META.publishedBy
                  : null
              }
              validFrom={PLACEHOLDER_CATALOG_DETAIL_META.validFrom}
              validUntil={PLACEHOLDER_CATALOG_DETAIL_META.validUntil}
            />
            <TaskDefinitionsTab
              catalogLayer={row.catalogLayer}
              canEdit={canEditTasks}
            />
          </div>
        )}
        {displayTab === "versionHistory" && <VersionHistoryTab />}
        {displayTab === "migrationHistory" && (
          <MigrationHistoryTab catalogId={row.id} canManage={canManage} />
        )}
        {displayTab === "auditTrail" && <AuditTrailTab />}
      </div>

      {previewOpen && (
        <EffectiveTaskSetPreviewSheet
          activeVersion={row.version}
          productTemplateName={row.productTemplateName}
          entityType={row.entityType}
          onOpenChange={setPreviewOpen}
        />
      )}

      {submitDialogOpen && (
        <SubmitForActivationDialog onOpenChange={setSubmitDialogOpen} />
      )}
    </div>
  )
}
