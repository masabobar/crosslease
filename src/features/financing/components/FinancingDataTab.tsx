import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDate, formatDecimalCurrency } from "@/lib/formatters"
import { showApiError } from "@/lib/apiErrorMessage"
import { useUpdateMaintainedValues } from "@/features/financing/hooks/useFinancingDetail"
import type { FinancingDetail } from "@/features/financing/api/financingDetailSchema"

const eur = (value: string | null) =>
  value === null ? null : formatDecimalCurrency(value, EUR_CURRENCY_CODE)

/** A figure the record does not carry reads as not recorded — never as a zero. */
function Figure({ value }: { value: string | null }) {
  const { t } = useTranslation("financing")
  if (value === null)
    return (
      <span className="font-normal italic text-muted-foreground">
        {t("detail.notRecorded")}
      </span>
    )
  return <>{value}</>
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b px-4 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right font-medium tabular-nums">
        <Figure value={value} />
      </span>
    </div>
  )
}

/**
 * Financing → **Data**.
 *
 * The balance banner, the repayment and pricing cards, the repayment schedule, and the two values
 * a person maintains by hand. Everything here is read from the record; nothing on this screen is
 * computed by the UI.
 *
 * ── WHY THE SCHEDULE IS NOT DERIVED ────────────────────────────────────────────────────────────
 * `repayment.rows` arrives with the record, each row already marked `is_current` / `is_future`.
 * Working out today's position here from the dates would be a second answer that can disagree
 * with the one the plan was built from — and the plan is what the bank sends the customer.
 */
