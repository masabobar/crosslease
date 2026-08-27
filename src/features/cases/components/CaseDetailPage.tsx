import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { useCase } from "@/features/cases/hooks/useCase"
import { caseDisplayStatusBadgeVariant } from "@/features/cases/types"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"

/**
 * Case detail shell (PRD1042-1794 DRC usability / US 16.22).
 *
 * The operational way into a case's documents: Case list → this screen → Documents tab. The tab
 * renders the same CaseDocumentRequirementsPanel the standalone deep-link page uses, passing the
 * case id as the business object id, so upload/review and catalogue resolution are identical.
 *
 * ── EXTENSIBLE ON PURPOSE ──────────────────────────────────────────────────────────────────
 * US 16.22 frames the case-document surface as one section of a Case detail screen. Documents is
 * the only tab today; checklist, parties and terms are meant to slot in beside it later. The Tabs
 * shell below is the seam — a new tab is a TabsTrigger + TabsContent pair and its own panel
 * component, nothing here has to be restructured to add one.
 */
export default function CaseDetailPage() {
  const { t } = useTranslation("cases")
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = isUuidRouteParam(caseIdParam) ? caseIdParam : undefined

  const { data, isLoading, isError, error } = useCase(caseId)

  // A param that is not a UUID can never name a case — render not-found rather than firing a request
  // the backend would reject.
  if (caseId === undefined) {
    return <NotFoundPage />
  }

  if (isLoading) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="case-detail-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-sm text-destructive" data-testid="case-detail-error">
          {error?.message ?? t("detail.loadError")}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 flex flex-col gap-6" data-testid="case-detail-page">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {data.case_reference}
          </h1>
          <Badge variant={caseDisplayStatusBadgeVariant(data.display_status)}>
            {t(
              `displayStatuses.${data.display_status}` as "displayStatuses.open",
              { defaultValue: data.display_status }
            )}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {t("detail.fields.caseType")}:{" "}
            {t(
              `caseTypes.${data.case_type}` as "caseTypes.refinancing_request",
              { defaultValue: data.case_type }
            )}
          </span>
          <span>
            {t("detail.fields.caseId")}: {data.id}
          </span>
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-documents">
            {t("detail.tabs.documents")}
          </TabsTrigger>
          {/* Future tabs (checklist, parties, terms — US 16.22) slot in here as their own
              TabsTrigger + TabsContent pairs, each rendering its own panel component. */}
        </TabsList>

        <TabsContent value="documents">
          <div className="mt-4">
            <CaseDocumentRequirementsPanel businessObjectId={data.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
