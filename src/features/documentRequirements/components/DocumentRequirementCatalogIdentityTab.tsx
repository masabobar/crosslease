import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useUsers } from "@/features/users/hooks/useUsers"
import { EditDocumentRequirementCatalogDialog } from "@/features/documentRequirements/components/EditDocumentRequirementCatalogDialog"
import type { DocumentRequirementCatalogDetailResponse } from "@/features/documentRequirements/api/schema"

// created_by has no display name on the wire — resolved against the tenant's user list, the
// same join WorkflowTaskCatalogDetailPage uses. There is no tenant_id on this catalog's own
// response (unlike the Workflow Task Catalog's), so the signed-in user's own tenant is used —
// RBAC already guarantees a Power User only ever reaches their own tenant's catalogs.
const NAME_LOOKUP_PAGE_SIZE = 100

type Props = {
  catalog: DocumentRequirementCatalogDetailResponse
  canManage: boolean
}

function DocumentRequirementCatalogIdentityTab({ catalog, canManage }: Props) {
  const { t } = useTranslation("documentRequirements")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { data: currentUser } = useCurrentUser()
  const { data: usersData } = useUsers({
    tenant_id: currentUser?.tenant_id ?? undefined,
    per_page: NAME_LOOKUP_PAGE_SIZE,
  })

  const createdBy = (usersData?.users ?? []).find(
    u => u.id === catalog.created_by
  )
  const createdByName = createdBy
    ? `${createdBy.first_name} ${createdBy.last_name}`
    : catalog.created_by

  const fields: { labelKey: string; value: string }[] = [
    { labelKey: "detail.identity.catalogName", value: catalog.catalog_name },
    {
      labelKey: "detail.identity.processContexts",
      value: catalog.applicable_process_contexts
        .map(value =>
          t(`processContexts.${value}` as "processContexts.financing", {
            defaultValue: value,
          })
        )
        .join(", "),
    },
    {
      labelKey: "detail.identity.validFrom",
      value: catalog.valid_from
        ? formatDate(catalog.valid_from)
        : t("detail.identity.notApplicable"),
    },
    {
      labelKey: "detail.identity.validTo",
      value: catalog.valid_to
        ? formatDate(catalog.valid_to)
        : t("detail.identity.openEnded"),
    },
    { labelKey: "detail.identity.createdBy", value: createdByName },
    {
      labelKey: "detail.identity.createdAt",
      value: formatDateTime(catalog.created_at),
    },
    {
      labelKey: "detail.identity.updatedAt",
      value: formatDateTime(catalog.updated_at),
    },
  ]

  return (
    <div
      className="rounded-lg border border-border p-4"
      data-testid="document-requirement-catalog-identity-tab"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-foreground">
          {t("detail.identity.title")}
        </h2>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            data-testid="edit-catalog-identity-button"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil size={14} />
            {t("detail.identity.editButton")}
          </Button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.labelKey}>
            <dt className="text-sm text-muted-foreground">
              {t(field.labelKey as "detail.identity.catalogName")}
            </dt>
            <dd className="text-sm text-foreground mt-1">{field.value}</dd>
          </div>
        ))}
      </dl>

      {isEditOpen && (
        <EditDocumentRequirementCatalogDialog
          catalog={catalog}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  )
}

export { DocumentRequirementCatalogIdentityTab }
