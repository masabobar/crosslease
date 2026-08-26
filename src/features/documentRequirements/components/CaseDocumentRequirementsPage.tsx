import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
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
import { isUuidRouteParam } from "@/lib/routeParams"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { getCaseDocumentUrl } from "@/features/documentRequirements/api/documentRequirementsApi"
import { useCaseDocumentRequirements } from "@/features/documentRequirements/hooks/useCaseDocumentRequirements"
import { useDocumentRequirementCatalogList } from "@/features/documentRequirements/hooks/useDocumentRequirementCatalogList"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { CaseDocumentUploadButton } from "@/features/documentRequirements/components/CaseDocumentUploadButton"
import type { RuntimeRequirementItem } from "@/features/documentRequirements/api/schema"

// PRD1042-1794 item 6 — a requirement that has no acceptable document yet can be uploaded against.
// Keyed off the row's own status so a status added on the backend simply does not offer the control
// rather than mis-offering it.
const UPLOADABLE_STATUSES = new Set(["missing", "rejected"])

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
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * No Figma frame exists for this screen. Built on instruction, from this application's existing
 * language — the same route shape, header, blocking Alert and table that CaseChecklistPage uses for
 * the workflow runtime surface, which was derived the same way. The layout is an interpretation and
 * the frames are still owed; see `.claude/rules/design-first.md`.
 *
 * ── WHY THE ROUTE CARRIES ONLY AN OBJECT ID ────────────────────────────────────────────────
 * The catalogue is not asked for: item 4 forbids a catalogue selector on a case screen, and one
 * catalogue per bank (CR-DRC A2) means there is nothing to choose. The checkpoint is not asked for
 * either — a process context is not a property of the object, so the surface is read without one and
 * every row carries the contexts it applies to.
 *
 * ── UPLOAD (PRD1042-1794 item 6) ───────────────────────────────────────────────────────────
 * A requirement that is missing or rejected can be uploaded against, via POST /cases/{case_id}/
 * documents (case_id is this object's id). On success the row flips to uploaded_pending_review, so
 * the mutation invalidates this surface's query. PDF and Excel are accepted (a case document is
 * often a spreadsheet); MIME is guarded client-side and enforced by the backend.
 */
export default function CaseDocumentRequirementsPage() {
  const { t } = useTranslation("documentRequirements")
  const { businessObjectId: businessObjectIdParam } = useParams<{
    businessObjectId: string
  }>()
  const businessObjectId = isUuidRouteParam(businessObjectIdParam)
    ? businessObjectIdParam
    : undefined

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
  } = useCaseDocumentRequirements(catalogId, businessObjectId)

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

  if (isCatalogsLoading || (catalogId && isPending)) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="case-documents-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isCatalogsError) {
    return (
      <div className="p-8">
        <p
          data-testid="case-documents-catalogs-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(catalogsError, t)}
        </p>
      </div>
    )
  }

  // No catalogue for the bank yet: the case requires nothing because nothing has been defined. That
  // is a different statement from "this case is complete", so it must not render as an empty table.
  if (!catalogId) {
    return (
      <div className="p-8">
        <Alert data-testid="case-documents-no-catalogue">
          <AlertTitle>{t("caseDocuments.noCatalogue.title")}</AlertTitle>
          <AlertDescription>
            {t("caseDocuments.noCatalogue.description")}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isError || !surface) {
    return (
      <div className="p-8">
        <p
          data-testid="case-documents-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      </div>
    )
  }

  // "Which of the missing ones are holding the case" — the backend already derives blocking from
  // mandatory membership and the row's status, so this is a filter rather than a second judgement.
  const blocking = surface.requirements.filter(r => r.is_blocking)

  return (
    <div className="p-8 flex flex-col gap-8" data-testid="case-documents-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-foreground">
          {t("caseDocuments.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            `caseDocuments.summaries.${surface.completeness_summary}` as "caseDocuments.summaries.missing_required_documents",
            { defaultValue: surface.completeness_summary }
          )}
        </p>
      </div>

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
              <TableHead>{t("caseDocuments.columns.checkpoints")}</TableHead>
              <TableHead>{t("caseDocuments.columns.status")}</TableHead>
              <TableHead>{t("caseDocuments.columns.document")}</TableHead>
              <TableHead>{t("caseDocuments.columns.upload")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surface.requirements.map(item => (
              <RequirementRow
                key={item.requirement_definition_id}
                item={item}
                catalogId={catalogId}
                businessObjectId={businessObjectId}
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
}: {
  item: RuntimeRequirementItem
  catalogId: string
  businessObjectId: string
}) {
  const { t } = useTranslation("documentRequirements")
  const notApplicable = t("caseDocuments.notApplicable")
  const canUpload = UPLOADABLE_STATUSES.has(item.fulfilment_status)

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
        {/* The checkpoints this requirement applies at. Present because the surface is read without
            naming one, so a row has to say where it belongs rather than the page claiming one. */}
        {item.applicable_process_contexts.length > 0
          ? item.applicable_process_contexts
              .map(context =>
                t(
                  `processContexts.${context}` as "processContexts.refinancing_request",
                  { defaultValue: context }
                )
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
        {canUpload ? (
          <CaseDocumentUploadButton
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
