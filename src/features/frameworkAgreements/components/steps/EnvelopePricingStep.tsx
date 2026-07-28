import type { UseFormReturn } from "react-hook-form"
import { useFormState } from "react-hook-form"
import { EnvelopePricingFields } from "@/features/frameworkAgreements/components/steps/EnvelopePricingFields"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"

type Props = {
  form: UseFormReturn<FrameworkAgreementWizardForm>
}

function EnvelopePricingStep({ form }: Props) {
  const { register, control } = form
  const { errors } = useFormState({ control })
  const resolveMsg = useResolveFrameworkAgreementFieldError()

  return (
    <div className="flex flex-col gap-4" data-testid="fa-envelope-pricing-step">
      <EnvelopePricingFields
        register={register}
        errors={errors}
        resolveMsg={resolveMsg}
      />
    </div>
  )
}

export { EnvelopePricingStep }
