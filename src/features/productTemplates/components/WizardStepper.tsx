import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { ProductTemplateWizardStep } from "@/features/productTemplates/types"

// Step 5 (review) is display-only — it belongs to the wizard's Review & Publish step,
// which isn't built yet (Publish is reachable from VersionHistoryPage instead, see
// US-10.4-FE's departure note), so it always renders as upcoming.
const DISPLAY_STEPS = [
  "identity",
  "behavioral",
  "eligibility",
  "orchestration",
  "review",
] as const

type Props = {
  currentStep: ProductTemplateWizardStep
}

function WizardStepper({ currentStep }: Props) {
  const { t } = useTranslation("productTemplates")

  const currentIndex = DISPLAY_STEPS.indexOf(currentStep)

  return (
    <div
      className="flex items-center gap-4 border-b border-border bg-background px-6 py-4"
      data-testid="wizard-stepper"
    >
      {DISPLAY_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const isLast = index === DISPLAY_STEPS.length - 1

        return (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3 min-w-0",
              isLast ? "shrink-0 w-[200px]" : "flex-1 min-w-px"
            )}
          >
            <div
              data-testid={`step-indicator-${step}`}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-sm",
                isCompleted &&
                  "bg-primary/10 border border-primary text-primary",
                isActive && "bg-primary text-primary-foreground",
                !isCompleted &&
                  !isActive &&
                  "border border-border bg-background text-muted-foreground"
              )}
            >
              {isCompleted ? <CheckIcon size={14} /> : <span>{index + 1}</span>}
            </div>

            <div className="flex flex-col gap-1 shrink-0 whitespace-nowrap">
              <p className="text-sm font-semibold leading-5 text-foreground">
                {t(`wizard.steps.${step}`)}
              </p>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5",
                  isCompleted ? "bg-primary" : "bg-slate-300"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export { WizardStepper }
