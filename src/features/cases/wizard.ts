/**
 * The Start-a-case wizard's step model — the "New refinancing request" flow.
 *
 * **Four** steps, per the Milestone 1 final dummy of 14 Sep. It had been three — an older click
 * dummy's five-step version was a known defect (US 1.1 "Known defects in reference material") and is
 * still not what this is: the final adds exactly one step, `documents`, between the contracts and
 * the summary, and does not restore the other two.
 *
 * Kept as a pure module so the ordering, the guards and the labels are unit-testable without
 * mounting the wizard — the same reason `features/frameworkAgreements/editWizard.ts` exists.
 */

export const CASE_WIZARD_STEPS = [
  "leasingCompany",
  "contracts",
  "documents",
  "summary",
] as const

export type CaseWizardStep = (typeof CASE_WIZARD_STEPS)[number]

/** What each step needs to have happened before it may be opened. */
export interface CaseWizardProgress {
  /** A leasing company is bound AND a product template is chosen (step 1 complete). */
  isLeasingCompanyBound: boolean
  /** At least one contract has been committed into the case (step 2 complete). */
  hasContracts: boolean
  /**
   * Whether a document the catalogue requires is still missing — the backend's own `is_blocking`,
   * not a second judgement made here.
   *
   * Only bites for a leasing-company user. The dummy is explicit about the asymmetry: the documents
   * the bank product catalogue asks for "have to be uploaded before the request can be submitted"
   * by a portal user, and are "optional for a bank user — they can also be uploaded on the Documents
   * tab after submission". So the step is always shown and the gate is role-scoped.
   */
  hasBlockingDocuments: boolean
  /** True for a leasing-company user, for whom the document gate applies. */
  isPortalUser: boolean
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
    case "documents":
      return progress.isLeasingCompanyBound && progress.hasContracts
    case "summary":
      return (
        progress.isLeasingCompanyBound &&
        progress.hasContracts &&
        // A bank user walks past an incomplete document set; a portal user cannot, because the
        // request they are about to submit would be refused for it.
        !(progress.isPortalUser && progress.hasBlockingDocuments)
      )
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
