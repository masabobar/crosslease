import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"

type Props = {
  value: string[]
  onChange: (value: string[]) => void
  error?: boolean
}

function ProductTemplateMultiSelect({ value, onChange, error }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const { data, isLoading, isError } = useSelectableProductTemplates()

  const options = data?.items ?? []

  function toggleTemplate(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">…</p>
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("errors.generic")}</p>
  }

  return (
    <div
      className="grid grid-cols-2 gap-3"
      aria-invalid={error}
      data-testid="product-template-multi-select"
    >
      {options.map(option => {
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
              v{option.version_number}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export { ProductTemplateMultiSelect }
