/**
 * The Start-a-case wizard's step model — the "New refinancing request" flow.
 *
 * Three steps, per design-extract §6 and R2's D-77. The click dummy's five-step version is a known
 * defect (US 1.1 "Known defects in reference material"); do not restore it.
 *
 * Kept as a pure module so the ordering, the guards and the labels are unit-testable without
 * mounting the wizard — the same reason `features/frameworkAgreements/editWizard.ts` exists.
 */

export const CASE_WIZARD_STEPS = [
  "leasingCompany",
  "contracts",
  "summary",
] as const

export type CaseWizardStep = (typeof CASE_WIZARD_STEPS)[number]

/** What each step needs to have happened before it may be opened. */
export interface CaseWizardProgress {
  /** A leasing company is bound AND a product template is chosen (step 1 complete). */
  isLeasingCompanyBound: boolean
  /** At least one contract has been committed into the case (step 2 complete). */
  hasContracts: boolean
}

export function nextStep(step: CaseWizardStep): CaseWizardStep | null {
  const index = CASE_WIZARD_STEPS.indexOf(step)
  return CASE_WIZARD_STEPS[index + 1] ?? null
}

export function previousStep(step: CaseWizardStep): CaseWizardStep | null {
  const index = CASE_WIZARD_STEPS.indexOf(step)
  return index <= 0 ? null : CASE_WIZARD_STEPS[index - 1]
}

/**
 * Whether a step may be opened given what has been done so far.
 *
 * Step 1 is always reachable — it is where the wizard starts, and a user must be able to go back
 * and change the company. The later steps are gated because the endpoints behind them are
 * case-scoped and only meaningful once the case has a company: the contract import validates rows
 * against the product template, so offering step 2 before a template is bound would produce a
 * whole-file `precondition_error` rather than a useful screen.
 */
export function canOpenStep(
  step: CaseWizardStep,
  progress: CaseWizardProgress
): boolean {
  switch (step) {
    case "leasingCompany":
      return true
    case "contracts":
      return progress.isLeasingCompanyBound
    case "summary":
      return progress.isLeasingCompanyBound && progress.hasContracts
  }
}

/**
 * The furthest step the user may currently be on.
 *
 * Used when the wizard is re-entered on a draft: a case saved after step 1 reopens on step 2 rather
 * than making the user walk forward through work already done.
 */
export function furthestOpenStep(progress: CaseWizardProgress): CaseWizardStep {
  let furthest: CaseWizardStep = CASE_WIZARD_STEPS[0]
  for (const step of CASE_WIZARD_STEPS) {
    if (canOpenStep(step, progress)) furthest = step
  }
  return furthest
}