export function FinancingDataTab({
  financing,
}: {
  financing: FinancingDetail
}) {
  const { t } = useTranslation("financing")
  const { balance, repayment } = financing

  return (
    <div className="flex flex-col gap-6" data-testid="financing-data-tab">
      <section
        className="flex flex-wrap items-start justify-between gap-6 rounded-lg border bg-primary/5 p-6"
        data-testid="financing-balance-banner"
      >
        <div>
          <p className="text-sm text-primary">
            {t("detail.outstandingBalance")}
          </p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            <Figure value={eur(balance.outstanding)} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("detail.asOf", { date: formatDate(balance.as_of) })}
          </p>
          <OsPlusPair financing={financing} />
        </div>

        <div className="text-right">
          <p className="text-sm text-primary">{t("detail.approvedPayout")}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
            <Figure value={eur(balance.approved_loan_amount)} />
          </p>
          {financing.value_date !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("detail.valueDate", {
                date: formatDate(financing.value_date),
              })}
            </p>
          )}
          {/* The record says outright whether the figure has settled. A provisional amount read as
              final is the one mistake this screen can cause. */}
          <div className="mt-2">
            <Badge
              variant={balance.provisional ? "secondary" : "outline"}
              className="font-normal"
              data-testid="financing-figures-state"
            >
              {t(balance.provisional ? "detail.provisional" : "detail.final")}
            </Badge>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border">
          <h3 className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("detail.repayment")}
          </h3>
          <Row
            label={t("detail.instalment")}
            value={eur(repayment?.instalment ?? null)}
          />
          <Row
            label={t("detail.instalmentNo")}
            value={
              repayment === null
                ? null
                : t("detail.instalmentOf", {
                    due: repayment.instalments_due,
                    total: repayment.instalment_count,
                  })
            }
          />
          <Row
            label={t("detail.repaymentStarts")}
            value={
              repayment?.repayment_start
                ? formatDate(repayment.repayment_start)
                : null
            }
          />
          <Row
            label={t("detail.finalInstalment")}
            value={eur(repayment?.final_instalment ?? null)}
          />
          <Row
            label={t("detail.residual")}
            value={eur(repayment?.residual ?? null)}
          />
          <Row
            label={t("detail.maturity")}
            value={repayment?.maturity ? formatDate(repayment.maturity) : null}
          />
        </section>

        <section className="overflow-hidden rounded-lg border">
          <h3 className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("detail.pricing")}
          </h3>
          <Row
            label={t("detail.refinancingRate")}
            value={
              financing.refinancing_rate === null
                ? null
                : `${financing.refinancing_rate} %`
            }
          />
          <Row
            label={t("detail.rateQuotedOn")}
            value={
              financing.rate_quoted_on
                ? formatDate(financing.rate_quoted_on)
                : null
            }
          />
          <Row
            label={t("detail.lockPeriod")}
            value={
              financing.rate_lock_days === null
                ? null
                : t("detail.lockDays", { count: financing.rate_lock_days })
            }
          />
          <Row
            label={t("detail.effectiveQuota")}
            value={
              financing.effective_quota === null
                ? null
                : `${financing.effective_quota} %`
            }
          />
          <Row
            label={t("detail.agreedLoanAmount")}
            value={eur(financing.agreed_loan_amount)}
          />
          <Row
            label={t("detail.totalInterest")}
            value={eur(repayment?.total_interest ?? null)}
          />
        </section>
      </div>

      {repayment !== null && repayment.rows.length > 0 && (
        <section data-testid="financing-schedule">
          <h3 className="text-base font-semibold">{t("detail.schedule")}</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            {t("detail.scheduleHint")}
          </p>
          {/* A redemption rewrites the tail of the plan, so the schedule says when it is no longer
              the one that was originally agreed. */}
          {repayment.adjusted_for_redemptions && (
            <p
              className="mb-3 text-sm text-amber-700"
              data-testid="financing-schedule-adjusted"
            >
              {t("detail.scheduleAdjusted")}
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("detail.schedCols.valueDate")}</TableHead>
                  <TableHead className="text-right">
                    {t("detail.schedCols.payment")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("detail.schedCols.principal")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("detail.schedCols.interest")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("detail.schedCols.closingBalance")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repayment.rows.map((row, index) => (
                  <TableRow
                    key={`${row.due_date ?? "row"}-${index}`}
                    className={cn(
                      row.is_current && "bg-amber-50 font-medium",
                      row.is_future && "text-muted-foreground"
                    )}
                    data-testid={
                      row.is_current ? "financing-sched-now" : undefined
                    }
                  >
                    <TableCell className="whitespace-nowrap">
                      {row.due_date === null ? "—" : formatDate(row.due_date)}
                      {row.kind !== null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t(
                            `detail.schedKinds.${row.kind}` as "detail.schedKinds.payout",
                            { defaultValue: row.kind }
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eur(row.payment)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eur(row.principal)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eur(row.interest)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {eur(row.closing_balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <MaintainedByHand financing={financing} />
    </div>
  )
}

/**
 * The loan number and loan account, beside the balance.
 *
 * Both come back from OS+ once the loan is set up there and are typed in by a person. The record
 * carries `loan_values_editable`, so the screen asks it rather than deriving the answer from the
 * status — the backend owns that rule and it is not the UI's to restate.
 */
function OsPlusPair({ financing }: { financing: FinancingDetail }) {
  const { t } = useTranslation("financing")
  const update = useUpdateMaintainedValues()
  const [isEditing, setEditing] = useState(false)
  const [loanNumber, setLoanNumber] = useState(financing.loan_number ?? "")
  const [loanAccount, setLoanAccount] = useState(financing.loan_account ?? "")

  function save() {
    update.mutate(
      {
        financingId: financing.id,
        expected_updated_at: financing.updated_at,
        // An emptied field clears the value to NOT RECORDED, which is a different statement from
        // a zero or an empty string.
        loan_number: loanNumber.trim() === "" ? null : loanNumber.trim(),
        loan_account: loanAccount.trim() === "" ? null : loanAccount.trim(),
      },
      {
        onSuccess: () => {
          setEditing(false)
          toast.success(t("detail.maintained.saved"))
        },
        onError: error => showApiError(error, t),
      }
    )
  }

  if (isEditing)
    return (
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-primary">
          {t("detail.loanNumber")}
          <Input
            value={loanNumber}
            className="mt-1 h-9 w-48"
            data-testid="financing-loan-number-input"
            onChange={event => setLoanNumber(event.target.value)}
          />
        </label>
        <label className="text-xs text-primary">
          {t("detail.loanAccount")}
          <Input
            value={loanAccount}
            className="mt-1 h-9 w-48 font-mono"
            data-testid="financing-loan-account-input"
            onChange={event => setLoanAccount(event.target.value)}
          />
        </label>
        <Button
          type="button"
          size="sm"
          disabled={update.isPending}
          data-testid="financing-os-save"
          onClick={save}
        >
          {t("detail.maintained.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(false)}
        >
          {t("detail.maintained.cancel")}
        </Button>
      </div>
    )

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
      <span>
        <span className="text-primary">{t("detail.loanNumber")}</span>{" "}
        <span className="font-medium">
          <Figure value={financing.loan_number} />
        </span>
      </span>
      <span>
        <span className="text-primary">{t("detail.loanAccount")}</span>{" "}
        <span className="font-mono font-medium">
          <Figure value={financing.loan_account} />
        </span>
      </span>
      {financing.loan_values_editable && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          data-testid="financing-os-edit"
          onClick={() => setEditing(true)}
        >
          <Pencil size={13} />
          {t("detail.maintained.edit")}
        </Button>
      )}
    </div>
  )
}

/**
 * Sollbelastung and Habenausgleich — the pre-financing debit and the credit that settles it.
 *
 * Maintained by hand throughout: nothing computes them, and nothing gates a status on them. Each
 * row is an amount and a date, edited together, because a date without its amount says nothing.
 */
function MaintainedByHand({ financing }: { financing: FinancingDetail }) {
  const { t } = useTranslation("financing")
  const update = useUpdateMaintainedValues()
  const [editingRow, setEditingRow] = useState<"soll" | "haben" | null>(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")

  function open(row: "soll" | "haben") {
    setEditingRow(row)
    setAmount(
      (row === "soll" ? financing.soll_amount : financing.haben_amount) ?? ""
    )
    setDate((row === "soll" ? financing.soll_date : financing.haben_date) ?? "")
  }

  function save(row: "soll" | "haben") {
    const trimmedAmount = amount.trim() === "" ? null : amount.trim()
    const trimmedDate = date.trim() === "" ? null : date.trim()
    update.mutate(
      {
        financingId: financing.id,
        expected_updated_at: financing.updated_at,
        ...(row === "soll"
          ? { soll_amount: trimmedAmount, soll_date: trimmedDate }
          : { haben_amount: trimmedAmount, haben_date: trimmedDate }),
      },
      {
        onSuccess: () => {
          setEditingRow(null)
          toast.success(t("detail.maintained.saved"))
        },
        onError: error => showApiError(error, t),
      }
    )
  }

  const rows = [
    {
      key: "soll" as const,
      label: t("detail.maintained.soll"),
      amount: financing.soll_amount,
      date: financing.soll_date,
    },
    {
      key: "haben" as const,
      label: t("detail.maintained.haben"),
      amount: financing.haben_amount,
      date: financing.haben_date,
    },
  ]

  return (
    <section
      className="overflow-hidden rounded-lg border"
      data-testid="financing-maintained"
    >
      <h3 className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("detail.maintained.heading")}
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead className="w-48 text-right">
              {t("detail.maintained.date")}
            </TableHead>
            <TableHead className="w-52 text-right">
              {t("detail.maintained.amount")}
            </TableHead>
            <TableHead className="w-44" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.key} data-testid={`financing-${row.key}-row`}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-right tabular-nums">
                {editingRow === row.key ? (
                  <Input
                    type="date"
                    value={date}
                    className="h-9"
                    data-testid={`financing-${row.key}-date`}
                    onChange={event => setDate(event.target.value)}
                  />
                ) : row.date === null ? (
                  <Figure value={null} />
                ) : (
                  formatDate(row.date)
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {editingRow === row.key ? (
                  <Input
                    inputMode="decimal"
                    value={amount}
                    className="h-9 text-right"
                    data-testid={`financing-${row.key}-amount`}
                    onChange={event => setAmount(event.target.value)}
                  />
                ) : (
                  <Figure value={eur(row.amount)} />
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingRow === row.key ? (
                  <span className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRow(null)}
                    >
                      {t("detail.maintained.cancel")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={update.isPending}
                      data-testid={`financing-${row.key}-save`}
                      onClick={() => save(row.key)}
                    >
                      {t("detail.maintained.save")}
                    </Button>
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`financing-${row.key}-edit`}
                    onClick={() => open(row.key)}
                  >
                    <Pencil size={13} />
                    {t("detail.maintained.edit")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t px-4 py-3 text-sm text-muted-foreground">
        {t("detail.maintained.note")}
      </p>
    </section>
  )
}
