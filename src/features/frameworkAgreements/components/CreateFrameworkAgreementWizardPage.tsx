import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
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
import { PATHS, frameworkAgreementDetail } from "@/router/paths"
import { useCreateFrameworkAgreementDraft } from "@/features/frameworkAgreements/hooks/useCreateFrameworkAgreementDraft"
import { useAttachFrameworkAgreementDocument } from "@/features/frameworkAgreements/hooks/useAttachFrameworkAgreementDocument"
import { FrameworkAgreementWizardFormSchema } from "@/features/frameworkAgreements/api/schema"
import type { FrameworkAgreementWizardForm } from "@/features/frameworkAgreements/api/schema"
import { FRAMEWORK_AGREEMENT_WIZARD_STEPS } from "@/features/frameworkAgreements/types"
import type {
  FrameworkAgreementDocumentDraft,
  FrameworkAgreementWizardStep,
} from "@/features/frameworkAgreements/types"
import { WizardStepper } from "@/features/frameworkAgreements/components/WizardStepper"
import { IdentityStep } from "@/features/frameworkAgreements/components/steps/IdentityStep"
import { EnvelopePricingStep } from "@/features/frameworkAgreements/components/steps/EnvelopePricingStep"
import { ValidityTemplatesStep } from "@/features/frameworkAgreements/components/steps/ValidityTemplatesStep"
import { ConditionsStep } from "@/features/frameworkAgreements/components/steps/ConditionsStep"
import { DocumentsStep } from "@/features/frameworkAgreements/components/steps/DocumentsStep"
import { ReviewStep } from "@/features/frameworkAgreements/components/steps/ReviewStep"

const ORDERED_STEPS: readonly FrameworkAgreementWizardStep[] =
  FRAMEWORK_AGREEMENT_WIZARD_STEPS

const STEP_FIELDS: Record<
  FrameworkAgreementWizardStep,
  (keyof FrameworkAgreementWizardForm)[]
> = {
  identity: ["agreement_name", "lc_partner_id"],
  envelopePricing: [
    "max_volume_eur",
    "base_rate",
    "spread",
    "rate_type",
    "effective_rate",
    "rate_lock_period_months",
  ],
  validityTemplates: ["valid_from", "valid_until", "product_template_ids"],
  conditions: ["special_conditions"],
  documents: [],
  review: [],
}

