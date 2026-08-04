import { useState } from "react"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { isUuidRouteParam } from "@/lib/routeParams"
import { frameworkAgreementDetail } from "@/router/paths"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { useFrameworkAgreementDetail } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementDetail"
import { useUpdateFrameworkAgreement } from "@/features/frameworkAgreements/hooks/useUpdateFrameworkAgreement"
import {
  EditFrameworkAgreementFormSchema,
  FALifecycleStatusSchema,
} from "@/features/frameworkAgreements/api/schema"
import type {
  EditFrameworkAgreementFormValues,
  FADetailResponse,
} from "@/features/frameworkAgreements/api/schema"
import {
  buildUpdateFAPayload,
  isFrameworkAgreementDraft,
  toEditFormDefaults,
} from "@/features/frameworkAgreements/editWizard"
import {
  isFrameworkAgreementNotFoundError,
  useResolveFrameworkAgreementFieldError,
} from "@/features/frameworkAgreements/utils"
import { FRAMEWORK_AGREEMENT_EDIT_STEPS } from "@/features/frameworkAgreements/types"
import type { FrameworkAgreementEditStep } from "@/features/frameworkAgreements/types"
import { WizardStepper } from "@/features/frameworkAgreements/components/WizardStepper"
import { EditIdentityStep } from "@/features/frameworkAgreements/components/steps/EditIdentityStep"
import { EnvelopePricingFields } from "@/features/frameworkAgreements/components/steps/EnvelopePricingFields"
import { ConditionsStep } from "@/features/frameworkAgreements/components/steps/ConditionsStep"
import { EditValidityTemplatesStep } from "@/features/frameworkAgreements/components/steps/EditValidityTemplatesStep"
import { EditReviewStep } from "@/features/frameworkAgreements/components/steps/EditReviewStep"

const ORDERED_STEPS: readonly FrameworkAgreementEditStep[] =
  FRAMEWORK_AGREEMENT_EDIT_STEPS

const STEP_FIELDS: Record<
  FrameworkAgreementEditStep,
  (keyof EditFrameworkAgreementFormValues)[]
> = {
  identity: ["agreement_name", "valid_from"],
  envelopePricing: ["max_volume_eur", "vfe_amount_eur"],
  validityTemplates: ["valid_until", "product_template_ids"],
  conditions: ["special_conditions"],
  review: ["justification"],
}

