import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDateTime, formatDecimalCurrency } from "@/lib/formatters"
import { ApiError } from "@/lib/api"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { CollateralTypeSchema } from "@/features/cases/api/schema"
import {
  canConfirm,
  canEditTotal,
  canRedetermine,
  isApprovalBlockedByCollateral,
  isValidCollateralTotal,
  latestValue,
  nextAct,
} from "@/features/cases/collateralRecheck"
import {
  useCaseCollateral,
  useConfirmCollateral,
  useRedetermineCollateral,
  useSetCollateralTotal,
  useSetCollateralType,
} from "@/features/cases/hooks/useCaseCollateral"

type Props = { caseId: string }

const COLLATERAL_TYPES = CollateralTypeSchema.options

/**
 * The case's collateral — US 1.14, and the design's **DAT DATA** block with its Edit action.
 *
 * ── THREE ACTS BY TWO ROLES, AND WHY THERE IS NEVER A BARE "CONFIRM" ───────────────────────────
 * When the package composition changes, the externally-determined figure must be set again. The
 * re-check clears only through three acts: it is *raised*, the preparing role *re-determines* with a
 * **new figure**, and then a **different** person in the releasing role *confirms* that figure.
 *
 * So Confirm is offered only while the state is `redetermined` — never while it is `needs_recheck`.
 * Offering it earlier would let the *old* figure be confirmed, which is the exact failure the
 * three-act rule exists to prevent, and it would look completely reasonable on screen.
 *
 * `redetermined_by` is compared against the current user for the same reason: the same person must
 * not be able to supply both pairs of eyes. The backend is the boundary; this is the UX half.
 *
 * ── THE PLATFORM RECORDS, IT DOES NOT VALUE ────────────────────────────────────────────────────
 * Every figure here is obtained outside the platform — the design says so on the wizard's
 * creditworthiness block too: *"Every value here is obtained outside the platform. Nothing is
 * scored."* There is no valuation logic here and no register of collateral, only the recorded kind,
 * the recorded figure, and who set it when.
 */
