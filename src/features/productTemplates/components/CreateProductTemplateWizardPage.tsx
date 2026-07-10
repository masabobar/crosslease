import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowRight, ArrowLeft } from "lucide-react"
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
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { ProductTemplateWizardFormSchema } from "@/features/productTemplates/api/schema"
import type {
  CreateProductTemplateDraftRequest,
  ProductTemplateWizardForm,
  UpdateProductTemplateDraftRequest,
} from "@/features/productTemplates/api/schema"
import type { ProductTemplateWizardStep } from "@/features/productTemplates/types"
import { WizardStepper } from "@/features/productTemplates/components/WizardStepper"
import { IdentityStep } from "@/features/productTemplates/components/steps/IdentityStep"
import { BehavioralSettingsStep } from "@/features/productTemplates/components/steps/BehavioralSettingsStep"
import { EligibilityStep } from "@/features/productTemplates/components/steps/EligibilityStep"
import { useCreateProductTemplateDraft } from "@/features/productTemplates/hooks/useCreateProductTemplateDraft"
import { useUpdateProductTemplateDraft } from "@/features/productTemplates/hooks/useUpdateProductTemplateDraft"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"

const ORDERED_STEPS: ProductTemplateWizardStep[] = [
  "identity",
  "behavioral",
  "eligibility",
]

const STEP_FIELDS: Record<
  ProductTemplateWizardStep,
  (keyof ProductTemplateWizardForm)[]
> = {
  identity: ["template_code", "template_name"],
  behavioral: [
    "financing_type",
    "legal_structure",
    "payment_timing",
    "rate_basis",
    "calculation_model",
    "rate_type",
    "first_installment_rule",
    "disbursement_derivation_rule",
    "npv_formula_ref",
  ],
  eligibility: [
    "allowed_asset_categories",
    "min_term_months",
    "max_term_months",
    "max_ltv_ratio",
    "valid_from",
  ],
}

// Builds the update-shaped wire payload from form values (template_code is immutable
// after creation, so it's never part of an update body), omitting an empty valid_until.
function toUpdatePayload(
  values: ProductTemplateWizardForm
): UpdateProductTemplateDraftRequest {
  return {
    template_name: values.template_name,
    template_description: values.template_description,
    financing_type: values.financing_type,
    legal_structure: values.legal_structure,
    payment_timing: values.payment_timing,
    rate_basis: values.rate_basis,
    calculation_model: values.calculation_model,
    rate_type: values.rate_type,
    npv_formula_ref: values.npv_formula_ref,
    first_installment_rule: values.first_installment_rule,
    disbursement_derivation_rule: values.disbursement_derivation_rule,
    allowed_asset_categories: values.allowed_asset_categories,
    min_term_months: values.min_term_months,
    max_term_months: values.max_term_months,
    max_ltv_ratio: values.max_ltv_ratio,
    min_volume_eur: values.min_volume_eur,
    max_volume_eur: values.max_volume_eur,
    valid_from: values.valid_from,
    valid_until: values.valid_until || undefined,
  }
}

type DraftRef = { templateId: string; versionNumber: string }