export default function CreateFrameworkAgreementWizardPage() {
  const { t } = useTranslation("frameworkAgreements")
  const navigate = useNavigate()

  const [step, setStep] = useState<FrameworkAgreementWizardStep>("identity")
  const [documents, setDocuments] = useState<FrameworkAgreementDocumentDraft[]>(
    []
  )
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [createdAgreement, setCreatedAgreement] = useState<{
    id: string
    agreementName: string
  } | null>(null)

  const createDraftMutation = useCreateFrameworkAgreementDraft()
  const attachDocumentMutation = useAttachFrameworkAgreementDocument()
  const isSaving =
    createDraftMutation.isPending || attachDocumentMutation.isPending

  const form = useForm<FrameworkAgreementWizardForm>({
    resolver: zodResolver(FrameworkAgreementWizardFormSchema),
    defaultValues: {
      agreement_name: "",
      lc_partner_id: "",
      lc_partner_name: "",
      // Bank entity is hidden from the UI per PRD1042-1495 (A4) — only relevant for
      // syndication, out of MVP scope. Defaults to "other" like the BE column default.
      bank_entity: "other",
      rate_type: "fixed",
      product_template_ids: [],
      special_conditions: "",
      valid_from: "",
      valid_until: "",
    },
  })

  const currentIndex = ORDERED_STEPS.indexOf(step)
  const isFirstStep = currentIndex === 0
  const isReviewStep = step === "review"

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    const valid = fields.length === 0 || (await form.trigger(fields))
    if (!valid) return
    setStep(ORDERED_STEPS[currentIndex + 1])
  }

  function handleBack() {
    if (isFirstStep) return
    setStep(ORDERED_STEPS[currentIndex - 1])
  }

  function handleCancel() {
    setDiscardDialogOpen(true)
  }

  function handleConfirmDiscard() {
    setDiscardDialogOpen(false)
    navigate(-1)
  }

  function firstStepWithFieldError(): FrameworkAgreementWizardStep | null {
    const erroredFields = new Set(Object.keys(form.formState.errors))
    return (
      ORDERED_STEPS.find(s => STEP_FIELDS[s].some(f => erroredFields.has(f))) ??
      null
    )
  }

  async function handleSave() {
    const formValid = await form.trigger()

    if (!formValid) {
      const invalidStep = firstStepWithFieldError()
      if (invalidStep) setStep(invalidStep)
      toast.error(t("wizard.incompleteDraft"))
      return
    }

    try {
      const values = form.getValues()
      const draft = await createDraftMutation.mutateAsync({
        agreement_name: values.agreement_name,
        lc_partner_id: values.lc_partner_id,
        bank_entity: values.bank_entity,
        max_volume_eur: values.max_volume_eur,
        base_rate: values.base_rate,
        spread: values.spread,
        rate_type: values.rate_type,
        effective_rate: values.effective_rate,
        rate_lock_period_months: values.rate_lock_period_months,
        lg_coverage_rate_override: values.lg_coverage_rate_override,
        valid_from: values.valid_from,
        valid_until: values.valid_until || undefined,
        special_conditions: values.special_conditions || undefined,
        product_template_ids: values.product_template_ids,
      })

      for (const doc of documents) {
        await attachDocumentMutation.mutateAsync({
          faId: draft.id,
          file: doc.file,
          documentType: doc.documentType || "other",
          documentLabel: doc.documentLabel || undefined,
        })
      }

      setCreatedAgreement({
        id: draft.id,
        agreementName: values.agreement_name,
      })
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? t(`errors.${err.code}` as "errors.generic", {
              defaultValue: t("errors.generic"),
            })
          : t("errors.generic")
      )
    }
  }

  if (createdAgreement) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-slate-50">
        <div
          className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 items-center"
          data-testid="fa-created-success"
        >
          <div className="flex flex-col items-center gap-3 w-full">
            <div className="bg-success/10 p-3 rounded-[14px]">
              <Check size={24} className="text-success" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-3 text-center w-full">
              <h1 className="text-xl font-semibold text-foreground">
                {t("wizard.createdSuccess.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("wizard.createdSuccess.subtitle", {
                  name: createdAgreement.agreementName,
                })}
              </p>
            </div>
          </div>
          <div className="flex w-full gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              data-testid="back-to-agreements-button"
              onClick={() => navigate(PATHS.FRAMEWORK_AGREEMENT_LIST)}
            >
              {t("wizard.createdSuccess.backToAgreements")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              data-testid="view-created-agreement-button"
              onClick={() =>
                navigate(frameworkAgreementDetail(createdAgreement.id))
              }
            >
              <ArrowRight size={16} />
              {t("wizard.createdSuccess.viewAgreement")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <WizardStepper currentStep={step} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-[640px] mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              {t(`wizard.${step}.title`)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`wizard.${step}.subtitle`)}
            </p>
          </div>

          {step === "identity" && <IdentityStep form={form} />}
          {step === "envelopePricing" && <EnvelopePricingStep form={form} />}
          {step === "validityTemplates" && (
            <ValidityTemplatesStep form={form} />
          )}
          {step === "conditions" && <ConditionsStep form={form} />}
          {step === "documents" && (
            <DocumentsStep
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          )}
          {step === "review" && (
            <ReviewStep form={form} documents={documents} />
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="fa-wizard-cancel-button"
          onClick={handleCancel}
          disabled={isSaving}
        >
          {t("wizard.actions.cancel")}
        </Button>

        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              data-testid="fa-wizard-back-button"
              onClick={handleBack}
              disabled={isSaving}
            >
              <ArrowLeft size={16} />
              {t("wizard.actions.back")}
            </Button>
          )}
          {!isReviewStep && (
            <Button
              type="button"
              variant="outline"
              data-testid="fa-wizard-save-draft-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {t("wizard.actions.create")}
            </Button>
          )}
          {!isReviewStep && (
            <Button
              type="button"
              data-testid="fa-wizard-next-button"
              onClick={handleNext}
              disabled={isSaving}
            >
              {t("wizard.actions.next")}
              <ArrowRight size={16} />
            </Button>
          )}
          {isReviewStep && (
            <Button
              type="button"
              data-testid="fa-wizard-create-button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {t("wizard.actions.create")}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("wizard.discardDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("wizard.discardDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="fa-discard-dialog-keep">
              {t("wizard.discardDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="fa-discard-dialog-confirm"
              onClick={handleConfirmDiscard}
            >
              {t("wizard.discardDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
