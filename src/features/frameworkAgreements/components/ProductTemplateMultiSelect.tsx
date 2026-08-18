import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchInput } from "@/components/ui/search-input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import {
  canonicalVersionByTemplate,
  filterSelectableTemplates,
  filterTemplatesEffectiveBy,
  groupByTemplateId,
  splitGroupsIntoColumns,
} from "@/features/frameworkAgreements/utils"
import type { SelectableTemplateItem } from "@/features/frameworkAgreements/api/schema"

// template_id alone is no longer unique per row: the selectable endpoint is version-scoped
// (one row per selectable version) and dedupeSelectableTemplates no longer collapses those
// rows down to one per template, so the same template_id can arrive twice — once for its
// active version, once for an in-window superseded one. Row identity (React key, testid)
// needs both parts.
function templateOptionKey(option: SelectableTemplateItem): string {
  return `${option.template_id}:${option.version_number}`
}

type Props = {
  value: string[]
  onChange: (value: string[]) => void
  error?: boolean
  // Create-wizard-only: narrows options to templates already valid by this date. Omitted
  // (or empty) by every other caller, which keeps the full unfiltered list — see
  // filterTemplatesEffectiveBy in utils.ts.
  agreementValidFrom?: string
}

function ProductTemplateMultiSelect({
  value,
  onChange,
  error,
  agreementValidFrom,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { data, isLoading, isError } = useSelectableProductTemplates()
  const [search, setSearch] = useState("")
  // Which version-row was actually clicked for each currently-selected template_id.
  // product_template_ids only ever stores the template_id, so this is the one place that
  // remembers the choice — without it, checking a non-canonical version's row would be
  // indistinguishable from checking any other version of the same template.
  const [selectedVersionByTemplate, setSelectedVersionByTemplate] = useState<
    Record<string, string>
  >({})

  // No longer collapsed to one row per template (useSelectableProductTemplates' dedupe is a
  // no-op) — a template can appear once per selectable version, so rows are keyed by
  // templateOptionKey (template_id + version_number), not template_id alone.
  const options = data?.items ?? []
  const eligibleOptions = filterTemplatesEffectiveBy(
    options,
    agreementValidFrom ?? ""
  )
  // One array per distinct template_id — rendered as a vertical stack per group, so
  // duplicate version-rows of the same template sit one beneath another rather than
  // side by side in the 2-column layout.
  const groupedOptions = groupByTemplateId(
    filterSelectableTemplates(eligibleOptions, search)
  )
  // Each whole group goes into one of the two columns, balanced by row count rather than
  // split by CSS grid auto-flow — see splitGroupsIntoColumns.
  const [leftColumnGroups, rightColumnGroups] =
    splitGroupsIntoColumns(groupedOptions)
  // Fallback for a template_id that's already in `value` but has no remembered version yet
  // (initial render, or a `value` populated from an existing agreement on the Edit wizard).
  // Computed from eligibleOptions, not visibleOptions: it must not shift as the user types
  // in the search box.
  const canonicalVersions = canonicalVersionByTemplate(eligibleOptions)

  function toggleTemplate(option: SelectableTemplateItem) {
    const { template_id, version_number } = option
    if (value.includes(template_id)) {
      onChange(value.filter(v => v !== template_id))
      setSelectedVersionByTemplate(prev => {
        if (!(template_id in prev)) return prev
        const next = { ...prev }
        delete next[template_id]
        return next
      })
    } else {
      onChange([...value, template_id])
      setSelectedVersionByTemplate(prev => ({
        ...prev,
        [template_id]: version_number,
      }))
    }
  }

  function renderOption(option: SelectableTemplateItem) {
    const optionKey = templateOptionKey(option)
    const isTemplateSelected = value.includes(option.template_id)
    const selectedVersion =
      selectedVersionByTemplate[option.template_id] ??
      canonicalVersions.get(option.template_id)
    const checked =
      isTemplateSelected && selectedVersion === option.version_number
    // Any version's row is selectable — but once one is checked, every
    // other version-row of the same template_id is disabled until it's
    // unchecked.
    const disabled = isTemplateSelected && !checked
    return (
      <label
        key={optionKey}
        className={cn(
          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          checked ? "border-primary bg-primary/5" : "border-input hover:bg-muted"
        )}
        data-testid={`template-option-${optionKey}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Checkbox
            checked={checked}
            disabled={disabled}
            onCheckedChange={() => toggleTemplate(option)}
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="truncate text-sm text-foreground">
                  {option.template_name}
                </span>
              }
            />
            <TooltipContent>
              {disabled
                ? t("wizard.validityTemplates.templateVersionDisabled")
                : option.template_name}
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {option.template_code} · v{option.version_number}
        </span>
      </label>
    )
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("errors.generic")}</p>
  }

  if (options.length === 0) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="product-template-multi-select-empty"
      >
        {t("wizard.validityTemplates.templatesEmpty")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        data-testid="product-template-search"
        placeholder={t("wizard.validityTemplates.templatesSearchPlaceholder")}
        value={search}
        onChange={event => setSearch(event.target.value)}
      />

      {groupedOptions.length === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="product-template-multi-select-no-matches"
        >
          {t("wizard.validityTemplates.templatesNoMatches")}
        </p>
      ) : (
        <TooltipProvider>
          <div
            className="grid grid-cols-2 gap-3"
            aria-invalid={error}
            data-testid="product-template-multi-select"
          >
            {[leftColumnGroups, rightColumnGroups].map(
              (columnGroups, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-3">
                  {columnGroups.map(group => (
                    <div
                      key={group[0].template_id}
                      className="flex flex-col gap-2"
                    >
                      {group.map(renderOption)}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </TooltipProvider>
      )}
    </div>
  )
}

export { ProductTemplateMultiSelect }
