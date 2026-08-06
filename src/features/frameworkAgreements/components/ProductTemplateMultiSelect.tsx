import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchInput } from "@/components/ui/search-input"
import { cn } from "@/lib/utils"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { filterSelectableTemplates } from "@/features/frameworkAgreements/utils"

type Props = {
  value: string[]
  onChange: (value: string[]) => void
  error?: boolean
}

function ProductTemplateMultiSelect({ value, onChange, error }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { t: tCommon } = useTranslation("common")
  const { data, isLoading, isError } = useSelectableProductTemplates()
  const [search, setSearch] = useState("")

  // Already collapsed to one row per template by the hook's select — see
  // useSelectableProductTemplates. Options here are safe to key on template_id.
  const options = data?.items ?? []
  const visibleOptions = filterSelectableTemplates(options, search)

  function toggleTemplate(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
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

      {visibleOptions.length === 0 ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="product-template-multi-select-no-matches"
        >
          {t("wizard.validityTemplates.templatesNoMatches")}
        </p>
      ) : (
        <div
          className="grid grid-cols-2 gap-3"
          aria-invalid={error}
          data-testid="product-template-multi-select"
        >
          {visibleOptions.map(option => {
            const checked = value.includes(option.template_id)
            return (
              <label
                key={option.template_id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted"
                )}
                data-testid={`template-option-${option.template_id}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleTemplate(option.template_id)}
                  />
                  <span className="truncate text-sm text-foreground">
                    {option.template_name}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {option.template_code} · v{option.version_number}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { ProductTemplateMultiSelect }
