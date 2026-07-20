import { useTranslation } from "react-i18next"
import { WizardStepper as SharedWizardStepper } from "@/components/shared/WizardStepper"

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

  return (
    <SharedWizardStepper
      currentStepKey={currentStep}
      steps={ORDERED_STEPS.map(step => ({
        key: step,
        label: t(`wizard.steps.${step}`),
        description: t(`wizard.stepDescriptions.${step}`),
      }))}
    />
  )
}

export { WizardStepper, ORDERED_STEPS }
export type { WizardStep }
