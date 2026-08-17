import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
import { isUuidRouteParam, isVersionNumberRouteParam } from "@/lib/routeParams"
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
import { PATHS, productTemplateVersionHistory } from "@/router/paths"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { SYSTEM_ADMIN_ROLE } from "@/features/users/types"
import { TenantScopeGate } from "@/components/shared/TenantScopeGate"
import { useTenantSelectionStore } from "@/store/tenantSelectionStore"
import {
  isProductTemplateNotFoundError,
  resolveApiErrorMessage,
  showApiError,
} from "@/features/productTemplates/utils"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import {
  DisbursementDerivationRuleSchema,
  FirstInstallmentRuleSchema,
  ProductTemplatePublishFormSchema,
  ProductTemplateWizardFormSchema,
  TemplateStatusSchema,
} from "@/features/productTemplates/api/schema"
import type {
  CreateProductTemplateDraftRequest,
  ProductTemplateWizardForm,
  TemplateVersionDetail,
  UpdateProductTemplateDraftRequest,
} from "@/features/productTemplates/api/schema"
import type {
  DraftRef,
  ProductTemplateWizardStep,
} from "@/features/productTemplates/types"
import { WIZARD_STEP_FIELDS } from "@/features/productTemplates/types"
import { WizardStepper } from "@/features/productTemplates/components/WizardStepper"
import { IdentityStep } from "@/features/productTemplates/components/steps/IdentityStep"
import { BehavioralSettingsStep } from "@/features/productTemplates/components/steps/BehavioralSettingsStep"
import { EligibilityStep } from "@/features/productTemplates/components/steps/EligibilityStep"
import { ReviewStep } from "@/features/productTemplates/components/steps/ReviewStep"
import { useCreateProductTemplateDraft } from "@/features/productTemplates/hooks/useCreateProductTemplateDraft"
import { useUpdateProductTemplateDraft } from "@/features/productTemplates/hooks/useUpdateProductTemplateDraft"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"
import { usePublishProductTemplate } from "@/features/productTemplates/hooks/usePublishProductTemplate"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"

const ORDERED_STEPS: ProductTemplateWizardStep[] = [
  "identity",
  "behavioral",
  "eligibility",
  "review",
]

// Builds the update-shaped wire payload from form values, omitting an empty valid_from.
function toUpdatePayload(
  values: ProductTemplateWizardForm
): UpdateProductTemplateDraftRequest {
  return {
    template_name: values.template_name,
    template_description: values.template_description,
    refinancing_form: values.refinancing_form,
    legal_structure: values.legal_structure,
    payment_timing: values.payment_timing,
    rate_basis: values.rate_basis,
    first_installment_rule: values.first_installment_rule,
    disbursement_derivation_rule: values.disbursement_derivation_rule,
    allowed_asset_categories: values.allowed_asset_categories,
    min_term_months: values.min_term_months,
    max_term_months: values.max_term_months,
    max_ltv_ratio: values.max_ltv_ratio,
    min_volume_eur: values.min_volume_eur,
    max_volume_eur: values.max_volume_eur,
    effective_rate: values.effective_rate,
    valid_from: values.valid_from || undefined,
  }
}

function toNewVersionFormDefaults(
  detail: TemplateVersionDetail
): ProductTemplateWizardForm {
  return {
    template_name: detail.template_name,
    template_description: detail.template_description ?? "",
    refinancing_form: detail.refinancing_form,
    legal_structure: detail.legal_structure,
    payment_timing: detail.payment_timing,
    rate_basis: detail.rate_basis,
    first_installment_rule:
      detail.first_installment_rule ??
      FirstInstallmentRuleSchema.enum.following_month,
    disbursement_derivation_rule:
      detail.disbursement_derivation_rule ??
      DisbursementDerivationRuleSchema.enum.npv,
    allowed_asset_categories: detail.allowed_asset_categories ?? [],
    min_term_months: detail.min_term_months ?? undefined,
    max_term_months: detail.max_term_months ?? undefined,
    max_ltv_ratio: detail.max_ltv_ratio ?? undefined,
    min_volume_eur: detail.min_volume_eur ?? undefined,
    max_volume_eur: detail.max_volume_eur ?? undefined,
    effective_rate: detail.effective_rate ?? undefined,
    valid_from: detail.valid_from ?? "",
  }
}

type WizardFormProps = {
  initialDraftRef: DraftRef | null
  initialFormValues: ProductTemplateWizardForm | undefined
  onPublished: () => void
}

