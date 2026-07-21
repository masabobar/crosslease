import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import { FilterButton } from "@/components/ui/filter-button"
import { cn } from "@/lib/utils"
import {
  CATALOG_LAYER_OPTIONS,
  CATALOG_STATE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  VERSION_STATE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import type {
  CatalogLayer,
  CatalogState,
  EntityType,
  VersionState,
  WorkflowTaskCatalogFilterState,
} from "@/features/workflowTaskCatalog/constants"

type FilterKey = keyof WorkflowTaskCatalogFilterState

type Props = {
  search: string
  onSearchChange: (value: string) => void
  filters: WorkflowTaskCatalogFilterState
  onFiltersChange: (update: Partial<WorkflowTaskCatalogFilterState>) => void
  productTemplateOptions: { value: string; label: string }[]
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

// Local equivalent of the users feature's FilterCheckboxRow — not imported from there to
// keep this feature's filter popovers self-contained (features own their own components).
type FilterCheckboxRowProps = {
  checked: boolean
  onClick: () => void
  children: ReactNode
  "data-testid"?: string
}

function FilterCheckboxRow({
  checked,
  onClick,
  children,
  "data-testid": testId,
}: FilterCheckboxRowProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      data-testid={testId}
      onClick={onClick}
      className="w-full justify-start gap-2.5 px-3 py-2 h-auto rounded-none font-normal"
    >
      <span
        className={cn(
          "shrink-0 size-4 rounded border flex items-center justify-center transition-colors",
          checked ? "bg-primary border-primary" : "border-border"
        )}
      >
        {checked && <Check size={10} className="text-white" />}
      </span>
      {children}
    </Button>
  )
}

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
    versionState: t("list.filters.buttons.versionState"),
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
          {CATALOG_LAYER_OPTIONS.map(option => {
            const checked = filters.catalogLayer.includes(
              option.value as CatalogLayer
            )
            return (
              <FilterCheckboxRow
                key={option.value}
                checked={checked}
                data-testid={`catalog-filter-option-catalogLayer-${option.value}`}
                onClick={() =>
                  onFiltersChange({
                    catalogLayer: toggle(
                      filters.catalogLayer,
                      option.value as CatalogLayer
                    ),
                  })
                }
              >
                <span className="text-sm text-foreground">
                  {t(option.labelKey)}
                </span>
              </FilterCheckboxRow>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-entityType"
          label={buttonLabels.entityType}
          count={filters.entityType.length}
          contentClassName="w-52"
        >
          {ENTITY_TYPE_OPTIONS.map(option => {
            const checked = filters.entityType.includes(
              option.value as EntityType
            )
            return (
              <FilterCheckboxRow
                key={option.value}
                checked={checked}
                data-testid={`catalog-filter-option-entityType-${option.value}`}
                onClick={() =>
                  onFiltersChange({
                    entityType: toggle(
                      filters.entityType,
                      option.value as EntityType
                    ),
                  })
                }
              >
                <span className="text-sm text-foreground">
                  {t(option.labelKey)}
                </span>
              </FilterCheckboxRow>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-productTemplate"
          label={buttonLabels.productTemplate}
          count={filters.productTemplate.length}
          contentClassName="w-56 max-h-60 overflow-y-auto"
        >
          {productTemplateOptions.map(option => {
            const checked = filters.productTemplate.includes(option.value)
            return (
              <FilterCheckboxRow
                key={option.value}
                checked={checked}
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
              </FilterCheckboxRow>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-versionState"
          label={buttonLabels.versionState}
          count={filters.versionState.length}
          contentClassName="w-48"
        >
          {VERSION_STATE_OPTIONS.map(option => {
            const checked = filters.versionState.includes(
              option.value as VersionState
            )
            return (
              <FilterCheckboxRow
                key={option.value}
                checked={checked}
                data-testid={`catalog-filter-option-versionState-${option.value}`}
                onClick={() =>
                  onFiltersChange({
                    versionState: toggle(
                      filters.versionState,
                      option.value as VersionState
                    ),
                  })
                }
              >
                <span className="text-sm text-foreground">
                  {t(option.labelKey)}
                </span>
              </FilterCheckboxRow>
            )
          })}
        </FilterButton>

        <FilterButton
          data-testid="catalog-filter-catalogState"
          label={buttonLabels.catalogState}
          count={filters.catalogState.length}
          contentClassName="w-48"
        >
          {CATALOG_STATE_OPTIONS.map(option => {
            const checked = filters.catalogState.includes(
              option.value as CatalogState
            )
            return (
              <FilterCheckboxRow
                key={option.value}
                checked={checked}
                data-testid={`catalog-filter-option-catalogState-${option.value}`}
                onClick={() =>
                  onFiltersChange({
                    catalogState: toggle(
                      filters.catalogState,
                      option.value as CatalogState
                    ),
                  })
                }
              >
                <span className="text-sm text-foreground">
                  {t(option.labelKey)}
                </span>
              </FilterCheckboxRow>
            )
          })}
        </FilterButton>
      </div>
    </div>
  )
}

export { WorkflowTaskCatalogFilterBar }
