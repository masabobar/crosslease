import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/ui/search-input"
import { SelectField } from "@/components/ui/select"
import { PROCESS_CONTEXT_OPTIONS } from "@/features/documentRequirements/constants"
import type { DocumentRequirementCatalogFilterState } from "@/features/documentRequirements/constants"

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filters: DocumentRequirementCatalogFilterState
  onFiltersChange: (
    update: Partial<DocumentRequirementCatalogFilterState>
  ) => void
}

// Search + a single-value process_context filter — matching GET .../document-requirement-catalogs.
// No catalog_type / Product Template / Created By filter: CR-1794 removed the product layer and no
// such query params exist on the backend (see open-questions.md).
function DocumentRequirementCatalogFilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")

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
