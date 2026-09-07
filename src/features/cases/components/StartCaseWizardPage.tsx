import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WizardStepper } from "@/components/shared/WizardStepper"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { caseDetail } from "@/router/paths"
import { useCase } from "@/features/cases/hooks/useCase"
import { useCaseLeasingCompany } from "@/features/cases/hooks/useCaseLeasingCompany"
import { useCaseProductTemplate } from "@/features/cases/hooks/useCaseProductTemplate"
import { useCaseContracts } from "@/features/cases/hooks/useCaseContracts"
import { ContractsStep } from "@/features/cases/components/steps/ContractsStep"
import { LeasingCompanyStep } from "@/features/cases/components/steps/LeasingCompanyStep"
import {
  CASE_WIZARD_STEPS,
  canOpenStep,
  nextStep,
  previousStep,
} from "@/features/cases/wizard"
import type { CaseWizardStep } from "@/features/cases/wizard"

/**
 * The **New refinancing request** wizard (design-extract §6; `CREATE NEW.pdf`).
 *
 * ── WHY THE CASE EXISTS BEFORE THE WIZARD DOES ─────────────────────────────────────────────────
 * Every step writes to a case-scoped endpoint — `PUT /cases/{id}/leasing-company`,
 * `PUT /cases/{id}/product-template`, `POST /cases/{id}/contracts/import`. None of them can be
 * called without a case id, and there is no "draft request" resource to accumulate answers in. So
 * `StartCaseDialog` creates the case first (US 1.1: the type is asked before anything else) and
 * routes here with its id. That is also what makes `Save as draft` free: the case is already
 * persisted at every point, so the footer button simply leaves.
 *
 * ── WHAT IS BUILT HERE ─────────────────────────────────────────────────────────────────────────
 * Step 1 only, in this commit. Steps 2 and 3 render a placeholder naming the story that will fill
 * them, rather than an empty pane that reads as "nothing to do here" — the same convention the case
 * workspace uses for its design-only tabs.
 */
export default function StartCaseWizardPage() {
  const { t } = useTranslation("cases")
  const navigate = useNavigate()
  const { caseId } = useParams<{ caseId: string }>()

  const isValidId = isUuidRouteParam(caseId)
  const caseQuery = useCase(isValidId ? caseId : undefined)
  const leasingCompany = useCaseLeasingCompany(isValidId ? caseId : undefined)
  const productTemplate = useCaseProductTemplate(isValidId ? caseId : undefined)
  const contracts = useCaseContracts(isValidId ? caseId : undefined)

  const [step, setStep] = useState<CaseWizardStep>(CASE_WIZARD_STEPS[0])

  if (!isValidId) return <NotFoundPage />

  // Step 1 is complete once BOTH the company and the template are bound: the import in step 2
  // validates rows against the template, so a case with a company but no template would fail the
  // whole file on a precondition rather than show anything useful.
  const isLeasingCompanyBound =
    leasingCompany.data !== null &&
    leasingCompany.data !== undefined &&
    leasingCompany.data.lc_number !== null &&
    productTemplate.data !== null &&
    productTemplate.data !== undefined

  const progress = {
    isLeasingCompanyBound,
    // Committed contracts, not the bulk preview's candidate rows: step 3 summarises what is in the
    // case, so a batch uploaded but never committed must not open it.
    hasContracts: (contracts.data?.total ?? 0) > 0,
  }

  const back = previousStep(step)
  const forward = nextStep(step)
  const canContinue = forward !== null && canOpenStep(forward, progress)

  function handleSaveDraft() {
    // Nothing to persist — every step has already written through to the case. The draft *is* the
    // case, so this is a navigation, and saying so beats a fake "saved" toast.
    toast.success(t("wizard.actions.draftSaved"))
    navigate(caseDetail(caseId as string))
  }

  if (caseQuery.isLoading) {
    return (
      <div
        className="flex flex-col gap-4 p-8"
        data-testid="case-wizard-loading"
      >
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (caseQuery.isError || !caseQuery.data) return <NotFoundPage />

  return (
    <div className="flex h-full flex-col bg-slate-50" data-testid="case-wizard">
      <WizardStepper
        testIdPrefix="case-"
        currentStepKey={step}
        steps={CASE_WIZARD_STEPS.map(key => ({
          key,
          label: t(`wizard.steps.${key}.label` as "wizard.steps.summary.label"),
          description: t(
            `wizard.steps.${key}.description` as "wizard.steps.summary.description"
          ),
        }))}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-8 py-6">
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {t(`wizard.${step}.title` as "wizard.summary.title")}
          </h2>

          {step === "leasingCompany" && (
            <LeasingCompanyStep
              caseId={caseId as string}
              leasingCompany={leasingCompany.data ?? null}
              isLoadingLeasingCompany={leasingCompany.isLoading}
            />
          )}

          {step === "contracts" && <ContractsStep caseId={caseId as string} />}

          {step === "summary" && (
            <p
              className="text-sm text-muted-foreground"
              data-testid="case-wizard-step-pending-summary"
            >
              {t("wizard.summary.pending")}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border bg-background px-6 py-3.5">
        <Button
          type="button"
          variant="outline"
          data-testid="case-wizard-cancel-button"
          onClick={() => navigate(caseDetail(caseId as string))}
        >
          {t("wizard.actions.cancel")}
        </Button>

        <div className="flex items-center gap-2.5">
          {back !== null && (
            <Button
              type="button"
              variant="outline"
              data-testid="case-wizard-back-button"
              onClick={() => setStep(back)}
            >
              <ArrowLeft size={16} />
              {t("wizard.actions.back")}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            data-testid="case-wizard-save-draft-button"
            onClick={handleSaveDraft}
          >
            {t("wizard.actions.saveAsDraft")}
          </Button>

          {forward !== null && (
            <Button
              type="button"
              data-testid="case-wizard-continue-button"
              disabled={!canContinue}
              onClick={() => setStep(forward)}
            >
              {t("wizard.actions.continue")}
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
