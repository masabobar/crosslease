import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isUuidRouteParam } from "@/lib/routeParams"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"

/**
 * D-11 — what a case requires (PRD1042-1796 item 5). Deep-link entry point for the case-document
 * surface: /cases/:businessObjectId/documents.
 *
 * ── NOW A THIN WRAPPER (PRD1042-1794 DRC usability) ────────────────────────────────────────
 * The surface itself lives in CaseDocumentRequirementsPanel, which the Case detail screen's
 * Documents tab renders (US 16.22 puts documents inside a Case detail screen). This page stays as
 * the standalone deep link — it resolves and guards the route param, provides the page chrome
 * (title), and hands the id to the same panel the tab uses. Every behaviour (catalogue resolution,
 * upload/review, role-gating) is unchanged; it just also has a first-class way in now via the tab.
 *
 * ── WHY THE ROUTE CARRIES ONLY AN OBJECT ID ────────────────────────────────────────────────
 * The catalogue is not asked for: item 4 forbids a catalogue selector on a case screen, and one
 * catalogue per bank (CR-DRC A2) means there is nothing to choose. The checkpoint is not asked for
 * either — a process context is not a property of the object, so the surface is read without one and
 * every row carries the contexts it applies to.
 */
export default function CaseDocumentRequirementsPage() {
  const { t } = useTranslation("documentRequirements")
  const { businessObjectId: businessObjectIdParam } = useParams<{
    businessObjectId: string
  }>()
  const businessObjectId = isUuidRouteParam(businessObjectIdParam)
    ? businessObjectIdParam
    : undefined

  if (!businessObjectId) {
    return (
      <div className="p-8">
        <Alert variant="destructive" data-testid="case-documents-bad-id">
          <AlertTitle>{t("caseDocuments.badId.title")}</AlertTitle>
          <AlertDescription>
            {t("caseDocuments.badId.description")}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-8" data-testid="case-documents-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-foreground">
          {t("caseDocuments.title")}
        </h1>
      </div>

      <CaseDocumentRequirementsPanel businessObjectId={businessObjectId} />
    </div>
  )
}
