import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"

/**
 * Wizard step 3 — **Upload documents** (`Required by the product`).
 *
 * Added by the Milestone 1 final dummy of 14 Sep, between Contracts and Summary. The documents the
 * bank product catalogue asks for, uploaded while the request is being built rather than chased
 * afterwards.
 *
 * ── THE ASYMMETRY IS THE POINT ─────────────────────────────────────────────────────────────────
 * The dummy states it twice, in the subtitle and again in its warning: for a **leasing-company
 * user** the documents "have to be uploaded before the request can be submitted"; for a **bank
 * user** they are "optional — they can also be uploaded on the Documents tab after submission".
 *
 * So the step is shown to both and the *gate* is what differs. A portal user cannot reach Summary
 * while a required document is missing; a bank user walks past. Enforcing it for both would block
 * the bank from a request it is allowed to submit, and for neither would let a portal user reach a
 * Submit the backend will refuse.
 *
 * ── THE TABLE IS THE INCOMING TAB'S, DELIBERATELY ──────────────────────────────────────────────
 * The dummy says so outright — *"The table is the one from the Incoming tab of the case"* — and
 * that is what `CaseDocumentRequirementsPanel` already is, upload control and all. A second table
 * over the same requirements would be a second place to keep the review states, the role gating and
 * the catalogue resolution in step.
 *
 * What is **not** re-derived here is which documents block: `is_blocking` on each requirement is
 * the backend's own answer, and counting mandatory-and-missing again in the client would be a
 * second judgement that can disagree with the one the Submit is actually checked against.
 */
export function DocumentsStep({
  caseId,
  caseType,
  isPortalUser,
  blockingCount,
}: {
  caseId: string
  caseType: string | undefined
  isPortalUser: boolean
  /** How many required documents are still missing, from the requirement surface. */
  blockingCount: number
}) {
  const { t } = useTranslation("cases")

  return (
    <div
      className="flex flex-col gap-6"
      data-testid="case-wizard-step-documents"
    >
      {/* No heading of its own — the wizard shell already titles the step, and two identical
          headings stacked read as a rendering fault. */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t(
            isPortalUser
              ? "wizard.documents.subtitlePortal"
              : "wizard.documents.subtitleBank"
          )}
        </p>
      </div>

      {/* Only a portal user is held here, so only a portal user is told they are being held. The
          same count for a bank user would read as an obstacle where there is none. */}
      {isPortalUser && blockingCount > 0 && (
        <Alert data-testid="case-wizard-documents-missing">
          <AlertTitle>
            {t("wizard.documents.missing.title", { count: blockingCount })}
          </AlertTitle>
          <AlertDescription>
            {t("wizard.documents.missing.description")}
          </AlertDescription>
        </Alert>
      )}

      <CaseDocumentRequirementsPanel
        businessObjectId={caseId}
        caseType={caseType}
      />
    </div>
  )
}
