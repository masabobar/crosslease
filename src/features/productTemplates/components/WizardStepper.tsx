import { useTranslation } from "react-i18next"
import { WizardStepper as SharedWizardStepper } from "@/components/shared/WizardStepper"
import type { ProductTemplateWizardStep } from "@/features/productTemplates/types"

const DISPLAY_STEPS = [
  "identity",
  "behavioral",
  "eligibility",
  "review",
] as const

type Props = {
  currentStep: ProductTemplateWizardStep
}

function WizardStepper({ currentStep }: Props) {
  const { t } = useTranslation("productTemplates")

  return (
    <SharedWizardStepper
      currentStepKey={currentStep}
      steps={DISPLAY_STEPS.map(step => ({
        key: step,
        label: t(`wizard.steps.${step}`),
      }))}
    />
  )
}

export { WizardStepper }
