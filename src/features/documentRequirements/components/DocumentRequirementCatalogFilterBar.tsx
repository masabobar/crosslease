import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/ui/search-input"
import { SelectField } from "@/components/ui/select"
import {
  CATALOG_TYPE_OPTIONS,
  PROCESS_CONTEXT_OPTIONS,
} from "@/features/documentRequirements/constants"
import type { DocumentRequirementCatalogFilterState } from "@/features/documentRequirements/constants"
import { DocumentRequirementCatalogTypeSchema } from "@/features/documentRequirements/api/schema"

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filters: DocumentRequirementCatalogFilterState
  onFiltersChange: (
    update: Partial<DocumentRequirementCatalogFilterState>
  ) => void
}

// Two filters, both single-value — matching GET .../document-requirement-catalogs, which takes
// one catalog_type and one process_context param each. No Product Template / Created By filter:
// no such query params exist on the backend (see open-questions.md).
function DocumentRequirementCatalogFilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  const catalogTypeOptions = [
    { value: "", label: t("list.filters.allCatalogTypes") },
    ...CATALOG_TYPE_OPTIONS.map(o => ({
      value: o.value,
      label: t(o.labelKey),
    })),
  ]
  const processContextOptions = [
    { value: "", label: t("list.filters.allProcessContexts") },
    ...PROCESS_CONTEXT_OPTIONS.map(o => ({
      value: o.value,
      label: t(o.labelKey),
    })),
  ]

  return (
    <div className="flex items-center gap-4">
      <SearchInput
        data-testid="document-requirement-catalog-filter-search"
        placeholder={t("list.filters.searchPlaceholder")}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-[288px]"
      />

      <div className="flex items-center gap-2">
        <SelectField
          data-testid="document-requirement-catalog-filter-catalogType"
          value={filters.catalogType ?? ""}
          // "" is the All option; anything else is narrowed through the wire enum rather than
          // cast, so a stale option value cannot reach the query params unvalidated.
          onValueChange={v =>
            onFiltersChange({
              catalogType:
                DocumentRequirementCatalogTypeSchema.safeParse(v).data ?? null,
            })
          }
          options={catalogTypeOptions}
          className="w-48"
        />
        <SelectField
          data-testid="document-requirement-catalog-filter-processContext"
          value={filters.processContext ?? ""}
          onValueChange={v => onFiltersChange({ processContext: v || null })}
          options={processContextOptions}
          className="w-52"
        />
      </div>
    </div>
  )
}

export { DocumentRequirementCatalogFilterBar }
