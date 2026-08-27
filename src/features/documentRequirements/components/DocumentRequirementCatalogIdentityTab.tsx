import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { EditDocumentRequirementCatalogDialog } from "@/features/documentRequirements/components/EditDocumentRequirementCatalogDialog"
import type { DocumentRequirementCatalogDetailResponse } from "@/features/documentRequirements/api/schema"

type Props = {
  catalog: DocumentRequirementCatalogDetailResponse
  canManage: boolean
}

function DocumentRequirementCatalogIdentityTab({ catalog, canManage }: Props) {
  const { t } = useTranslation("documentRequirements")
  const [isEditOpen, setIsEditOpen] = useState(false)

  // One catalogue per bank, created by the platform — so it is not named and has no meaningful
  // author to show. This tab is now just the catalogue's validity window and timestamps.
  const fields: { labelKey: string; value: string }[] = [
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
