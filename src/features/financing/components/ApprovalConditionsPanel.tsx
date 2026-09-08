import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import { formatDate } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { ApprovalConditionStateSchema } from "@/features/financing/api/schema"
import { covenantStateBadgeVariant } from "@/features/financing/types"
import {
  useAddApprovalCondition,
  useApprovalConditions,
  useRequestConditionWaiver,
  useSettleApprovalCondition,
} from "@/features/financing/hooks/useApprovalConditions"

type Props = { caseId: string }

/**
 * **Approval Conditions** on a financing — US 1.21.
 *
 * ── SETTLING IS IMMEDIATE; WAIVING IS NOT ──────────────────────────────────────────────────────
 * `POST .../settle` returns the condition, so settling takes effect at once — the condition was met
 * and the record says so. `POST .../waive` returns a **`GovernedActionResponse`**: a waiver needs a
 * second pair of eyes before it applies, which is what the spec means by *"condition waivers must
 * require elevated approval and audit logging"*.
 *
 * That difference is the thing this screen must not blur. Requesting a waiver leaves the condition
 * **open** and says an approval has been requested; it never draws the row as waived. Showing it
 * waived would tell the user a control had been lifted when it has not.
 *
 * A waiver is also time-boxed — `waiver_expiry` is required — so it is asked for, not defaulted.
 *
 * ── `all_settled` IS READ, NEVER RECOMPUTED ────────────────────────────────────────────────────
 * Epic 3 gives fulfilment evaluation to Conditions Management and has the financing merely consume
 * the aggregated signal. So the readiness line comes from the response's own flag rather than from
 * counting the rows on screen.
 */
