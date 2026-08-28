import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableEmptyState } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { getCaseDocumentUrl } from "@/features/documentRequirements/api/documentRequirementsApi"
import { useCaseDocumentRequirements } from "@/features/documentRequirements/hooks/useCaseDocumentRequirements"
import { useDocumentRequirementCatalogList } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogList"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import {
  FRONT_OFFICE_ROLE,
  BACK_OFFICE_ROLE,
  LEASING_COMPANY_USER_ROLE,
} from "@/features/users/types"
import { CaseDocumentUploadButton } from "@/features/documentRequirements/components/CaseDocumentUploadButton"
import { CaseDocumentReviewActions } from "@/features/documentRequirements/components/CaseDocumentReviewActions"
import type { RuntimeRequirementItem } from "@/features/documentRequirements/api/schema"

// PRD1042-1794 item 6 — a requirement that has no acceptable document yet can be uploaded against.
// Keyed off the row's own status so a status added on the backend simply does not offer the control
// rather than mis-offering it.
const UPLOADABLE_STATUSES = new Set(["missing", "rejected"])

// PRD1042-1794 A10/B3 — a document a leasing company or front office has uploaded is awaiting the
// bank's review; that is the only status the bank acts on.
const REVIEWABLE_STATUSES = new Set(["uploaded_pending_review"])

// CR-1794 A9/A10 — who may do what on a case document. Front office and leasing companies upload;
// back office reviews (check/reject); bank admins and everyone else neither. Enforced on the
// backend by permission; mirrored here so the UI never offers a control the caller cannot use.
const UPLOAD_ROLES = new Set<string>([
  FRONT_OFFICE_ROLE,
  LEASING_COMPANY_USER_ROLE,
])
const REVIEW_ROLES = new Set<string>([BACK_OFFICE_ROLE])

