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
import { getLcObligationDocumentUrl } from "@/features/lc/api/lcPortalApi"
import { useLcObligations } from "@/features/lc/hooks/useLcObligations"
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
 * still needed for that company's own cases and whether it has arrived, plus the documents the bank
 * has released".
 *
 * ── WHAT THIS SCREEN MUST NOT SHOW, AND WHY IT CANNOT ──────────────────────────────────────
 * Item 9 forbids the catalogue, the layers, the conditions, which layer won, and whether a
 * requirement blocks. None of it is rendered here — and none of it is even received: the backend's
 * LCObligationItem carries only the document type, whether it is required, its status, its origin
 * and the document that met it. So this is not a screen that filters bank-internal detail out; it is
 * one that never has it. That is deliberate, per "hiding a control is never the control".
 *
 * `is_mandatory` is rendered as Required / Optional — what the company must send. Never as blocking.
 * Under CR PRD1042-1794 membership carries "required", so required and blocking are derived from one
 * fact; the difference is what is said. "We need this document" is item 9's own "what is still
 * needed". "Your case is stuck on this" is the bank-internal framing it forbids, so there is no
 * blocking language, no count of what is holding the case, and no ordering by urgency.
 *
 * ── NO UPLOAD CONTROL (yet) ────────────────────────────────────────────────────────────────
 * The case-document upload endpoint now exists (POST /cases/{case_id}/documents, and its permission
 * accepts LC_OBLIGATIONS), but it requires a `requirement_definition_id` — and this surface, by item
 * 9's design, does not carry one. LCObligationItem exposes only the document type, whether it is
 * required, its status and origin; the backend deliberately withholds the catalogue's requirement id
 * from a leasing company. So there is nothing to send it, and a button that collected a file with no
 * id to attach it to is the decorative UI `api-first.md` §4 forbids. Wiring LC upload needs the
 * backend to either resolve the requirement from (case, document_type) or add an opaque handle to
 * LCObligationItem — see open-questions.md. The bank-side CaseDocumentRequirementsPage, which does
 * carry requirement_definition_id, has the working upload control.
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

  // The two halves item 9 asks for, split on who produces the document rather than on status: what
  // this company still has to send, and what the bank has released to it.
  const toSend = data.obligations.filter(o => o.document_origin !== "generated")
  const released = data.obligations.filter(
    o => o.document_origin === "generated"
  )

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

      <ObligationSection
        heading={t("caseDocuments.toSend.title")}
        caption={t("caseDocuments.toSend.caption")}
        emptyTitle={t("caseDocuments.toSend.empty.title")}
        emptyDescription={t("caseDocuments.toSend.empty.description")}
        obligations={toSend}
        testId="lc-case-documents-to-send"
      />

      <ObligationSection
        heading={t("caseDocuments.released.title")}
        caption={t("caseDocuments.released.caption")}
        emptyTitle={t("caseDocuments.released.empty.title")}
        emptyDescription={t("caseDocuments.released.empty.description")}
        obligations={released}
        testId="lc-case-documents-released"
      />
    </div>
  )
}

type SectionProps = {
  heading: string
  caption: string
  emptyTitle: string
  emptyDescription: string
  obligations: LCObligationItem[]
  testId: string
}

function ObligationSection({
  heading,
  caption,
  emptyTitle,
  emptyDescription,
  obligations,
  testId,
}: SectionProps) {
  const { t } = useTranslation("lc")

  return (
    <div className="flex flex-col gap-3" data-testid={testId}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("caseDocuments.columns.document")}</TableHead>
              <TableHead>{t("caseDocuments.columns.required")}</TableHead>
              <TableHead>{t("caseDocuments.columns.status")}</TableHead>
              <TableHead>{t("caseDocuments.columns.file")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obligations.map(item => (
              <ObligationRow key={item.document_type_name} item={item} />
            ))}
          </TableBody>
        </Table>

        {obligations.length === 0 && (
          <TableEmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    </div>
  )
}

function ObligationRow({ item }: { item: LCObligationItem }) {
  const { t } = useTranslation("lc")

  return (
    <TableRow data-testid={`lc-case-documents-row-${item.document_type_name}`}>
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
          data-testid={`lc-case-documents-status-${item.document_type_name}`}
        >
          {t(
            `caseDocuments.statuses.${item.fulfilment_status}` as "caseDocuments.statuses.outstanding",
            { defaultValue: item.fulfilment_status }
          )}
        </span>
      </TableCell>
      <TableCell>
        {/* Item 9: a requirement is never shown as met with nothing behind it. The document is
            offered only when the backend actually carries one. */}
        {item.linked_document_id ? (
          <a
            href={getLcObligationDocumentUrl(item.linked_document_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            data-testid={`lc-case-documents-open-${item.document_type_name}`}
          >
            {t("caseDocuments.openDocument")}
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("caseDocuments.noFile")}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
