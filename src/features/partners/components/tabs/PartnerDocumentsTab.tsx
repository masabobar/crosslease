import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
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
import { formatDate } from "@/lib/formatters"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { getCaseDocumentUrl } from "@/features/documentRequirements/api/documentRequirementsApi"
import { usePartnerDocuments } from "@/features/partners/hooks/useAssessments"

/**
 * Partner detail → **Documents**.
 *
 * Documents held against the party itself. The prototype says why they live here rather than on a
 * case — *"kept on the party, it outlives any single case"* — and that is exactly the distinction:
 * a commercial register extract is true of the company, not of one request.
 *
 * The file name is the link, as on the case's own document surface: the media endpoint
 * authenticates from the session cookie, so a plain link is authenticated and no token goes into
 * a URL.
 */
export function PartnerDocumentsTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const documents = usePartnerDocuments(partnerId)
  const items = documents.data?.items ?? []

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="partner-documents-tab"
    >
      <div>
        <h3 className="text-sm font-semibold">
          {t("partnerDocuments.heading")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("partnerDocuments.subtitle")}
        </p>
      </div>

      {documents.isLoading && <Skeleton className="h-40 w-full" />}

      {documents.isError && (
        <p
          className="text-sm text-destructive"
          data-testid="partner-documents-error"
        >
          {resolveApiErrorMessage(documents.error, t)}
        </p>
      )}

      {!documents.isLoading && !documents.isError && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partnerDocuments.columns.document")}</TableHead>
                <TableHead>{t("partnerDocuments.columns.uploaded")}</TableHead>
                <TableHead>{t("partnerDocuments.columns.by")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(row => (
                <TableRow
                  key={row.id}
                  data-testid={`partner-document-${row.id}`}
                >
                  <TableCell>
                    <a
                      href={getCaseDocumentUrl(row.media_object_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      data-testid={`partner-document-open-${row.id}`}
                    >
                      {row.label ??
                        row.file_name ??
                        row.document_type_name ??
                        "—"}
                      <ExternalLink size={13} />
                    </a>
                    {row.document_type_name !== null && (
                      <span className="block text-sm text-muted-foreground">
                        {row.document_type_name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(row.uploaded_at)}
                  </TableCell>
                  <TableCell>{row.uploaded_by_name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <TableEmptyState
              title={t("partnerDocuments.empty.title")}
              description={t("partnerDocuments.empty.description")}
            />
          )}
        </div>
      )}
    </section>
  )
}
