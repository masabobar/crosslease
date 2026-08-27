import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/ui/search-input"

type Props = {
  search: string
  onSearchChange: (value: string) => void
}

// Search only — matching GET .../document-requirement-catalogs. CR-1794 removed the product layer,
// and the DRC usability change retired the catalog's process-context axis, so there is no
// catalog_type / Product Template / process-context filter (none of those query params exist on the
// backend anymore).
function DocumentRequirementCatalogFilterBar({
  search,
  onSearchChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <div className="flex items-center gap-4">
      <SearchInput
        data-testid="document-requirement-catalog-filter-search"
        placeholder={t("list.filters.searchPlaceholder")}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-[288px]"
      />
    </div>
  )
}

export { DocumentRequirementCatalogFilterBar }
