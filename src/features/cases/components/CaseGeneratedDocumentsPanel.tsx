import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import {
  getCombinedDocumentDownloadUrl,
  getGeneratedDocumentUrl,
  getHandoverFileUrl,
} from "@/features/cases/api/casesApi"
import {
  ARISES_AT,
  currentBuild,
  isFrozenOnceProduced,
  isGeneratable,
  isUploadedKind,
  mergeGeneratedRows,
  producedCount,
} from "@/features/cases/generatedDocuments"
import {
  useBuildCombinedDocument,
  useCombinedDocumentHistory,
  useGeneratedDocuments,
} from "@/features/cases/hooks/useCaseDocuments"
import { useGenerateCaseDocument } from "@/features/cases/hooks/useCaseDocuments"

type Props = { caseId: string }

/**
 * The generated half of the case's **Documents** tab — US 1.24 and US 1.27, and the design's
 * "Generated documents", "OS+ TRANSFER FILE" and "MERGE DOCUMENTS" blocks.
 *
 * The uploaded half (required documents, check / reject, Add document) is
 * `CaseDocumentRequirementsPanel`, which sits below this one. They are separate because the design
 * separates them for a real reason, stated on the screen itself: *"Generated documents are created
 * directly from the case data; the rest are uploaded."* One set is produced, the other is received.
 *
 * ── "MISSING" IS THE ABSENCE OF A ROW, NOT A STATUS ────────────────────────────────────────────
 * `GeneratedDocumentRow` carries no status field. A produced document *is* the row, so the table's
 * status column is derived from whether a row exists. Reading a status that the contract does not
 * send would mean inventing one.
 *
 * ── DOWNLOADS ARE LINKS, NOT FETCHES ───────────────────────────────────────────────────────────
 * The media, hand-over-file and combined-document endpoints stream files and declare empty response
 * schemas. Because auth is cookie-borne a plain navigation to them is authenticated, so these are
 * anchors — no token is ever put in a URL and nothing is buffered through JS.
 */
