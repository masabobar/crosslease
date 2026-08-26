import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
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
import { useLcObligations } from "@/features/lc/hooks/useLcObligations"
import { LcObligationUploadButton } from "@/features/lc/components/LcObligationUploadButton"
import type { LCObligationItem } from "@/features/lc/api/schema"

// The LC vocabulary the backend maps to before sending (`_LC_STATUS_MAP`), not the internal one. An
// unmapped status falls through to the neutral style rather than rendering unstyled.
const LC_STATUS_CLASSES: Record<string, string> = {
  outstanding: "bg-muted text-muted-foreground",
  uploaded: "bg-warning/10 text-warning",
  provided: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
}

/**
 * D-12 — a leasing company's own document obligations for one case (PRD1042-1796 item 9): "what is
 * still needed for that company's own cases and whether it has arrived".
 *
 * ── WHAT THIS SCREEN MUST NOT SHOW, AND WHY IT CANNOT ──────────────────────────────────────
 * Item 9 forbids the catalogue, the layers, the conditions, which layer won, and whether a
 * requirement blocks. None of it is rendered here — and none of it is even received: the backend's
 * LCObligationItem carries only the document type, whether it is required, its status, whether the
 * company still has to act, and an opaque requirement handle. So this is not a screen that filters
 * bank-internal detail out; it is one that never has it. That is deliberate, per "hiding a control is
 * never the control".
 *
 * `is_mandatory` is rendered as Required / Optional — what the company must send. Never as blocking.
 * Under CR PRD1042-1794 membership carries "required", so required and blocking are derived from one
 * fact; the difference is what is said. "We need this document" is item 9's own "what is still
 * needed". "Your case is stuck on this" is the bank-internal framing it forbids, so there is no
 * blocking language, no count of what is holding the case, and no ordering by urgency.
 *
 * ── UPLOAD (PRD1042-1794) ──────────────────────────────────────────────────────────────────
 * The backend now names which catalogue requirement each obligation fulfils
 * (`requirement_definition_id`) — an opaque handle to this screen, nothing of the catalogue is
 * rendered from it. That is what lets a leasing company upload against an obligation via the shared
 * POST /cases/{case_id}/documents (its guard accepts LC_OBLIGATIONS). The control is offered only
 * where the company still has to act (`action_needed`), and on success the obligations surface is
 * refetched so the row flips to received. The endpoint, the upload hook's shape and the MIME/size
 * guard are reused from the bank-side CaseDocumentRequirementsPage so the two stay the same product.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * No Figma frame. Built on instruction from this application's existing language, mirroring the
 * bank-side CaseDocumentRequirementsPage so the two stay recognisably the same product. The frames
 * are still owed.
 */
export default function LcCaseDocumentsPage() {
  const { t } = useTranslation("lc")
  const { businessObjectId: businessObjectIdParam } = useParams<{
    businessObjectId: string
  }>()
  const businessObjectId = isUuidRouteParam(businessObjectIdParam)
    ? businessObjectIdParam
    : undefined

  const { data, isPending, isError, error } = useLcObligations(businessObjectId)

  if (!businessObjectId) {
    return (
      <div className="p-8">
        <Alert variant="destructive" data-testid="lc-case-documents-bad-id">
          <AlertTitle>{t("caseDocuments.badId.title")}</AlertTitle>
          <AlertDescription>
            {t("caseDocuments.badId.description")}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isPending) {
    return (
      <div
        className="p-8 flex flex-col gap-4"
        data-testid="lc-case-documents-loading"
      >
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p
          data-testid="lc-case-documents-error"
          className="text-sm text-destructive py-8 text-center"
        >
          {resolveApiErrorMessage(error, t)}
        </p>
      </div>
    )
  }

  return (
    <div
      className="p-8 flex flex-col gap-8"
      data-testid="lc-case-documents-page"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium text-foreground">
          {t("caseDocuments.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {data.documents_status_summary}
        </p>
      </div>

      <div className="flex flex-col gap-3" data-testid="lc-case-documents-list">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t("caseDocuments.obligations.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("caseDocuments.obligations.caption")}
          </p>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("caseDocuments.columns.document")}</TableHead>
                <TableHead>{t("caseDocuments.columns.required")}</TableHead>
                <TableHead>{t("caseDocuments.columns.status")}</TableHead>
                <TableHead>{t("caseDocuments.columns.upload")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.obligations.map(item => (
                <ObligationRow
                  key={item.requirement_definition_id}
                  item={item}
                  businessObjectId={businessObjectId}
                />
              ))}
            </TableBody>
          </Table>

          {data.obligations.length === 0 && (
            <TableEmptyState
              title={t("caseDocuments.obligations.empty.title")}
              description={t("caseDocuments.obligations.empty.description")}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ObligationRow({
  item,
  businessObjectId,
}: {
  item: LCObligationItem
  businessObjectId: string
}) {
  const { t } = useTranslation("lc")

  return (
    <TableRow
      data-testid={`lc-case-documents-row-${item.requirement_definition_id}`}
    >
      <TableCell className="font-medium">{item.document_type_name}</TableCell>
      <TableCell>
        {/* What the company must send — not whether the case is blocked. */}
        {item.is_mandatory
          ? t("caseDocuments.required")
          : t("caseDocuments.optional")}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            LC_STATUS_CLASSES[item.fulfilment_status] ??
              "bg-muted text-muted-foreground"
          )}
          data-testid={`lc-case-documents-status-${item.requirement_definition_id}`}
        >
          {t(
            `caseDocuments.statuses.${item.fulfilment_status}` as "caseDocuments.statuses.outstanding",
            { defaultValue: item.fulfilment_status }
          )}
        </span>
      </TableCell>
      <TableCell>
        {/* Offered only where the company still has to act — keyed off action_needed rather than the
            status vocabulary so a status added on the backend does not hide or mis-offer the control.
            The requirement handle is opaque here: it names what the upload fulfils, nothing more. */}
        {item.action_needed ? (
          <LcObligationUploadButton
            businessObjectId={businessObjectId}
            requirementDefinitionId={item.requirement_definition_id}
            requirementLabel={item.document_type_name}
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("caseDocuments.noAction")}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