// Keyed by the backend's FulfilmentStatus values. A status added there falls through to the neutral
// default rather than rendering unstyled, which is why this is a lookup and not a switch.
const FULFILMENT_STATUS_CLASSES: Record<string, string> = {
  missing: "bg-muted text-muted-foreground",
  uploaded_pending_review: "bg-warning/10 text-warning",
  fulfilled: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

/**
 * D-11 — what a case requires (PRD1042-1796 item 5): "every requirement that applies, whether each
 * has been met, and which of the missing ones are holding the case."
 *
 * ── EXTRACTED FROM CaseDocumentRequirementsPage (PRD1042-1794 DRC usability) ────────────────
 * This is the case-document surface's reusable content, lifted out of the standalone page so the
 * Case detail screen's Documents tab can render it (US 16.22 puts the surface inside a Case detail
 * screen, not on a page of its own). It takes the business object id as a prop rather than reading
 * the route, so the same body serves both the deep-link page (which passes the route param) and the
 * tab (which passes the case id). The catalogue auto-resolution and role-gated upload/review
 * controls are unchanged — only where they render moved.
 *
 * ── WHY NO CATALOGUE IS ASKED FOR, AND HOW THE SET IS KEYED ─────────────────────────────────
 * The catalogue is not selected: one catalogue per bank (CR-DRC A2) means there is nothing to
 * choose, so the single global default IS the case's catalogue. The requirement set is keyed by the
 * case's own `case_type` (PRD1042-1794 DRC usability) — the runtime surface returns the requirements
 * that apply to that type, and every row carries the case types it applies to. `caseType` is passed
 * in by the caller that has the case object (Case detail passes the loaded case's type); it is
 * optional so the surface stays disabled, rather than mis-resolving, until it is known.
 */
export function CaseDocumentRequirementsPanel({
  businessObjectId,
  caseType,
  uploadDisabled = false,
  uploadDisabledReason,
}: {
  businessObjectId: string
  caseType?: string
  // Set when a bank user is viewing a case they have not taken over yet: uploading is blocked until
  // the case is claimed (PRD1042-1794). The upload controls render disabled with the reason.
  uploadDisabled?: boolean
  uploadDisabledReason?: string
}) {
  const { t } = useTranslation("documentRequirements")

  const { data: currentUser } = useCurrentUser()
  // One catalogue per bank, so the single global default IS the case's catalogue — resolved, never
  // selected. A tenant with none is a real state, not an error.
  const {
    data: catalogs,
    isPending: isCatalogsLoading,
    isError: isCatalogsError,
    error: catalogsError,
  } = useDocumentRequirementCatalogList(currentUser?.tenant_id ?? undefined, {})
  const catalogId = catalogs?.items?.[0]?.id

  const {
    data: surface,
    isPending,
    isError,
    error,
  } = useCaseDocumentRequirements(catalogId, businessObjectId, caseType)

  if (isCatalogsLoading || (catalogId && caseType && isPending)) {
    return (
      <div className="flex flex-col gap-4" data-testid="case-documents-loading">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isCatalogsError) {
    return (
      <p
        data-testid="case-documents-catalogs-error"
        className="text-sm text-destructive py-8 text-center"
      >
        {resolveApiErrorMessage(catalogsError, t)}
      </p>
    )
  }

  // No catalogue for the bank yet: the case requires nothing because nothing has been defined. That
  // is a different statement from "this case is complete", so it must not render as an empty table.
  if (!catalogId) {
    return (
      <Alert data-testid="case-documents-no-catalogue">
        <AlertTitle>{t("caseDocuments.noCatalogue.title")}</AlertTitle>
        <AlertDescription>
          {t("caseDocuments.noCatalogue.description")}
        </AlertDescription>
      </Alert>
    )
  }

  if (isError || !surface) {
    return (
      <p
        data-testid="case-documents-error"
        className="text-sm text-destructive py-8 text-center"
      >
        {resolveApiErrorMessage(error, t)}
      </p>
    )
  }

  // "Which of the missing ones are holding the case" — the backend already derives blocking from
  // mandatory membership and the row's status, so this is a filter rather than a second judgement.
  const blocking = surface.requirements.filter(r => r.is_blocking)

  // Capability, from the signed-in user's role. The backend is the authority (permission-gated); the
  // UI only avoids offering a control the caller could not use — a back-office user must not see an
  // Upload button, a front-office user must not see the review actions.
  const role = currentUser?.role ?? ""
  const canUpload = UPLOAD_ROLES.has(role)
  const canReview = REVIEW_ROLES.has(role)

  return (
    <div className="flex flex-col gap-8" data-testid="case-documents-panel">
      <p className="text-sm text-muted-foreground">
        {t(
          `caseDocuments.summaries.${surface.completeness_summary}` as "caseDocuments.summaries.missing_required_documents",
          { defaultValue: surface.completeness_summary }
        )}
      </p>

      {blocking.length > 0 && (
        <Alert variant="destructive" data-testid="case-documents-blocking">
          <AlertTitle>{t("caseDocuments.blocking.title")}</AlertTitle>
          <AlertDescription>
            <p>{t("caseDocuments.blocking.description")}</p>
            <ul className="mt-2 list-disc pl-4">
              {blocking.map(item => (
                <li
                  key={item.requirement_definition_id}
                  data-testid={`case-documents-blocking-${item.requirement_definition_id}`}
                >
                  {item.document_type_name}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("caseDocuments.columns.documentType")}</TableHead>
              <TableHead>{t("caseDocuments.columns.requirement")}</TableHead>
              <TableHead>{t("caseDocuments.columns.classification")}</TableHead>
              <TableHead>{t("caseDocuments.columns.caseTypes")}</TableHead>
              <TableHead>{t("caseDocuments.columns.status")}</TableHead>
              <TableHead>{t("caseDocuments.columns.document")}</TableHead>
              <TableHead>{t("caseDocuments.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surface.requirements.map(item => (
              <RequirementRow
                key={item.requirement_definition_id}
                item={item}
                catalogId={catalogId}
                businessObjectId={businessObjectId}
                canUpload={canUpload}
                canReview={canReview}
                uploadDisabled={uploadDisabled}
                uploadDisabledReason={uploadDisabledReason}
              />
            ))}
          </TableBody>
        </Table>

        {surface.requirements.length === 0 && (
          <TableEmptyState
            title={t("caseDocuments.empty.title")}
            description={t("caseDocuments.empty.description")}
          />
        )}
      </div>
    </div>
  )
}

function RequirementRow({
  item,
  catalogId,
  businessObjectId,
  canUpload,
  canReview,
  uploadDisabled,
  uploadDisabledReason,
}: {
  item: RuntimeRequirementItem
  catalogId: string
  businessObjectId: string
  canUpload: boolean
  canReview: boolean
  uploadDisabled?: boolean
  uploadDisabledReason?: string
}) {
  const { t } = useTranslation("documentRequirements")
  const notApplicable = t("caseDocuments.notApplicable")
  // Upload is offered only to an upload-capable role on a row that still needs a document; review
  // only to the bank on a row awaiting review. A row shows at most one action.
  const showUpload =
    canUpload && UPLOADABLE_STATUSES.has(item.fulfilment_status)
  const showReview =
    canReview && REVIEWABLE_STATUSES.has(item.fulfilment_status)

  return (
    <TableRow
      data-testid={`case-documents-row-${item.requirement_definition_id}`}
    >
      <TableCell className="font-medium">{item.document_type_name}</TableCell>
      <TableCell>{item.requirement_code}</TableCell>
      <TableCell>
        {t(
          `requirement.classifications.${item.classification}` as "requirement.classifications.mandatory",
          { defaultValue: item.classification }
        )}
      </TableCell>
      <TableCell>
        {/* The case types this requirement applies to — the axis the set is keyed by. Each row
            carries its own so the surface says which case types it belongs to. */}
        {item.applicable_case_types.length > 0
          ? item.applicable_case_types
              .map(caseType =>
                t(`caseTypes.${caseType}` as "caseTypes.refinancing_request", {
                  defaultValue: caseType,
                })
              )
              .join(", ")
          : notApplicable}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            FULFILMENT_STATUS_CLASSES[item.fulfilment_status] ??
              "bg-muted text-muted-foreground"
          )}
          data-testid={`case-documents-status-${item.requirement_definition_id}`}
        >
          {t(
            `caseDocuments.statuses.${item.fulfilment_status}` as "caseDocuments.statuses.missing",
            { defaultValue: item.fulfilment_status }
          )}
        </span>
        {item.is_blocking && (
          <span className="ml-2 text-xs text-destructive">
            {t("caseDocuments.blocks")}
          </span>
        )}
      </TableCell>
      <TableCell>
        {/* Item 5: the document that met a requirement is openable by whoever works the case, not
            only by whoever uploaded it. The media endpoint authenticates from the session cookie, so
            a plain link is authenticated and no token goes into a URL. */}
        {item.linked_document_id ? (
          <a
            href={getCaseDocumentUrl(item.linked_document_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            data-testid={`case-documents-open-${item.requirement_definition_id}`}
          >
            {t("caseDocuments.openDocument")}
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">{notApplicable}</span>
        )}
      </TableCell>
      <TableCell>
        {showUpload ? (
          <CaseDocumentUploadButton
            catalogId={catalogId}
            businessObjectId={businessObjectId}
            requirementDefinitionId={item.requirement_definition_id}
            requirementLabel={item.document_type_name}
            disabled={uploadDisabled}
            disabledReason={uploadDisabledReason}
          />
        ) : showReview ? (
          <CaseDocumentReviewActions
            catalogId={catalogId}
            businessObjectId={businessObjectId}
            requirementDefinitionId={item.requirement_definition_id}
            requirementLabel={item.document_type_name}
          />
        ) : (
          <span className="text-sm text-muted-foreground">{notApplicable}</span>
        )}
      </TableCell>
    </TableRow>
  )
}