export function CaseGeneratedDocumentsPanel({ caseId }: Props) {
  const { t } = useTranslation("cases")
  const generated = useGeneratedDocuments(caseId)
  const combined = useCombinedDocumentHistory(caseId)
  const generate = useGenerateCaseDocument()
  const build = useBuildCombinedDocument()
  /**
   * The dummy asks for a name before the build. `POST /combined-document` takes **no body**, so the
   * name cannot be sent — the backend derives the filename itself. It is collected and shown
   * because the design asks for it, and the field says plainly that the platform names the file;
   * inventing a body field would fail, and dropping the field would lose the design's intent.
   */
  const [name, setName] = useState("")

  if (generated.isLoading) return <Skeleton className="h-56 w-full" />

  if (generated.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="case-generated-documents-error"
      >
        {resolveApiErrorMessage(generated.error, t)}
      </p>
    )
  }

  const entries = mergeGeneratedRows(generated.data?.documents ?? [])
  const build_ = currentBuild(combined.data?.builds ?? [])

  return (
    <div className="flex flex-col gap-6" data-testid="case-generated-documents">
      <section>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {t("documents.generated.title")}
          </h3>
          <Badge variant="outline" data-testid="case-generated-count">
            {t("documents.generated.count", {
              produced: producedCount(entries),
              total: entries.length,
            })}
          </Badge>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("documents.generated.subtitle")}
        </p>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("documents.generated.columns.type")}</TableHead>
                <TableHead>
                  {t("documents.generated.columns.arisesAt")}
                </TableHead>
                <TableHead>{t("documents.generated.columns.status")}</TableHead>
                <TableHead>
                  {t("documents.generated.columns.filename")}
                </TableHead>
                <TableHead>
                  {t("documents.generated.columns.produced")}
                </TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow
                  key={entry.code}
                  data-testid={`case-generated-row-${entry.code}`}
                >
                  <TableCell>
                    {/* Unconstrained wire string: the raw code is the fallback label, so a kind
                        this build has never seen still reads as itself. */}
                    {t(
                      `documents.generated.types.${entry.code}` as "documents.generated.types.cover_sheet",
                      { defaultValue: entry.code }
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {entry.kind === null ? "—" : ARISES_AT[entry.kind]}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.row === null ? "outline" : "default"}
                      data-testid={`case-generated-status-${entry.code}`}
                    >
                      {entry.row === null
                        ? t("documents.generated.missing")
                        : t("documents.generated.present")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {entry.row === null ? (
                      "—"
                    ) : (
                      <a
                        className="underline underline-offset-2"
                        href={getGeneratedDocumentUrl(entry.row.media_id)}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={`case-generated-download-${entry.code}`}
                      >
                        {entry.row.file_name}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.row === null
                      ? "—"
                      : formatDateTime(entry.row.produced_at_local)}
                  </TableCell>
                  <TableCell>
                    {/* Only kinds with a generator endpoint get a button. The design also draws an
                        amortisation schedule and a release declaration; neither has an endpoint, so
                        neither is offered here. */}
                    {/* Three different answers, as the dummy has them. A document produced
                        outside the platform is uploaded, never generated. One that freezes at
                        step 18 offers a disabled reason rather than a Regenerate that would
                        contradict the freeze. Everything else generates. */}
                    {entry.kind !== null && isUploadedKind(entry.kind) ? (
                      <span
                        className="text-xs text-muted-foreground"
                        data-testid={`case-generated-uploaded-${entry.code}`}
                      >
                        {t("documents.generated.producedOutside")}
                      </span>
                    ) : entry.kind !== null &&
                      isFrozenOnceProduced(entry.kind) &&
                      entry.row !== null ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        data-testid={`case-generated-frozen-${entry.code}`}
                      >
                        {t("documents.generated.cannotProduceAgain")}
                      </Button>
                    ) : (
                      entry.kind !== null &&
                      isGeneratable(entry.kind) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`case-generate-${entry.code}`}
                          disabled={generate.isPending}
                          onClick={() =>
                            generate.mutate(
                              { caseId, kind: entry.kind! },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    t("documents.generated.produced")
                                  ),
                                onError: err => showApiError(err, t),
                              }
                            )
                          }
                        >
                          {entry.row === null
                            ? t("documents.generated.generate")
                            : t("documents.generated.regenerate")}
                        </Button>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ── OS+ transfer file (US 1.25) ── */}
        <section
          className="rounded-lg border p-4"
          data-testid="case-handover-file"
        >
          <h3 className="text-sm font-semibold">
            {t("documents.handover.title")}
          </h3>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            {t("documents.handover.subtitle")}
          </p>
          {/* NOTE: raw <a> — a file the browser downloads. shadcn Button renders a <button>, which
              cannot carry an href, so the button styling is applied to the anchor instead. */}
          <a
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            href={getHandoverFileUrl(caseId)}
            target="_blank"
            rel="noreferrer"
            data-testid="case-handover-export"
          >
            {t("documents.handover.export")}
          </a>
        </section>

        {/* ── Combined document (US 1.27) ── */}
        <section
          className="rounded-lg border p-4"
          data-testid="case-combined-document"
        >
          <h3 className="text-sm font-semibold">
            {t("documents.combined.title")}
          </h3>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            {t("documents.combined.subtitle")}
          </p>

          {build_ !== null && (
            <p
              className="mb-3 text-xs text-muted-foreground"
              data-testid="case-combined-current"
            >
              {t("documents.combined.current", {
                count: build_.document_count,
                built: formatDateTime(build_.built_at),
              })}
            </p>
          )}

          <div className="mb-3">
            <Label htmlFor="combined-name" className="mb-1.5">
              {t("documents.combined.nameLabel")}
            </Label>
            <Input
              id="combined-name"
              value={name}
              data-testid="case-combined-name"
              onChange={e => setName(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("documents.combined.nameHelp")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              data-testid="case-combined-build"
              disabled={build.isPending || name.trim() === ""}
              onClick={() =>
                build.mutate(
                  { caseId },
                  {
                    onSuccess: () =>
                      toast.success(t("documents.combined.built")),
                    onError: err => showApiError(err, t),
                  }
                )
              }
            >
              {build_ === null
                ? t("documents.combined.create")
                : t("documents.combined.rebuild")}
            </Button>

            {build_ !== null && (
              <a
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" })
                )}
                href={getCombinedDocumentDownloadUrl(caseId)}
                target="_blank"
                rel="noreferrer"
                data-testid="case-combined-download"
              >
                {t("documents.combined.download")}
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
