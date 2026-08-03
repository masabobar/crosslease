import { useTranslation } from "react-i18next"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { FilterCheckboxOption } from "@/components/ui/filter-checkbox-option"
import {
  CATALOG_LAYER_OPTIONS,
  CATALOG_STATE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import type { WorkflowTaskCatalogFilterState } from "@/features/workflowTaskCatalog/constants"

type FilterKey = keyof WorkflowTaskCatalogFilterState

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filters: WorkflowTaskCatalogFilterState
  onFiltersChange: (update: Partial<WorkflowTaskCatalogFilterState>) => void
  // { value: template UUID, label: template name } — the filter sends UUIDs on the wire.
  productTemplateOptions: { value: string; label: string }[]
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

// Four filters, all backed by real query params on GET /workflow-task-catalogs. Version is
// absent because versioning is not exposed on the wire at all, and US 15.22's November scope
// note removes it.
function WorkflowTaskCatalogFilterBar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  productTemplateOptions,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")

  const buttonLabels: Record<FilterKey, string> = {
    catalogLayer: t("list.filters.buttons.catalogLayer"),
    entityType: t("list.filters.buttons.entityType"),
    productTemplate: t("list.filters.buttons.productTemplate"),
    catalogState: t("list.filters.buttons.catalogState"),
  }

  return (
    <div className="flex items-center gap-4">
      <SearchInput
        data-testid="catalog-filter-search"
        placeholder={t("list.filters.searchPlaceholder")}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        className="w-[288px]"
      />

      <div className="flex items-center gap-2">
        <FilterButton
          data-testid="catalog-filter-catalogLayer"
          label={buttonLabels.catalogLayer}
          count={filters.catalogLayer.length}
          contentClassName="w-48"
        >
          {CATALOG_LAYER_OPTIONS.map(option => (
            <FilterCheckboxOption
              key={option.value}
              checked={filters.catalogLayer.includes(option.value)}
              data-testid={`catalog-filter-option-catalogLayer-${option.value}`}
              onClick={() =>
                onFiltersChange({
                  catalogLayer: toggle(filters.catalogLayer, option.value),
                })
              }
            >
              <span className="text-sm text-foreground">
                {t(option.labelKey)}
              </span>
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-entityType"
          label={buttonLabels.entityType}
          count={filters.entityType.length}
          contentClassName="w-52"
        >
          {ENTITY_TYPE_OPTIONS.map(option => (
            <FilterCheckboxOption
              key={option.value}
              checked={filters.entityType.includes(option.value)}
              data-testid={`catalog-filter-option-entityType-${option.value}`}
              onClick={() =>
                onFiltersChange({
                  entityType: toggle(filters.entityType, option.value),
                })
              }
            >
              <span className="text-sm text-foreground">
                {t(option.labelKey)}
              </span>
            </FilterCheckboxOption>
          ))}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-productTemplate"
          label={buttonLabels.productTemplate}
          count={filters.productTemplate.length}
          contentClassName="w-56 max-h-60 overflow-y-auto"
        >
          {productTemplateOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {t("list.filters.noProductTemplates")}
            </p>
          ) : (
            productTemplateOptions.map(option => (
              <FilterCheckboxOption
                key={option.value}
                checked={filters.productTemplate.includes(option.value)}
                data-testid={`catalog-filter-option-productTemplate-${option.value}`}
                onClick={() =>
                  onFiltersChange({
                    productTemplate: toggle(
                      filters.productTemplate,
                      option.value
                    ),
                  })
                }
              >
                <span className="text-sm text-foreground">{option.label}</span>
              </FilterCheckboxOption>
            ))
          )}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-catalogState"
          label={buttonLabels.catalogState}
          count={filters.catalogState.length}
          contentClassName="w-48"
        >
          {CATALOG_STATE_OPTIONS.map(option => (
            <FilterCheckboxOption
              key={option.value}
              checked={filters.catalogState.includes(option.value)}
              data-testid={`catalog-filter-option-catalogState-${option.value}`}
              onClick={() =>
                onFiltersChange({
                  catalogState: toggle(filters.catalogState, option.value),
                })
              }
            >
              <span className="text-sm text-foreground">
                {t(option.labelKey)}
              </span>
            </FilterCheckboxOption>
          ))}
        </FilterButton>
      </div>
    </div>
  )
}

export { WorkflowTaskCatalogFilterBar }
