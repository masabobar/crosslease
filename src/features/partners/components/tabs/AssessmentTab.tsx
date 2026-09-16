import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { TableEmptyState } from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { AddAssessmentDialog } from "@/features/partners/components/AddAssessmentDialog"
import {
  useCancelAssessment,
  usePartnerAssessments,
} from "@/features/partners/hooks/useAssessments"
import type { Assessment } from "@/features/partners/api/assessmentSchema"

/**
 * Partner detail → **Assessment**.
 *
 * The credit-agency and internal reports held against a party, newest first. Each report is one
 * source type (CREFO, Schufa, an internal rating) on one date, with whatever attributes that
 * source defines — which is why a row's values are rendered from the record rather than from a
 * fixed set of columns.
 *
 * ── CANCELLED, NOT DELETED ─────────────────────────────────────────────────────────────────────
 * `POST .../cancel` takes a reason and the record stays. An assessment that informed a decision
 * has to remain readable afterwards, so a cancelled one is struck through and keeps its reason on
 * screen rather than disappearing from the history.
 */
export function AssessmentTab({ partnerId }: { partnerId: string }) {
  const { t } = useTranslation("partners")
  const assessments = usePartnerAssessments(partnerId)
  const cancel = useCancelAssessment()

  const [isAdding, setAdding] = useState(false)
  const [cancelling, setCancelling] = useState<Assessment | null>(null)
  const [reason, setReason] = useState("")

  const items = assessments.data?.items ?? []

  return (
    <section
      className="flex flex-col gap-4"
      data-testid="partner-assessment-tab"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{t("assessment.heading")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("assessment.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="partner-assessment-add"
          onClick={() => setAdding(true)}
        >
          <Plus size={16} />
          {t("assessment.add")}
        </Button>
      </div>

      {assessments.isLoading && <Skeleton className="h-40 w-full" />}

      {assessments.isError && (
        <p
          className="text-sm text-destructive"
          data-testid="partner-assessment-error"
        >
          {resolveApiErrorMessage(assessments.error, t)}
        </p>
      )}

      {!assessments.isLoading && !assessments.isError && items.length === 0 && (
        <div className="rounded-lg border">
          <TableEmptyState
            title={t("assessment.empty.title")}
            description={t("assessment.empty.description")}
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map(record => {
          const isCancelled = record.cancelled_at !== null
          return (
            <article
              key={record.id}
              className={cn(
                "rounded-lg border p-4",
                isCancelled && "bg-muted/40"
              )}
              data-testid={`partner-assessment-${record.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    className={cn("font-medium", isCancelled && "line-through")}
                  >
                    {record.source_type_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("assessment.reportedOn", {
                      date: formatDate(record.report_date),
                    })}
                    {record.source_reference !== null &&
                      ` · ${record.source_reference}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isCancelled ? (
                    <Badge variant="secondary" className="font-normal">
                      {t("assessment.cancelled")}
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid={`partner-assessment-cancel-${record.id}`}
                      onClick={() => {
                        setCancelling(record)
                        setReason("")
                      }}
                    >
                      {t("assessment.cancelAction")}
                    </Button>
                  )}
                </div>
              </div>

              {/* The attributes this source defines, as the record carries them. A value the
                  agency did not supply is its own answer — "no value" is a different fact from
                  "nobody filled this in", and the record keeps the two apart. */}
              {record.values.length > 0 && (
                <dl className="mt-3 grid gap-x-8 gap-y-2 border-t pt-3 text-sm sm:grid-cols-3">
                  {record.values.map(value => (
                    <div key={value.attribute_id}>
                      <dt className="text-xs text-muted-foreground">
                        {value.attribute_name}
                      </dt>
                      <dd>
                        {value.no_value_supplied
                          ? t("assessment.noValueSupplied")
                          : (value.value_number ?? value.value_text ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {record.context_note !== null && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {record.context_note}
                </p>
              )}

              {isCancelled && (
                <p
                  className="mt-3 text-xs text-muted-foreground"
                  data-testid={`partner-assessment-cancel-reason-${record.id}`}
                >
                  {t("assessment.cancelledOn", {
                    when: formatDateTime(record.cancelled_at as string),
                    reason: record.cancel_reason ?? "—",
                  })}
                </p>
              )}
            </article>
          )
        })}
      </div>

      {isAdding && (
        <AddAssessmentDialog partnerId={partnerId} onOpenChange={setAdding} />
      )}

      <AlertDialog
        open={cancelling !== null}
        onOpenChange={open => {
          if (!open) setCancelling(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("assessment.cancelConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("assessment.cancelConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={reason}
            data-testid="partner-assessment-cancel-reason-input"
            placeholder={t("assessment.cancelConfirm.reasonPlaceholder")}
            onChange={event => setReason(event.target.value)}
          />

          <AlertDialogFooter>
            <AlertDialogCancel>{t("assessment.keep")}</AlertDialogCancel>
            <AlertDialogAction
              data-testid="partner-assessment-cancel-confirm"
              disabled={cancel.isPending || reason.trim() === ""}
              onClick={() =>
                cancelling !== null &&
                cancel.mutate(
                  {
                    partnerId,
                    assessmentId: cancelling.id,
                    reason: reason.trim(),
                  },
                  {
                    onSuccess: () => {
                      setCancelling(null)
                      toast.success(t("assessment.cancelled"))
                    },
                    onError: error => showApiError(error, t),
                  }
                )
              }
            >
              {t("assessment.cancelAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
