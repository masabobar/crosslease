import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "react-router-dom"
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
  showApiError,
} from "@/features/productTemplates/utils"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import {
  DisbursementDerivationRuleSchema,
  FirstInstallmentRuleSchema,
  ProductTemplateWizardFormSchema,
  RateTypeSchema,
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
import { WizardStepper } from "@/features/productTemplates/components/WizardStepper"
import { IdentityStep } from "@/features/productTemplates/components/steps/IdentityStep"
import { BehavioralSettingsStep } from "@/features/productTemplates/components/steps/BehavioralSettingsStep"
import { EligibilityStep } from "@/features/productTemplates/components/steps/EligibilityStep"
import { OrchestrationStep } from "@/features/productTemplates/components/steps/OrchestrationStep"
import { ReviewStep } from "@/features/productTemplates/components/steps/ReviewStep"
import { useCreateProductTemplateDraft } from "@/features/productTemplates/hooks/useCreateProductTemplateDraft"
import { useUpdateProductTemplateDraft } from "@/features/productTemplates/hooks/useUpdateProductTemplateDraft"
import { useUpdateProductTemplateOrchestration } from "@/features/productTemplates/hooks/useUpdateProductTemplateOrchestration"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft"
import { usePublishProductTemplate } from "@/features/productTemplates/hooks/usePublishProductTemplate"
import { useTemplateVersionDetail } from "@/features/productTemplates/hooks/useTemplateVersionDetail"

const ORDERED_STEPS: ProductTemplateWizardStep[] = [
  "identity",
  "behavioral",
  "eligibility",
  "orchestration",
  "review",
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
  orchestration: [
    "required_workflow_tasks",
    "required_documents",
    "validation_rule_set_id",
  ],
  review: [],
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

// Seeded into the (hidden, immutable) template_code field when authoring a new version
// from a Published template — VersionDetailResponse doesn't return template_code (no
// reachable single-template lookup exists either, see plan Gap 4), and template_code is
// stripped from every update payload regardless, so the placeholder itself is inert.
const NEW_VERSION_TEMPLATE_CODE_PLACEHOLDER = "N/A"

function toNewVersionFormDefaults(
  detail: TemplateVersionDetail
): ProductTemplateWizardForm {
  return {
    template_code: NEW_VERSION_TEMPLATE_CODE_PLACEHOLDER,
    template_name: detail.template_name,
    template_description: detail.template_description ?? "",
    financing_type: detail.financing_type,
    legal_structure: detail.legal_structure,
    payment_timing: detail.payment_timing,
    rate_basis: detail.rate_basis,
    calculation_model: detail.calculation_model,
    rate_type: detail.rate_type ?? RateTypeSchema.enum.fixed,
    npv_formula_ref: detail.npv_formula_ref ?? "",
    first_installment_rule:
      detail.first_installment_rule ??
      FirstInstallmentRuleSchema.enum.following_month,
    disbursement_derivation_rule:
      detail.disbursement_derivation_rule ??
      DisbursementDerivationRuleSchema.enum.npv,
    allowed_asset_categories: detail.allowed_asset_categories ?? [],
    min_term_months: detail.min_term_months ?? 1,
    max_term_months: detail.max_term_months ?? 1,
    max_ltv_ratio: detail.max_ltv_ratio ?? 0,
    min_volume_eur: detail.min_volume_eur ?? undefined,
    max_volume_eur: detail.max_volume_eur ?? undefined,
    valid_from: detail.valid_from ?? "",
    valid_until: detail.valid_until ?? "",
    // No GET endpoint returns a version's saved orchestration linkage (only the PATCH
    // response ever does), so re-versioning from a Published template can't pre-fill these
    // — the author has to re-select them (see plan Gap 5).
    required_workflow_tasks: [],
    required_documents: [],
    optional_documents: [],
    validation_rule_set_id: "",
  }
}

type WizardFormProps = {
  initialDraftRef: DraftRef | null
  initialFormValues: ProductTemplateWizardForm | undefined
  shouldHideTemplateCode: boolean
}

function WizardFormView({
  initialDraftRef,
  initialFormValues,
  shouldHideTemplateCode,
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
  const { mutateAsync: saveOrchestration, isPending: isSavingOrchestration } =
    useUpdateProductTemplateOrchestration()
  const { mutateAsync: publishDraft, isPending: isPublishing } =
    usePublishProductTemplate()

  const [justification, setJustification] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isPublished, setIsPublished] = useState(false)

  const form = useForm<ProductTemplateWizardForm>({
    resolver: zodResolver(ProductTemplateWizardFormSchema),
    defaultValues: initialFormValues ?? {
      template_code: "",
      template_name: "",
      template_description: "",
      allowed_asset_categories: [],
      required_workflow_tasks: [],
      required_documents: [],
      optional_documents: [],
      validation_rule_set_id: "",
    },
  })

  const isSaving =
    isCreating || isUpdating || isSavingOrchestration || isPublishing

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
  const isReviewStep = step === "review"

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

  // Shared by Save as draft and Publish — creates/updates the draft and its
  // orchestration linkage, returning the resolved draft ref. Returns null (silently,
  // matching the pre-existing behavior) only when there's no tenant to create against yet.
  async function saveDraftAndOrchestration(): Promise<DraftRef | null> {
    const values = form.getValues()
    const updatePayload = toUpdatePayload(values)

    let ref = draftRef
    if (!ref) {
      if (!tenantId) return null
      // canSaveDraft (gating the button that calls this) guarantees the 7 wire-required
      // fields are present, which TS can't infer from the looser wizard-form type.
      const result = await createDraft({
        tenantId,
        body: {
          template_code: values.template_code,
          ...updatePayload,
        } as CreateProductTemplateDraftRequest,
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

    // The orchestration PATCH requires validation_rule_set_id unconditionally, with no
    // partial-save variant (see plan Gap 5) — only call it once the author has actually
    // reached that point in the step, rather than on every step's Save as draft.
    if (values.validation_rule_set_id) {
      await saveOrchestration({
        templateId: ref.templateId,
        versionNumber: ref.versionNumber,
        body: {
          required_workflow_tasks: values.required_workflow_tasks,
          required_documents: values.required_documents,
          optional_documents: values.optional_documents,
          validation_rule_set_id: values.validation_rule_set_id,
        },
      })
    }

    return ref
  }

  async function handleSaveDraft() {
    try {
      const ref = await saveDraftAndOrchestration()
      if (!ref) return
      toast.success(t("wizard.draftSaved"))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handlePublish() {
    try {
      const ref = await saveDraftAndOrchestration()
      if (!ref) return
      await publishDraft({
        templateId: ref.templateId,
        versionNumber: ref.versionNumber,
        body: { justification: justification.trim() || null },
      })
      setIsPublished(true)
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

  if (isPublished) {
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

          {step === "identity" && (
            <IdentityStep
              form={form}
              shouldHideTemplateCode={shouldHideTemplateCode}
            />
          )}
          {step === "behavioral" && <BehavioralSettingsStep form={form} />}
          {step === "eligibility" && <EligibilityStep form={form} />}
          {step === "orchestration" && <OrchestrationStep form={form} />}
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

export default function CreateProductTemplateWizardPage() {
  const { t } = useTranslation("productTemplates")
  const { templateId, versionNumber } = useParams<{
    templateId?: string
    versionNumber?: string
  }>()
  const draftRefFromRoute =
    templateId && versionNumber ? { templateId, versionNumber } : null

  const {
    data: existingDraft,
    isLoading,
    isError,
    error,
  } = useTemplateVersionDetail(
    draftRefFromRoute?.templateId ?? "",
    draftRefFromRoute?.versionNumber ?? null
  )

  if (draftRefFromRoute && isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {t("wizard.loadingDraft")}
        </p>
      </div>
    )
  }

  if (draftRefFromRoute && isProductTemplateNotFoundError(error)) {
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
          {t("errors.PRODUCT_TEMPLATE_IMMUTABILITY_VIOLATION")}
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
        <p className="text-sm text-muted-foreground">{t("errors.generic")}</p>
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
      shouldHideTemplateCode={draftRefFromRoute !== null}
    />
  )
}
