import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { PROCESS_CONTEXT_OPTIONS } from "@/features/documentRequirements/constants"

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  // Prefixes each checkbox's data-testid so the three forms using this group stay distinguishable
  // to QA's E2E suite (`create-catalog`, `edit-catalog`, `requirement`).
  testIdPrefix: string
}

// The Applicable Process Contexts multi-select, shared by the create dialog, the edit dialog and
// the requirement sheet — the same control with the same wire values in all three.
function ProcessContextCheckboxGroup({ value, onChange, testIdPrefix }: Props) {
  const { t } = useTranslation("documentRequirements")

  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-input p-2.5">
      {PROCESS_CONTEXT_OPTIONS.map(option => (
        // NOTE: raw <label> — shadcn's <Label> renders its own element and cannot wrap the
        // Checkbox to extend its click target, which is what makes the whole row clickable.
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Checkbox
            data-testid={`${testIdPrefix}-process-context-${option.value}`}
            checked={value.includes(option.value)}
            onCheckedChange={checked =>
              onChange(
                checked === true
                  ? [...value, option.value]
                  : value.filter(v => v !== option.value)
              )
            }
          />
          <span className="text-sm text-foreground">{t(option.labelKey)}</span>
        </label>
      ))}
    </div>
  )
}

export { ProcessContextCheckboxGroup }
