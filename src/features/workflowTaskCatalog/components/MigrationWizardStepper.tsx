import { useTranslation } from "react-i18next"
import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MigrationWizardStep } from "@/features/workflowTaskCatalog/types"

const ORDERED_STEPS: MigrationWizardStep[] = ["dryRun", "approval", "execution"]

type Props = {
  currentStep: MigrationWizardStep
  onStepChange: (step: MigrationWizardStep) => void
}

// Unlike the shared @/components/shared/WizardStepper (a pure progress indicator, no
// click handling), this stepper's nodes are clickable — there is no live session linking
// the initiator and the second approver in this static shell, so letting reviewers jump
// directly to the Approval / Execution steps is the only way to preview them. See
// WorkflowTaskCatalogMigrationWizardPage for how step transitions also happen via the
// primary actions within each step (Submit for approval / Approve / etc.).
function MigrationWizardStepper({ currentStep, onStepChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const currentIndex = ORDERED_STEPS.indexOf(currentStep)

  return (
    <div
      className="flex items-center gap-4 border-b border-border bg-background px-6 py-4"
      data-testid="migration-wizard-stepper"
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
              isLast ? "shrink-0" : "flex-1 min-w-px"
            )}
          >
            <button
              type="button"
              data-testid={`migration-step-${step}`}
              onClick={() => onStepChange(step)}
              className="flex items-center gap-3 shrink-0 whitespace-nowrap"
            >
              <span
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
                {isCompleted ? (
                  <CheckIcon size={14} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold leading-5",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(`migration.steps.${step}`)}
              </span>
            </button>

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

export { MigrationWizardStepper }
