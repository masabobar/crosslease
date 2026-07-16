import { CheckIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { FrameworkAgreementWizardStep } from "@/features/frameworkAgreements/types"

const DISPLAY_STEPS = [
  "identity",
  "envelopePricing",
  "validityTemplates",
  "conditions",
  "documents",
  "review",
] as const

type Props = {
  currentStep: FrameworkAgreementWizardStep
}

function WizardStepper({ currentStep }: Props) {
  const { t } = useTranslation("frameworkAgreements")

  const currentIndex = DISPLAY_STEPS.indexOf(currentStep)

  return (
    <div
      className="flex items-center gap-4 border-b border-border bg-background px-6 py-4"
      data-testid="fa-wizard-stepper"
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
              data-testid={`fa-step-indicator-${step}`}
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
