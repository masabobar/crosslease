import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useBlocker } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PATHS } from "@/router/paths"
import { CreateTenantFormSchema } from "@/features/tenants/api/schema"
import type { CreateTenantForm } from "@/features/tenants/api/schema"
import {
  WizardStepper,
  ORDERED_STEPS as ORDERED_WIZARD_STEPS,
} from "@/features/tenants/components/WizardStepper"
import type { WizardStep } from "@/features/tenants/components/WizardStepper"
import { IdentityStep } from "@/features/tenants/components/steps/IdentityStep"
import { ModulesStep } from "@/features/tenants/components/steps/ModulesStep"
import { SeedPackageStep } from "@/features/tenants/components/steps/SeedPackageStep"
import { IntegrationStep } from "@/features/tenants/components/steps/IntegrationStep"
import { ReviewStep } from "@/features/tenants/components/steps/ReviewStep"
import { usePlatformModules } from "@/features/tenants/hooks/usePlatformModules"
import { useSeedPackages } from "@/features/tenants/hooks/useSeedPackages"
import { useCreateTenant } from "@/features/tenants/hooks/useCreateTenant"
import {
  loadWizardDraft,
  saveWizardDraft,
  clearWizardDraft,
} from "@/features/tenants/hooks/useTenantWizardDraft"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useTenantFormErrorHandler } from "@/features/tenants/hooks/useTenantFormErrorHandler"
import { ApiError } from "@/lib/api"
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

type FullStep = WizardStep | "success"

const STEP_FIELDS: Record<WizardStep, (keyof CreateTenantForm)[]> = {
  identity: ["name", "code", "tenant_type", "legal_entity_name", "country"],
  modules: [],
  seed: ["seed_package"],
  integration: [],
  review: [],
}

