import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { DocumentTypeRowActionsMenu } from "@/features/documentRequirements/components/DocumentTypeRowActionsMenu"
import type { DocumentType } from "@/features/documentRequirements/api/schema"

// NOTE: raw <div> grid instead of shadcn Table — matches the pre-existing div-grid pattern used by
// the sibling list tables (DocumentRequirementCatalogTable, RequirementTable). Name is the only
// flexible column.
const COL_CODE = "w-[160px] shrink-0"
const COL_NAME = "flex-1 min-w-[160px]"
const COL_ROLE_SCOPE = "w-[130px] shrink-0"
const COL_ORIGIN = "w-[130px] shrink-0"
const COL_STATUS = "w-[100px] shrink-0"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

const HEADER_COLUMNS = [
  { width: COL_CODE, labelKey: "documentType.table.columns.typeCode" },
  { width: COL_NAME, labelKey: "documentType.table.columns.typeName" },
  { width: COL_ROLE_SCOPE, labelKey: "documentType.table.columns.roleScope" },
  { width: COL_ORIGIN, labelKey: "documentType.table.columns.origin" },
  { width: COL_STATUS, labelKey: "documentType.table.columns.status" },
] as const

type Props = {
  rows: DocumentType[]
  isLoading: boolean
  canManage: boolean
  onEdit: (documentType: DocumentType) => void
  onToggleActive: (documentType: DocumentType) => void
}

function DocumentTypeTable({
  rows,
  isLoading,
  canManage,
  onEdit,
  onToggleActive,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="document-type-table"
    >
      <div className="flex border-b border-border h-10 items-center">
        {HEADER_COLUMNS.map(col => (
          <div
            key={col.labelKey}
            className={`${col.width} text-sm font-medium text-foreground px-2`}
          >
            {t(col.labelKey)}
          </div>
        ))}
        <div className="shrink-0 w-10" />
      </div>

      {isLoading && (
        <div data-testid="document-type-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              {HEADER_COLUMNS.map(col => (
                <div key={col.labelKey} className={`${col.width} p-2`}>
                  <div className="bg-muted rounded h-4 animate-pulse w-20" />
                </div>
              ))}
              <div className="shrink-0 w-10" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && rows.length === 0 && (
        <TableEmptyState
          title={t("documentType.emptyState.title")}
          description={t("documentType.emptyState.description")}
        />
      )}

      {!isLoading &&
        rows.map(row => (
          <div
            key={row.id}
            data-testid={`document-type-row-${row.id}`}
            className={`flex border-b border-border last:border-b-0 ${ROW_H} items-center`}
          >
            <div className={`${COL_CODE} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {row.type_code}
              </p>
            </div>
            <div className={`${COL_NAME} p-2`}>
              <p className="text-sm text-foreground truncate">
                {row.type_name}
              </p>
            </div>
            <div className={`${COL_ROLE_SCOPE} p-2`}>
              <span className="text-sm text-foreground">
                {t(
                  `documentType.roleScopes.${row.role_scope}` as "documentType.roleScopes.lessee"
                )}
              </span>
            </div>
            <div className={`${COL_ORIGIN} p-2`}>
              <span className="text-sm text-foreground">
                {t(
                  `documentType.origins.${row.origin}` as "documentType.origins.requested"
                )}
              </span>
            </div>
            <div className={`${COL_STATUS} p-2`}>
              <Badge variant={row.is_active ? "secondary" : "outline"}>
                {row.is_active
                  ? t("documentType.active")
                  : t("documentType.inactive")}
              </Badge>
            </div>
            <div className="shrink-0 w-10 p-2 flex items-center justify-center">
              <DocumentTypeRowActionsMenu
                documentTypeId={row.id}
                isActive={row.is_active}
                canManage={canManage}
                onEdit={() => onEdit(row)}
                onToggleActive={() => onToggleActive(row)}
              />
            </div>
          </div>
        ))}
    </div>
  )
}

export { DocumentTypeTable }