function WizardFormView({
  initialDraftRef,
  initialFormValues,
  onPublished,
}: WizardFormProps) {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()

  const [step, setStep] = useState<ProductTemplateWizardStep>("identity")
  const [draftRef, setDraftRef] = useState<DraftRef | null>(initialDraftRef)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const selectedTenantId = useTenantSelectionStore(s => s.selectedTenantId)
  const tenantId =
    currentUser?.tenant_id ??
    (currentUser?.role === SYSTEM_ADMIN_ROLE ? selectedTenantId : null)

  const { mutateAsync: createDraft, isPending: isCreating } =
    useCreateProductTemplateDraft()
  const { mutateAsync: updateDraft, isPending: isUpdating } =
    useUpdateProductTemplateDraft()
  const { mutateAsync: discardDraft, isPending: isDiscarding } =
    useDiscardProductTemplateDraft()
  const { mutateAsync: publishDraft, isPending: isPublishing } =
    usePublishProductTemplate()

  const [justification, setJustification] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)

  const form = useForm<ProductTemplateWizardForm>({
    resolver: zodResolver(ProductTemplateWizardFormSchema),
    defaultValues: initialFormValues ?? {
      template_name: "",
      template_description: "",
      allowed_asset_categories: [],
    },
  })

  const isSaving = isCreating || isUpdating || isPublishing

  const [
    watchedName,
    watchedRefinancingForm,
    watchedLegalStructure,
    watchedPaymentTiming,
    watchedRateBasis,
  ] = useWatch({
    control: form.control,
    name: [
      "template_name",
      "refinancing_form",
      "legal_structure",
      "payment_timing",
      "rate_basis",
    ],
  })

  // Gap 2 (see plan): the create endpoint hard-requires these 5 fields even though the
  // PRD narrative says draft creation needs only name. Save-as-draft only becomes
  // clickable once all 5 are present, not the full per-step form validity.
  const canSaveDraft = Boolean(
    watchedName &&
    watchedRefinancingForm &&
    watchedLegalStructure &&
    watchedPaymentTiming &&
    watchedRateBasis
  )

  const currentIndex = ORDERED_STEPS.indexOf(step)
  const isFirstStep = currentIndex === 0
  const isReviewStep = step === "review"

  async function handleNext() {
    const fields = WIZARD_STEP_FIELDS[step]
    const valid = await form.trigger(fields)
    if (!valid) return
    setStep(ORDERED_STEPS[currentIndex + 1])
  }

  function handleBack() {
    if (isFirstStep) return
    setStep(ORDERED_STEPS[currentIndex - 1])
  }

  // Shared by Save as draft and Publish — creates/updates the draft, returning the
  // resolved draft ref. Returns null (silently, matching the pre-existing behavior)
  // only when there's no tenant to create against yet.
  async function saveDraft(): Promise<DraftRef | null> {
    const values = form.getValues()
    const updatePayload = toUpdatePayload(values)

    let ref = draftRef
    if (!ref) {
      if (!tenantId) return null
      // canSaveDraft (gating the button that calls this) guarantees the 5 wire-required
      // fields are present, which TS can't infer from the looser wizard-form type.
      const result = await createDraft({
        tenantId,
        body: updatePayload as CreateProductTemplateDraftRequest,
      })
      ref = { templateId: result.id, versionNumber: result.version_number }
      setDraftRef(ref)
    } else {
      await updateDraft({
        templateId: ref.templateId,
        versionNumber: ref.versionNumber,
        body: updatePayload,
      })
    }

    return ref
  }

  async function handleSaveDraft() {
    // The review step declares no fields of its own, so `trigger([])` there validated
    // nothing and let a draft carrying invalid values from earlier steps reach the API.
    // With no step-specific list, validate the whole form instead.
    const fields = WIZARD_STEP_FIELDS[step]
    const valid =
      fields.length > 0 ? await form.trigger(fields) : await form.trigger()
    if (!valid) return
    try {
      const ref = await saveDraft()
      if (!ref) return
      toast.success(t("wizard.draftSaved"))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handlePublish() {
    // The publish-only gate — CR-BPT-08 on PRD1042-1798. The resolver enforces the draft
    // rules; the effective date only becomes mandatory, and only becomes checkable against
    // "today", at this transition. Running it here rather than in the resolver also means a
    // draft saved last week is re-checked at the moment it is published, which is the case
    // the old create-time check missed entirely.
    const publishCheck = ProductTemplatePublishFormSchema.safeParse(
      form.getValues()
    )
    if (!publishCheck.success) {
      for (const issue of publishCheck.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string") {
          form.setError(field as keyof ProductTemplateWizardForm, {
            message: issue.message,
          })
        }
      }
      // The offending fields live on earlier steps, so send the user back to the first one
      // that has an error — otherwise the messages render on a step nobody is looking at.
      const firstBadStep = ORDERED_STEPS.find(s =>
        WIZARD_STEP_FIELDS[s].some(field =>
          publishCheck.error.issues.some(issue => issue.path[0] === field)
        )
      )
      if (firstBadStep) setStep(firstBadStep)
      return
    }

    try {
      const ref = await saveDraft()
      if (!ref) return
      await publishDraft({
        templateId: ref.templateId,
        versionNumber: ref.versionNumber,
        body: { justification: justification.trim() || '' },
      })
      onPublished()
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleConfirmDiscard() {
    if (!draftRef) return
    try {
      await discardDraft(draftRef)
      setDiscardDialogOpen(false)
      navigate(-1)
    } catch (err) {
      showApiError(err, t)
    }
  }

  function handleCancel() {
    if (draftRef) {
      setDiscardDialogOpen(true)
      return
    }
    navigate(-1)
  }

  if (currentUser && !tenantId) {
    return (
      <TenantScopeGate
        isSystemAdmin={currentUser.role === SYSTEM_ADMIN_ROLE}
        selectTenantPrompt={t("list.selectTenantPrompt")}
        tenantRequiredMessage={t("list.tenantRequired")}
      />
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
          {step === "behavioral" && <BehavioralSettingsStep form={form} />}
          {step === "eligibility" && <EligibilityStep form={form} />}
          {step === "review" && (
            <ReviewStep
              form={form}
              justification={justification}
              onJustificationChange={setJustification}
              isConfirmed={isConfirmed}
              onIsConfirmedChange={setIsConfirmed}
            />
          )}
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
          {!isReviewStep && (
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
          {isReviewStep && (
            <Button
              type="button"
              data-testid="wizard-publish-button"
              onClick={handlePublish}
              disabled={isSaving || !isConfirmed}
            >
              {t("wizard.actions.publish")}
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

function TemplatePublishedSuccess() {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full items-center justify-center bg-slate-50">
      <div
        className="w-full max-w-[400px] bg-card rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 items-center"
        data-testid="template-published-success"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="bg-success/10 p-3 rounded-[14px]">
            <Check size={24} className="text-success" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-3 text-center w-full">
            <h1 className="text-xl font-semibold text-foreground">
              {t("wizard.templatePublished.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("wizard.templatePublished.subtitle")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="w-full"
          data-testid="back-to-template-list-button"
          onClick={() => navigate(PATHS.PRODUCT_TEMPLATE_LIST)}
        >
          <ArrowLeft size={16} />
          {t("wizard.templatePublished.backButton")}
        </Button>
      </div>
    </div>
  )
}

export default function CreateProductTemplateWizardPage() {
  const { t } = useTranslation("productTemplates")
  const { templateId, versionNumber } = useParams<{
    templateId?: string
    versionNumber?: string
  }>()
  // Both params absent is the create path and stays valid. Present-but-malformed is a bad
  // link — it must read as not-found rather than resolve to a request the API rejects.
  const hasRouteRef = templateId !== undefined || versionNumber !== undefined
  const draftRefFromRoute =
    isUuidRouteParam(templateId) && isVersionNumberRouteParam(versionNumber)
      ? { templateId, versionNumber }
      : null
  const isRouteRefMalformed = hasRouteRef && draftRefFromRoute === null

  const [isPublished, setIsPublished] = useState(false)

  const {
    data: existingDraft,
    isLoading,
    isError,
    error,
  } = useTemplateVersionDetail(
    draftRefFromRoute?.templateId ?? "",
    draftRefFromRoute?.versionNumber ?? null
  )

  // Checked before the guards below: publishing flips this version's status out of
  // `draft`, so once the refreshed detail arrives the immutability guard would
  // otherwise replace the success screen with "this action is no longer allowed".
  if (isPublished) {
    return <TemplatePublishedSuccess />
  }

  if (draftRefFromRoute && isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t("wizard.loadingDraft")}
        </p>
      </div>
    )
  }

  if (
    isRouteRefMalformed ||
    (draftRefFromRoute && isProductTemplateNotFoundError(error))
  ) {
    return <NotFoundPage />
  }

  if (
    draftRefFromRoute &&
    existingDraft &&
    existingDraft.version_status !== TemplateStatusSchema.enum.draft
  ) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center gap-3"
        data-testid="wizard-immutable-version"
      >
        <p className="text-sm text-muted-foreground">
          {t("errors.IMMUTABILITY_VIOLATION")}
        </p>
        <Link
          to={productTemplateVersionHistory(draftRefFromRoute.templateId)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("wizard.backToVersionHistory")}
        </Link>
      </div>
    )
  }

  if (draftRefFromRoute && (isError || !existingDraft)) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center"
        data-testid="wizard-load-error"
      >
        <p className="text-sm text-muted-foreground">
          {resolveApiErrorMessage(error, t)}
        </p>
      </div>
    )
  }

  return (
    <WizardFormView
      key={
        draftRefFromRoute
          ? `${draftRefFromRoute.templateId}-${draftRefFromRoute.versionNumber}`
          : "create"
      }
      initialDraftRef={draftRefFromRoute}
      initialFormValues={
        draftRefFromRoute && existingDraft
          ? toNewVersionFormDefaults(existingDraft)
          : undefined
      }
      onPublished={() => setIsPublished(true)}
    />
  )
}
