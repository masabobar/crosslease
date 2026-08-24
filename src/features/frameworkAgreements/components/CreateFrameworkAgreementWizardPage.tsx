import { useRef, useState } from "react"
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
import { PATHS, frameworkAgreementDetail } from "@/router/paths"
import { useCreateFrameworkAgreementDraft } from "@/features/frameworkAgreements/hooks/useCreateFrameworkAgreementDraft"
import { useAttachFrameworkAgreementDocument } from "@/features/frameworkAgreements/hooks/useAttachFrameworkAgreementDocument"
import { useDeleteFrameworkAgreementDraft } from "@/features/frameworkAgreements/hooks/useDeleteFrameworkAgreementDraft"
import {
  BankEntitySchema,
  FADocumentTypeSchema,
  FrameworkAgreementWizardFormSchema,
} from "@/features/frameworkAgreements/api/schema"
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
import { showApiError } from "@/lib/apiErrorMessage"

const ORDERED_STEPS: readonly FrameworkAgreementWizardStep[] =
  FRAMEWORK_AGREEMENT_WIZARD_STEPS

const STEP_FIELDS: Record<
  FrameworkAgreementWizardStep,
  (keyof FrameworkAgreementWizardForm)[]
> = {
  identity: ["agreement_name", "lc_partner_id"],
  envelopePricing: ["max_volume_eur", "vfe_amount_eur"],
  validityTemplates: ["valid_from", "valid_until", "product_template_ids"],
  conditions: ["special_conditions"],
  documents: [],
  review: [],
}

export default function CreateFrameworkAgreementWizardPage() {
  const { t } = useTranslation("frameworkAgreements")
  const navigate = useNavigate()

  const [step, setStep] = useState<FrameworkAgreementWizardStep>("identity")
  // Steps the user has actually opened. "Save as draft" has to validate the whole
  // form (CreateFARequest takes every field in one POST — there is no partial
  // draft), but flagging fields on steps nobody has reached yet reads as premature
  // validation (PRD1042-1653), so those errors are dropped before they render.
  const [visitedSteps, setVisitedSteps] = useState<
    ReadonlySet<FrameworkAgreementWizardStep>
  >(new Set(["identity"]))
  const [documents, setDocuments] = useState<FrameworkAgreementDocumentDraft[]>(
    []
  )
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)
  const [createdAgreement, setCreatedAgreement] = useState<{
    id: string
    agreementName: string
  } | null>(null)
  // Holds the id of a draft that was already persisted on the backend, so a retry
  // after a failed document upload reuses it instead of creating a second orphan.
  const persistedDraftIdRef = useRef<string | null>(null)

  const createDraftMutation = useCreateFrameworkAgreementDraft()
  const attachDocumentMutation = useAttachFrameworkAgreementDocument()
  const deleteDraftMutation = useDeleteFrameworkAgreementDraft()
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
      bank_entity: BankEntitySchema.enum.other,
      product_template_ids: [],
      special_conditions: "",
      valid_from: "",
      valid_until: "",
    },
  })

  const currentIndex = ORDERED_STEPS.indexOf(step)
  const isFirstStep = currentIndex === 0
  const isReviewStep = step === "review"

  function goToStep(next: FrameworkAgreementWizardStep) {
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
    setDiscardDialogOpen(true)
  }

  async function handleConfirmDiscard() {
    setDiscardDialogOpen(false)
    // "Save as draft" persists the agreement, so a later discard has to delete it — closing
    // the wizard alone left an orphaned draft in the tenant's list. Navigation happens
    // either way: the user asked to leave, and a failed delete is reported, not swallowed.
    const draftId = persistedDraftIdRef.current
    if (draftId) {
      try {
        await deleteDraftMutation.mutateAsync(draftId)
      } catch (err) {
        showApiError(err, t)
      }
    }
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
      const unvisitedFields = ORDERED_STEPS.filter(
        s => !visitedSteps.has(s)
      ).flatMap(s => STEP_FIELDS[s])
      if (unvisitedFields.length > 0) form.clearErrors(unvisitedFields)

      // Only jump to a step the user has already seen — the toast covers the rest,
      // and those steps surface their own errors when the user reaches them.
      const invalidStep = firstStepWithFieldError()
      if (invalidStep) goToStep(invalidStep)
      toast.error(t("wizard.incompleteDraft"))
      return
    }

    const values = form.getValues()

    let draftId = persistedDraftIdRef.current
    if (!draftId) {
      try {
        const draft = await createDraftMutation.mutateAsync({
          agreement_name: values.agreement_name,
          lc_partner_id: values.lc_partner_id,
          bank_entity: values.bank_entity,
          max_volume_eur: values.max_volume_eur,
          vfe_amount_eur: values.vfe_amount_eur,
          valid_from: values.valid_from,
          valid_until: values.valid_until || undefined,
          special_conditions: values.special_conditions || undefined,
          product_template_ids: values.product_template_ids,
        })
        draftId = draft.id
        persistedDraftIdRef.current = draft.id
      } catch (err) {
        showApiError(err, t)
        return
      }
    }

    // The draft exists from here on. A document failure must not discard it —
    // report the partial outcome and let the user attach the rest from the
    // detail page, rather than leaving an orphan behind and creating another.
    const failedDocuments: string[] = []
    for (const doc of documents) {
      try {
        await attachDocumentMutation.mutateAsync({
          faId: draftId,
          file: doc.file,
          documentType: doc.documentType || FADocumentTypeSchema.enum.other,
          documentLabel: doc.documentLabel || undefined,
        })
      } catch {
        failedDocuments.push(doc.documentLabel || doc.file.name)
      }
    }

    if (failedDocuments.length > 0) {
      toast.error(
        t("wizard.documentsPartiallyAttached", {
          count: failedDocuments.length,
          names: failedDocuments.join(", "),
        })
      )
    }

    setCreatedAgreement({
      id: draftId,
      agreementName: values.agreement_name,
    })
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
          {step === "conditions" && (
            <ConditionsStep
              register={form.register}
              errors={form.formState.errors}
              testIdPrefix="fa-"
            />
          )}
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