export function ApprovalConditionsPanel({ caseId }: Props) {
  const { t } = useTranslation("financing")
  const conditions = useApprovalConditions(caseId)
  const add = useAddApprovalCondition()
  const settle = useSettleApprovalCondition()
  const waive = useRequestConditionWaiver()

  const [isAdding, setAdding] = useState(false)
  const [text, setText] = useState("")
  const [dueDate, setDueDate] = useState<string>("")
  const [waivingId, setWaivingId] = useState<string | null>(null)
  const [waiverReason, setWaiverReason] = useState("")
  const [waiverExpiry, setWaiverExpiry] = useState<string>("")

  if (conditions.isLoading) return <Skeleton className="h-40 w-full" />

  if (conditions.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="approval-conditions-error"
      >
        {resolveApiErrorMessage(conditions.error, t)}
      </p>
    )
  }

  const rows = conditions.data?.conditions ?? []

  return (
    <section className="flex flex-col gap-3" data-testid="approval-conditions">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{t("conditions.title")}</h3>
          {conditions.data !== undefined && (
            <Badge
              variant={conditions.data.all_settled ? "default" : "secondary"}
              data-testid="approval-conditions-readiness"
            >
              {/* The response's own flag — not a count of the rows above. */}
              {conditions.data.all_settled
                ? t("conditions.allSettled")
                : t("conditions.openCount", {
                    count: conditions.data.open_count,
                  })}
            </Badge>
          )}
        </div>
        {!isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="approval-condition-add-button"
            onClick={() => setAdding(true)}
          >
            {t("conditions.add")}
          </Button>
        )}
      </div>

      {rows.length === 0 && !isAdding && (
        <p
          className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground"
          data-testid="approval-conditions-empty"
        >
          {t("conditions.empty")}
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("conditions.columns.condition")}</TableHead>
                <TableHead>{t("conditions.columns.step")}</TableHead>
                <TableHead>{t("conditions.columns.dueDate")}</TableHead>
                <TableHead>{t("conditions.columns.state")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(condition => (
                <TableRow
                  key={condition.id}
                  data-testid={`approval-condition-row-${condition.id}`}
                >
                  <TableCell>{condition.condition_text}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {condition.step_reference ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(condition.due_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={covenantStateBadgeVariant(condition.state)}>
                      {t(`covenantState.${condition.state}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {condition.state ===
                      ApprovalConditionStateSchema.enum.open && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          data-testid={`approval-condition-settle-${condition.id}`}
                          disabled={settle.isPending}
                          onClick={() =>
                            settle.mutate(
                              { caseId, conditionId: condition.id },
                              {
                                onSuccess: () =>
                                  toast.success(t("conditions.settled")),
                                onError: err => showApiError(err, t),
                              }
                            )
                          }
                        >
                          {t("conditions.settle")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-testid={`approval-condition-waive-${condition.id}`}
                          onClick={() => setWaivingId(condition.id)}
                        >
                          {t("conditions.waive")}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isAdding && (
        <div
          className="flex flex-col gap-3 rounded-lg border p-4"
          data-testid="approval-condition-add-form"
        >
          <div>
            <Label htmlFor="condition-text" className="mb-1.5">
              {t("conditions.fields.text")}
            </Label>
            <Input
              id="condition-text"
              value={text}
              data-testid="approval-condition-text"
              onChange={e => setText(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5">{t("conditions.fields.dueDate")}</Label>
            {/* A condition is something still to be done, so its due date is in the future —
                floored at today per date-inputs.md §4's forward-looking case. */}
            <DatePicker
              data-testid="approval-condition-due-date"
              value={dueDate === "" ? undefined : dueDate}
              minDate={new Date()}
              onChange={v => setDueDate(v ?? "")}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="approval-condition-add-cancel"
              onClick={() => setAdding(false)}
            >
              {t("conditions.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="approval-condition-add-submit"
              disabled={add.isPending || text.trim() === "" || dueDate === ""}
              onClick={() =>
                add.mutate(
                  {
                    caseId,
                    condition_text: text.trim(),
                    due_date: dueDate,
                    step_reference: null,
                  },
                  {
                    onSuccess: () => {
                      setAdding(false)
                      setText("")
                      setDueDate("")
                    },
                    onError: err => showApiError(err, t),
                  }
                )
              }
            >
              {t("conditions.addSubmit")}
            </Button>
          </div>
        </div>
      )}

      {waivingId !== null && (
        <div
          className="flex flex-col gap-3 rounded-lg border p-4"
          data-testid="approval-condition-waive-form"
        >
          {/* Said before the request is sent: this does not lift the condition, it asks someone
              else to. Drawing it as waived would misreport a control as removed. */}
          <Alert data-testid="approval-condition-waive-notice">
            <AlertTitle>{t("conditions.waiver.title")}</AlertTitle>
            <AlertDescription>
              {t("conditions.waiver.description")}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="waiver-reason" className="mb-1.5">
              {t("conditions.waiver.reason")}
            </Label>
            <Input
              id="waiver-reason"
              value={waiverReason}
              data-testid="approval-condition-waiver-reason"
              onChange={e => setWaiverReason(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5">{t("conditions.waiver.expiry")}</Label>
            {/* Required by the contract — a waiver is time-boxed, never open-ended. */}
            <DatePicker
              data-testid="approval-condition-waiver-expiry"
              value={waiverExpiry === "" ? undefined : waiverExpiry}
              minDate={new Date()}
              onChange={v => setWaiverExpiry(v ?? "")}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="approval-condition-waiver-cancel"
              onClick={() => setWaivingId(null)}
            >
              {t("conditions.cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="approval-condition-waiver-submit"
              disabled={
                waive.isPending ||
                waiverReason.trim() === "" ||
                waiverExpiry === ""
              }
              onClick={() =>
                waive.mutate(
                  {
                    caseId,
                    conditionId: waivingId,
                    reason: waiverReason.trim(),
                    waiver_expiry: waiverExpiry,
                  },
                  {
                    onSuccess: () => {
                      toast.success(t("conditions.waiver.requested"))
                      setWaivingId(null)
                      setWaiverReason("")
                      setWaiverExpiry("")
                    },
                    onError: err => showApiError(err, t),
                  }
                )
              }
            >
              {t("conditions.waiver.submit")}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