export function CaseCollateralPanel({ caseId }: Props) {
  const { t } = useTranslation("cases")
  const { data: currentUser } = useCurrentUser()
  const collateral = useCaseCollateral(caseId)
  const saveTotal = useSetCollateralTotal()
  const saveType = useSetCollateralType()
  const redetermine = useRedetermineCollateral()
  const confirm = useConfirmCollateral()

  const [totalDraft, setTotalDraft] = useState<string | null>(null)
  const [redetermineDraft, setRedetermineDraft] = useState("")

  if (collateral.isLoading) return <Skeleton className="h-40 w-full" />

  // A case with no collateral recorded yet is ordinary, not broken.
  const isAbsent =
    collateral.isError &&
    collateral.error instanceof ApiError &&
    collateral.error.code === "NOT_FOUND"

  if (isAbsent) {
    return (
      <Alert data-testid="case-collateral-absent">
        <AlertTitle>{t("collateral.absent.title")}</AlertTitle>
        <AlertDescription>
          {t("collateral.absent.description")}
        </AlertDescription>
      </Alert>
    )
  }

  if (collateral.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="case-collateral-error"
      >
        {resolveApiErrorMessage(collateral.error, t)}
      </p>
    )
  }

  if (collateral.data === undefined) return null

  const record = collateral.data
  const act = nextAct(record)
  const mayEditTotal = canEditTotal(record, currentUser?.role)
  const mayRedetermine = canRedetermine(record, currentUser?.role)
  const mayConfirm = canConfirm(record, currentUser?.role, currentUser?.id)
  const latest = latestValue(record)

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border p-4"
      data-testid="case-collateral-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("collateral.title")}</h3>
        <Badge
          variant={record.recheck_state === "clear" ? "default" : "secondary"}
          data-testid={`case-collateral-state-${record.recheck_state}`}
        >
          {t(
            `collateral.states.${record.recheck_state}` as "collateral.states.clear"
          )}
        </Badge>
      </div>

      {isApprovalBlockedByCollateral(record) && (
        /* Said plainly, because the consequence is not visible from the badge alone: nothing can be
           approved until the figure is confirmed. */
        <Alert data-testid="case-collateral-blocking">
          <AlertTitle>{t("collateral.blocking.title")}</AlertTitle>
          <AlertDescription>
            {t(
              act === "redetermine"
                ? "collateral.blocking.needsRedetermine"
                : "collateral.blocking.needsConfirm"
            )}
          </AlertDescription>
        </Alert>
      )}

      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{t("collateral.total")}</dt>
          <dd className="tabular-nums">
            {record.current_total_eur === null
              ? "—"
              : formatDecimalCurrency(
                  record.current_total_eur,
                  EUR_CURRENCY_CODE
                )}
          </dd>
        </div>

        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{t("collateral.type")}</dt>
          <dd>
            {record.collateral_type === null
              ? "—"
              : t(
                  `collateral.types.${record.collateral_type}` as "collateral.types.guarantee"
                )}
          </dd>
        </div>

        {latest !== null && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">{t("collateral.lastSet")}</dt>
            <dd className="text-xs text-muted-foreground">
              {formatDateTime(latest.set_at)}
            </dd>
          </div>
        )}

        {record.confirmed_at !== null && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("collateral.confirmedAt")}
            </dt>
            <dd className="text-xs text-muted-foreground">
              {formatDateTime(record.confirmed_at)}
            </dd>
          </div>
        )}
      </dl>

      {/* ── Editing the figure, while no re-check is outstanding ── */}
      {mayEditTotal && (
        <div className="border-t pt-3">
          <Label htmlFor="collateral-total" className="mb-1.5">
            {t("collateral.editTotal")}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="collateral-total"
              inputMode="decimal"
              className="max-w-[200px]"
              value={totalDraft ?? record.current_total_eur ?? ""}
              data-testid="case-collateral-total-input"
              onChange={e => setTotalDraft(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              data-testid="case-collateral-total-save"
              disabled={saveTotal.isPending}
              onClick={() => {
                const value = totalDraft ?? record.current_total_eur ?? ""
                if (!isValidCollateralTotal(value)) {
                  toast.error(t("collateral.invalidTotal"))
                  return
                }
                saveTotal.mutate(
                  { caseId, totalEur: value.trim() },
                  {
                    onSuccess: () => {
                      setTotalDraft(null)
                      toast.success(t("collateral.saved"))
                    },
                    onError: err => showApiError(err, t),
                  }
                )
              }}
            >
              {t("collateral.save")}
            </Button>
          </div>

          <div className="mt-3 max-w-[280px]">
            <Label htmlFor="collateral-type" className="mb-1.5">
              {t("collateral.type")}
            </Label>
            <SelectField
              id="collateral-type"
              data-testid="case-collateral-type-select"
              value={record.collateral_type ?? ""}
              placeholder={t("collateral.typePlaceholder")}
              options={COLLATERAL_TYPES.map(value => ({
                value,
                label: t(
                  `collateral.types.${value}` as "collateral.types.guarantee"
                ),
              }))}
              onValueChange={value =>
                saveType.mutate(
                  {
                    caseId,
                    collateralType: value as (typeof COLLATERAL_TYPES)[number],
                  },
                  { onError: err => showApiError(err, t) }
                )
              }
            />
          </div>
        </div>
      )}

      {/* ── Re-determine: a new figure, not an acknowledgement ── */}
      {mayRedetermine && (
        <div
          className="border-t pt-3"
          data-testid="case-collateral-redetermine"
        >
          <Label htmlFor="collateral-redetermine" className="mb-1.5">
            {t("collateral.redetermine.label")}
          </Label>
          <p className="mb-1.5 text-xs text-muted-foreground">
            {t("collateral.redetermine.help")}
          </p>
          <div className="flex items-center gap-2">
            <Input
              id="collateral-redetermine"
              inputMode="decimal"
              className="max-w-[200px]"
              value={redetermineDraft}
              data-testid="case-collateral-redetermine-input"
              onChange={e => setRedetermineDraft(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              data-testid="case-collateral-redetermine-submit"
              disabled={
                redetermine.isPending ||
                !isValidCollateralTotal(redetermineDraft)
              }
              onClick={() =>
                redetermine.mutate(
                  { caseId, totalEur: redetermineDraft.trim() },
                  {
                    onSuccess: () => {
                      setRedetermineDraft("")
                      toast.success(t("collateral.redetermine.done"))
                    },
                    onError: err => showApiError(err, t),
                  }
                )
              }
            >
              {t("collateral.redetermine.submit")}
            </Button>
          </div>
        </div>
      )}

      {/* ── Confirm: only once a new figure exists, and only by someone else ── */}
      {mayConfirm && (
        <div className="border-t pt-3" data-testid="case-collateral-confirm">
          <p className="mb-2 text-xs text-muted-foreground">
            {t("collateral.confirm.help")}
          </p>
          <Button
            type="button"
            size="sm"
            data-testid="case-collateral-confirm-submit"
            disabled={confirm.isPending}
            onClick={() =>
              confirm.mutate(
                { caseId },
                {
                  onSuccess: () => toast.success(t("collateral.confirm.done")),
                  onError: err => showApiError(err, t),
                }
              )
            }
          >
            {t("collateral.confirm.submit")}
          </Button>
        </div>
      )}

      {/* The re-determiner sees why they cannot finish the job themselves, rather than a control
          that simply is not there. */}
      {record.recheck_state === "redetermined" &&
        !mayConfirm &&
        currentUser?.id === record.redetermined_by && (
          <p
            className="border-t pt-3 text-xs text-muted-foreground"
            data-testid="case-collateral-four-eyes-notice"
          >
            {t("collateral.confirm.notYou")}
          </p>
        )}
    </section>
  )
}