export default function CreateTenantPage() {
  const { t } = useTranslation("tenants")
  const navigate = useNavigate()

  const [step, setStep] = useState<FullStep>("identity")
  const [isRestoreDismissed, setIsRestoreDismissed] = useState(false)

  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  const {
    data: modulesData,
    isLoading: isModulesLoading,
    isError: isModulesError,
    error: modulesError,
  } = usePlatformModules()
  const {
    data: packagesData,
    isLoading: isPackagesLoading,
    isError: isPackagesError,
    error: packagesError,
  } = useSeedPackages()
  const { mutateAsync: createTenant, isPending } = useCreateTenant()

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(CreateTenantFormSchema),
    defaultValues: {
      name: "",
      code: "",
      legal_entity_name: "",
      country: "",
      default_currency: "EUR",
      description: "",
      modules: [],
      seed_package: "standard_retail_bank",
      core_banking_integration_ref: "",
    },
  })

  const modules = modulesData?.modules ?? []
  const packages = packagesData?.packages ?? []

  // Probed once per user rather than on every render: loadWizardDraft touches
  // localStorage and runs a JSON + schema parse.
  const [probedUserId, setProbedUserId] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [wasDraftUnreadable, setWasDraftUnreadable] = useState(false)
  if (userId && probedUserId !== userId) {
    const probe = loadWizardDraft(userId)
    setProbedUserId(userId)
    setHasDraft(probe.status === "loaded")
    setWasDraftUnreadable(probe.status === "unreadable")
  }

  const handleError = useTenantFormErrorHandler({
    getValues: form.getValues,
    setError: form.setError,
  })

  const isRestoreOpen = hasDraft && !isRestoreDismissed

  function handleRestore() {
    if (!userId) return
    const result = loadWizardDraft(userId)
    if (result.status !== "loaded") return
    form.reset(result.draft.formValues)
    setStep(result.draft.step)
    setIsRestoreDismissed(true)
  }

  function handleStartFresh() {
    if (userId) clearWizardDraft(userId)
    setIsRestoreDismissed(true)
  }

  // Which step to land on when validation fails: the first one that owns a failing field,
  // so the message the user has to act on is actually on screen.
  function firstStepWithError(): WizardStep | undefined {
    const { errors } = form.formState
    return ORDERED_WIZARD_STEPS.find(wizardStep =>
      STEP_FIELDS[wizardStep].some(field => errors[field])
    )
  }

  async function handleNext() {
    if (step === "success") return

    const fields = STEP_FIELDS[step as WizardStep]
    if (fields.length > 0) {
      const valid = await form.trigger(fields)
      if (!valid) return
    }

    const currentIndex = ORDERED_WIZARD_STEPS.indexOf(step as WizardStep)

    if (step === "review") {
      // The review step declares no fields of its own, so up to this point nothing had
      // validated the form as a whole — a required field skipped on a step whose
      // STEP_FIELDS list is empty reached the API and came back as a server rejection.
      const isWholeFormValid = await form.trigger()
      if (!isWholeFormValid) {
        setStep(firstStepWithError() ?? "identity")
        return
      }

      const data = form.getValues()
      try {
        await createTenant(data)
        if (userId) clearWizardDraft(userId)
        setStep("success")
      } catch (err) {
        // Field-level VALIDATION_ERROR detail lands on the identity fields, which
        // live on an earlier step — send the user back so the highlighted field is
        // actually on screen.
        handleError(err)
        const errorStep = firstStepWithError()
        if (errorStep) setStep(errorStep)
      }
      return
    }

    const nextStep = ORDERED_WIZARD_STEPS[currentIndex + 1]
    if (userId) saveWizardDraft(userId, nextStep, form.getValues())
    setStep(nextStep)
  }

  function handleBack() {
    if (step === "success") return

    const currentIndex = ORDERED_WIZARD_STEPS.indexOf(step as WizardStep)
    if (currentIndex > 0) {
      const prevStep = ORDERED_WIZARD_STEPS[currentIndex - 1]
      if (userId) saveWizardDraft(userId, prevStep, form.getValues())
      setStep(prevStep)
    }
  }

  const isFirstStep =
    step !== "success" && ORDERED_WIZARD_STEPS.indexOf(step as WizardStep) === 0
  const isReviewStep = step === "review"
  const isSuccessStep = step === "success"

  const [
    watchedName,
    watchedCode,
    watchedTenantType,
    watchedLegalEntityName,
    watchedCountry,
  ] = useWatch({
    control: form.control,
    name: ["name", "code", "tenant_type", "legal_entity_name", "country"],
  })
  const isIdentityComplete = Boolean(
    watchedName &&
    watchedCode &&
    watchedTenantType &&
    watchedLegalEntityName &&
    watchedCountry
  )

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      step !== "success" &&
      form.formState.isDirty &&
      currentLocation.pathname !== nextLocation.pathname
  )

  if (isSuccessStep) {
    return (
      <div
        className="flex flex-col h-full items-center justify-center p-6"
        data-testid="success-screen"
      >
        <div className="bg-background rounded-[14px] shadow-2xl p-6 flex flex-col gap-6 w-full max-w-[400px]">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="bg-green-500/10 rounded-[14px] p-3 w-fit">
              <Check size={24} className="text-green-600" />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-card-foreground">
                {t("wizard.success.title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">{watchedName}</span>{" "}
                {t("wizard.success.subtitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("wizard.success.note")}
              </p>
            </div>
          </div>

          {/* Action */}
          <Button
            data-testid="back-to-list-button"
            onClick={() => navigate(PATHS.TENANT_MANAGEMENT)}
            className="w-full"
          >
            <ArrowLeft size={16} />
            {t("wizard.success.backToList")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Wizard stepper bar — has its own border-b */}
      <WizardStepper currentStep={step as WizardStep} />

      {/* Scrollable step content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 max-w-4xl mx-auto w-full">
          {/* Step title */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              {t(`wizard.${step as WizardStep}.title`)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t(`wizard.${step as WizardStep}.subtitle`)}
            </p>
          </div>

          {/* Step content */}
          {step === "identity" && <IdentityStep form={form} />}
          {step === "modules" && (
            <>
              {isModulesError && (
                <p
                  className="mb-4 text-sm text-destructive"
                  data-testid="modules-fetch-error"
                >
                  {modulesError instanceof ApiError
                    ? t(`errors.${modulesError.code}`, {
                        defaultValue: t("errors.generic"),
                      })
                    : t("errors.generic")}
                </p>
              )}
              <ModulesStep
                form={form}
                modules={modules}
                isLoading={isModulesLoading}
              />
            </>
          )}
          {step === "seed" && (
            <>
              {isPackagesError && (
                <p
                  className="mb-4 text-sm text-destructive"
                  data-testid="seed-fetch-error"
                >
                  {packagesError instanceof ApiError
                    ? t(`errors.${packagesError.code}`, {
                        defaultValue: t("errors.generic"),
                      })
                    : t("errors.generic")}
                </p>
              )}
              <SeedPackageStep
                form={form}
                packages={packages}
                isLoading={isPackagesLoading}
              />
            </>
          )}
          {step === "integration" && <IntegrationStep form={form} />}
          {step === "review" && (
            <ReviewStep
              values={form.getValues()}
              modules={modules}
              packages={packages}
            />
          )}

          {/* A draft existed but could not be read back — say so rather than silently
              offering no restore prompt to someone who came back to resume. */}
          {wasDraftUnreadable && (
            <p
              role="status"
              className="mt-4 text-sm text-muted-foreground"
              data-testid="wizard-draft-unreadable"
            >
              {t("wizard.restoreDialog.unreadableDraft")}
            </p>
          )}

          {/* Root form error */}
          {form.formState.errors.root && (
            <p className="mt-4 text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 border-t border-border bg-background px-6 py-[14px] flex items-center justify-between">
        {/* Left: Cancel only */}
        <Button
          type="button"
          variant="outline"
          data-testid="wizard-cancel-button"
          onClick={() => navigate(PATHS.TENANT_MANAGEMENT)}
          disabled={isPending}
        >
          {t("wizard.actions.cancel")}
        </Button>

        {/* Right: Back + Next/Submit */}
        <div className="flex items-center gap-2.5">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              data-testid="wizard-back-button"
              onClick={handleBack}
              disabled={isPending}
            >
              <ArrowLeft size={16} />
              {t("wizard.actions.back")}
            </Button>
          )}
          <Button
            type="button"
            data-testid="wizard-next-button"
            onClick={handleNext}
            disabled={isPending || (step === "identity" && !isIdentityComplete)}
          >
            {isReviewStep
              ? t("wizard.review.submitButton")
              : t("wizard.actions.next")}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <AlertDialog open={isRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("wizard.restoreDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("wizard.restoreDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="restore-dialog-start-fresh"
              onClick={handleStartFresh}
            >
              {t("wizard.restoreDialog.startFresh")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="restore-dialog-continue"
              onClick={handleRestore}
            >
              {t("wizard.restoreDialog.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={blocker.state === "blocked"}
        onOpenChange={open => {
          if (!open) blocker.reset?.()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("wizard.leaveDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("wizard.leaveDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="leave-dialog-stay">
              {t("wizard.leaveDialog.stay")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="leave-dialog-leave"
              onClick={() => {
                if (userId)
                  saveWizardDraft(userId, step as WizardStep, form.getValues())
                blocker.proceed?.()
              }}
            >
              {t("wizard.leaveDialog.leave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
