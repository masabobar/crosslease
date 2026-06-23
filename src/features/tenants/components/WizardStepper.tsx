import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

type WizardStep = "identity" | "modules" | "seed" | "integration" | "review"

const ORDERED_STEPS: WizardStep[] = [
  "identity",
  "modules",
  "seed",
  "integration",
  "review",
]

type Props = {
  currentStep: WizardStep
}

function WizardStepper({ currentStep }: Props) {
  const { t } = useTranslation("tenants")

  const currentIndex = ORDERED_STEPS.indexOf(currentStep)

  return (
    <div
      className="flex items-center gap-4 border-b border-border bg-background px-6 py-4"
      data-testid="wizard-stepper"
    >
      {ORDERED_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const isLast = index === ORDERED_STEPS.length - 1

        return (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3 min-w-0",
              isLast ? "shrink-0 w-[200px]" : "flex-1 min-w-px"
            )}
          >
            {/* Circle indicator */}
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

            {/* Step label: name + description */}
            <div className="flex flex-col gap-1 shrink-0 whitespace-nowrap">
              <p className="text-sm font-semibold leading-5 text-foreground">
                {t(`wizard.steps.${step}`)}
              </p>
              <p className="text-xs text-muted-foreground leading-4">
                {t(`wizard.stepDescriptions.${step}`)}
              </p>
            </div>

            {/* Connector line fills remaining width; blue after completed steps */}
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
export type { WizardStep }
