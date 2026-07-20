import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type WizardStepperStep = {
  key: string
  label: string
  description?: string
}

type Props = {
  steps: WizardStepperStep[]
  currentStepKey: string
  testIdPrefix?: string
}

function WizardStepper({ steps, currentStepKey, testIdPrefix = "" }: Props) {
  const currentIndex = steps.findIndex(step => step.key === currentStepKey)

  return (
    <div
      className="flex items-center gap-4 border-b border-border bg-background px-6 py-4"
      data-testid={`${testIdPrefix}wizard-stepper`}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const isLast = index === steps.length - 1

        return (
          <div
            key={step.key}
            className={cn(
              "flex items-center gap-3 min-w-0",
              isLast ? "shrink-0 w-[200px]" : "flex-1 min-w-px"
            )}
          >
            <div
              data-testid={`${testIdPrefix}step-indicator-${step.key}`}
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
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground leading-4">
                  {step.description}
                </p>
              )}
            </div>

            {!isLast && (
              <div
                className={cn(
                  "flex-1 h-0.5",
                  isCompleted ? "bg-primary" : "bg-border"
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
export type { WizardStepperStep }