function EditWizardForm({
  frameworkAgreement,
}: {
  frameworkAgreement: FADetailResponse
}) {
  const { t } = useTranslation("frameworkAgreements")
  const navigate = useNavigate()
  const mutation = useUpdateFrameworkAgreement()
  const resolveMsg = useResolveFrameworkAgreementFieldError()

  const [step, setStep] = useState<FrameworkAgreementEditStep>("identity")
  // Same reason as the create wizard: Save validates the whole form in one pass (the PATCH
  // is a single terminal save), but flagging fields on steps nobody has opened yet reads
  // as premature validation, so those errors are dropped before they render.
  const [visitedSteps, setVisitedSteps] = useState<
    ReadonlySet<FrameworkAgreementEditStep>
  >(new Set(["identity"]))
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  const form = useForm<EditFrameworkAgreementFormValues>({
    resolver: zodResolver(EditFrameworkAgreementFormSchema),
    defaultValues: toEditFormDefaults(frameworkAgreement),
  })
  // useFormState rather than a destructured form.formState: the steps below receive
  // `errors` as a prop and do not subscribe themselves, and this is the subscription
  // pattern every other FA step uses.
  const { register, control } = form
  const { errors, isDirty } = useFormState({ control })

  const isDraft = isFrameworkAgreementDraft(frameworkAgreement)
  const detailPath = frameworkAgreementDetail(frameworkAgreement.id)
  const currentIndex = ORDERED_STEPS.indexOf(step)
  const isFirstStep = currentIndex === 0
  const isReviewStep = step === "review"

  function goToStep(next: FrameworkAgreementEditStep) {
    setStep(next)
    setVisitedSteps(previous => new Set(previous).add(next))
  }

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    const valid = fields.length === 0 || (await form.trigger(fields))
    if (!valid) return
    goToStep(ORDERED_STEPS[currentIndex + 1])
  }

  function handleBack() {
    if (isFirstStep) return
    goToStep(ORDERED_STEPS[currentIndex - 1])
  }

  function handleCancel() {
    // Nothing typed yet — no reason to ask before leaving.
    if (!isDirty) {
      navigate(detailPath)
      return
    }
    setDiscardDialogOpen(true)
  }

  function firstStepWithFieldError(): FrameworkAgreementEditStep | null {
    const erroredFields = new Set(Object.keys(form.formState.errors))
    return (
      ORDERED_STEPS.find(s => STEP_FIELDS[s].some(f => erroredFields.has(f))) ??
      null
    )
  }

  async function handleSave() {
    const formValid = await form.trigger()

    if (!formValid) {
      const unvisitedFields = ORDERED_STEPS.filter(
        s => !visitedSteps.has(s)
      ).flatMap(s => STEP_FIELDS[s])
      if (unvisitedFields.length > 0) form.clearErrors(unvisitedFields)

      const invalidStep = firstStepWithFieldError()
      if (invalidStep) goToStep(invalidStep)
      toast.error(t("edit.incompleteForm"))
      return
    }

    mutation.mutate(
      {
        id: frameworkAgreement.id,
        body: buildUpdateFAPayload(form.getValues(), isDraft),
      },
      {
        onSuccess: () => {
          toast.success(t("edit.saved"))
          navigate(detailPath)
        },
        onError: err => {
          if (
            applyApiFieldErrors({
              error: err,
              fields: Object.keys(form.getValues()),
              setError: form.setError,
            })
          )
            return

          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <WizardStepper currentStep={step} steps={ORDERED_STEPS} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[640px] mx-auto w-full">
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground">
              {t("edit.title", { name: frameworkAgreement.agreement_name })}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">
              {t(`wizard.${step}.title`)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {/* The create wizard's review subtitle promises the agreement will be
                  saved as Draft, which is untrue when editing an active one. */}
              {isReviewStep
                ? t("edit.reviewSubtitle")
                : t(`wizard.${step}.subtitle`)}
            </p>
          </div>

          {step === "identity" && (
            <EditIdentityStep
              form={form}
              frameworkAgreement={frameworkAgreement}
            />
          )}
          {step === "envelopePricing" && (
            <div
              className="flex flex-col gap-4"
              data-testid="edit-fa-pricing-step"
            >
              <EnvelopePricingFields
                register={register}
                errors={errors}
                resolveMsg={resolveMsg}
                idPrefix="edit_"
                testIdPrefix="edit-"
              />
            </div>
          )}
          {step === "validityTemplates" && (
            <EditValidityTemplatesStep
              form={form}
              frameworkAgreement={frameworkAgreement}
            />
          )}
          {step === "conditions" && (
            <ConditionsStep
              register={register}
              errors={errors}
              idPrefix="edit_"
              testIdPrefix="edit-"
            />
          )}
          {step === "review" && (
            <EditReviewStep
              form={form}
              frameworkAgreement={frameworkAgreement}
            />
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="edit-fa-wizard-cancel-button"
          onClick={handleCancel}
          disabled={mutation.isPending}
        >
          {t("wizard.actions.cancel")}
        </Button>

        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              data-testid="edit-fa-wizard-back-button"
              onClick={handleBack}
              disabled={mutation.isPending}
            >
              <ArrowLeft size={16} />
              {t("wizard.actions.back")}
            </Button>
          )}
          {!isReviewStep && (
            <Button
              type="button"
              data-testid="edit-fa-wizard-next-button"
              onClick={handleNext}
              disabled={mutation.isPending}
            >
              {t("wizard.actions.next")}
              <ArrowRight size={16} />
            </Button>
          )}
          {isReviewStep && (
            <Button
              type="button"
              data-testid="edit-fa-wizard-save-button"
              onClick={handleSave}
              disabled={mutation.isPending}
            >
              {t("edit.confirmButton")}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("edit.discardDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("edit.discardDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="edit-fa-discard-dialog-keep">
              {t("edit.discardDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="edit-fa-discard-dialog-confirm"
              onClick={() => navigate(detailPath)}
            >
              {t("edit.discardDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function EditFrameworkAgreementWizardPage() {
  const { t } = useTranslation("frameworkAgreements")
  const { id } = useParams<{ id: string }>()
  const agreementId = isUuidRouteParam(id) ? id : undefined
  const { data, isLoading, isError, error } = useFrameworkAgreementDetail(
    agreementId ?? ""
  )

  if (agreementId === undefined || isFrameworkAgreementNotFoundError(error)) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("edit.loading")}</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center"
        data-testid="edit-fa-load-error"
      >
        <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
      </div>
    )
  }

  // The detail page hides Edit for terminated agreements, but a deep link must not open a
  // form the BE will reject with FA_NOT_EDITABLE.
  if (data.status === FALifecycleStatusSchema.enum.terminated) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center gap-3"
        data-testid="edit-fa-not-editable"
      >
        <p className="text-sm text-muted-foreground">
          {t("errors.FA_NOT_EDITABLE")}
        </p>
        <Link
          to={frameworkAgreementDetail(data.id)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("edit.backToAgreement")}
        </Link>
      </div>
    )
  }

  // Mount once per agreement: the form snapshots defaultValues (including
  // expected_version) and must not be re-seeded by a background refetch.
  return <EditWizardForm key={data.id} frameworkAgreement={data} />
}