export default function CreateProductTemplateWizardPage() {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()

  const [step, setStep] = useState<ProductTemplateWizardStep>("identity")
  const [draftRef, setDraftRef] = useState<DraftRef | null>(null)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? null

  const { mutateAsync: createDraft, isPending: isCreating } =
    useCreateProductTemplateDraft()
  const { mutateAsync: updateDraft, isPending: isUpdating } =
    useUpdateProductTemplateDraft()
  const { mutateAsync: discardDraft, isPending: isDiscarding } =
    useDiscardProductTemplateDraft()

  const form = useForm<ProductTemplateWizardForm>({
    resolver: zodResolver(ProductTemplateWizardFormSchema),
    defaultValues: {
      template_code: "",
      template_name: "",
      template_description: "",
      allowed_asset_categories: [],
    },
  })

  const isSaving = isCreating || isUpdating

  const [
    watchedCode,
    watchedName,
    watchedFinancingType,
    watchedLegalStructure,
    watchedPaymentTiming,
    watchedRateBasis,
    watchedCalculationModel,
  ] = useWatch({
    control: form.control,
    name: [
      "template_code",
      "template_name",
      "financing_type",
      "legal_structure",
      "payment_timing",
      "rate_basis",
      "calculation_model",
    ],
  })

  // Gap 2 (see plan): the create endpoint hard-requires these 7 fields even though the
  // PRD narrative says draft creation needs only code + name. Save-as-draft only becomes
  // clickable once all 7 are present, not the full per-step form validity.
  const canSaveDraft = Boolean(
    watchedCode &&
    watchedName &&
    watchedFinancingType &&
    watchedLegalStructure &&
    watchedPaymentTiming &&
    watchedRateBasis &&
    watchedCalculationModel
  )

  const currentIndex = ORDERED_STEPS.indexOf(step)
  const isFirstStep = currentIndex === 0
  const isLastBuiltStep = step === "eligibility"

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    const valid = await form.trigger(fields)
    if (!valid) return
    setStep(ORDERED_STEPS[currentIndex + 1])
  }

  function handleBack() {
    if (isFirstStep) return
    setStep(ORDERED_STEPS[currentIndex - 1])
  }

  async function handleSaveDraft() {
    const values = form.getValues()
    const updatePayload = toUpdatePayload(values)

    try {
      if (!draftRef) {
        if (!tenantId) return
        // canSaveDraft (gating the button that calls this) guarantees the 7 wire-required
        // fields are present, which TS can't infer from the looser wizard-form type.
        const result = await createDraft({
          tenantId,
          body: {
            template_code: values.template_code,
            ...updatePayload,
          } as CreateProductTemplateDraftRequest,
        })
        setDraftRef({
          templateId: result.id,
          versionNumber: result.version_number,
        })
      } else {
        await updateDraft({
          templateId: draftRef.templateId,
          versionNumber: draftRef.versionNumber,
          body: updatePayload,
        })
      }
      toast.success(t("wizard.draftSaved"))
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

  async function handleConfirmDiscard() {
    if (!draftRef) return
    try {
      await discardDraft(draftRef)
      setDiscardDialogOpen(false)
      navigate(-1)
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

  function handleCancel() {
    if (draftRef) {
      setDiscardDialogOpen(true)
      return
    }
    navigate(-1)
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
          {step === "behavioral" && <BehavioralSettingsStep form={form} />}
          {step === "eligibility" && <EligibilityStep form={form} />}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          data-testid="wizard-cancel-button"
          onClick={handleCancel}
          disabled={isSaving || isDiscarding}
        >
          {t("wizard.actions.cancel")}
        </Button>

        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              data-testid="wizard-back-button"
              onClick={handleBack}
              disabled={isSaving}
            >
              <ArrowLeft size={16} />
              {t("wizard.actions.back")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            data-testid="wizard-save-draft-button"
            onClick={handleSaveDraft}
            disabled={isSaving || !canSaveDraft}
          >
            {t("wizard.actions.saveDraft")}
          </Button>
          {!isLastBuiltStep && (
            <Button
              type="button"
              data-testid="wizard-next-button"
              onClick={handleNext}
              disabled={isSaving}
            >
              {t("wizard.actions.next")}
              <ArrowRight size={16} />
            </Button>
          )}
          {isLastBuiltStep && (
            <Button
              type="button"
              data-testid="wizard-next-button"
              disabled
              title={t("wizard.orchestrationComingSoon")}
            >
              {t("wizard.actions.next")}
              <ArrowRight size={16} />
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
            <AlertDialogCancel data-testid="discard-dialog-keep">
              {t("wizard.discardDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="discard-dialog-confirm"
              onClick={handleConfirmDiscard}
              disabled={isDiscarding}
            >
              {t("wizard.discardDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
