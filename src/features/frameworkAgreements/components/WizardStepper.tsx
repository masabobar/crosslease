import { useTranslation } from "react-i18next"
import { WizardStepper as SharedWizardStepper } from "@/components/shared/WizardStepper"
import { FRAMEWORK_AGREEMENT_WIZARD_STEPS } from "@/features/frameworkAgreements/types"
import type { FrameworkAgreementWizardStep } from "@/features/frameworkAgreements/types"

type Props = {
  currentStep: FrameworkAgreementWizardStep
  // The edit wizard shows the same steps minus "documents" (see FRAMEWORK_AGREEMENT_EDIT_STEPS).
  steps?: readonly FrameworkAgreementWizardStep[]
}

function WizardStepper({
  currentStep,
  steps = FRAMEWORK_AGREEMENT_WIZARD_STEPS,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    <SharedWizardStepper
      testIdPrefix="fa-"
      currentStepKey={currentStep}
      steps={steps.map(step => ({
        key: step,
        label: t(`wizard.steps.${step}`),
      }))}
    />
  )
}

export { WizardStepper }
