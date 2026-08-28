import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import NotFoundPage from "@/features/errors/components/NotFoundPage"
import { showApiError } from "@/lib/apiErrorMessage"
import { isUuidRouteParam } from "@/lib/routeParams"
import { useCase } from "@/features/cases/hooks/useCase"
import { useClaimCase } from "@/features/cases/hooks/useClaimCase"
import { caseDisplayStatusBadgeVariant } from "@/features/cases/types"
import { CaseDocumentRequirementsPanel } from "@/features/documentRequirements/components/CaseDocumentRequirementsPanel"

/**
 * Case detail shell (PRD1042-1794 DRC usability / US 16.22).
 *
 * The operational way into a case's documents: Case list → this screen → the documents panel. The
 * page renders the same CaseDocumentRequirementsPanel the standalone deep-link page uses, passing
 * the case id as the business object id, so upload/review and catalogue resolution are identical.
 *
 * ── SINGLE SURFACE FOR NOW ─────────────────────────────────────────────────────────────────
 * US 16.22 frames the case-document surface as one section of a Case detail screen. Documents is
 * the only section today, so the panel is rendered directly rather than wrapped in a lone-tab
 * chrome that reads like a dead button. When a second section lands (checklist, parties, terms)
 * a <Tabs> shell can be reintroduced around the panels.
 */
export default function CaseDetailPage() {
  const { t } = useTranslation("cases")
  const { caseId: caseIdParam } = useParams<{ caseId: string }>()
  const caseId = isUuidRouteParam(caseIdParam) ? caseIdParam : undefined

  const { data, isLoading, isError, error } = useCase(caseId)
  const claimCase = useClaimCase()

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
        <div className="flex items-center justify-between">
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
          {data.owner_user_id === null && (
            <Button
              data-testid="case-take-over-button"
              disabled={claimCase.isPending}
              onClick={() =>
                claimCase.mutate(data.id, {
                  onSuccess: () => toast.success(t("detail.takeOverSuccess")),
                  onError: err => showApiError(err, t),
                })
              }
            >
              {t("detail.takeOver")}
            </Button>
          )}
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

      {/* case_type is the resolution key for the document set (PRD1042-1794 DRC usability); the case
          object is loaded here, so the panel is handed the type rather than re-fetching it. */}
      <CaseDocumentRequirementsPanel
        businessObjectId={data.id}
        caseType={data.case_type}
      />
    </div>
  )
}
