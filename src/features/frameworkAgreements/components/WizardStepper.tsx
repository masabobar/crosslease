import { useTranslation } from "react-i18next"
import { WizardStepper as SharedWizardStepper } from "@/components/WizardStepper"
import { FRAMEWORK_AGREEMENT_WIZARD_STEPS } from "@/features/frameworkAgreements/types"
import type { FrameworkAgreementWizardStep } from "@/features/frameworkAgreements/types"

type Props = {
  currentStep: FrameworkAgreementWizardStep
}

function WizardStepper({ currentStep }: Props) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    <SharedWizardStepper
      testIdPrefix="fa-"
      currentStepKey={currentStep}
      steps={FRAMEWORK_AGREEMENT_WIZARD_STEPS.map(step => ({
        key: step,
        label: t(`wizard.steps.${step}`),
      }))}
    />
  )
}

export { WizardStepper }
