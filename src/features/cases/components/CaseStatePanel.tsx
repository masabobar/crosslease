import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge"
import { showApiError } from "@/lib/apiErrorMessage"
import { useTransitionCase } from "@/features/cases/hooks/useTransitionCase"
import {
  isDestructiveTransition,
  offeredTransitions,
} from "@/features/cases/caseTransitions"
import type { CaseTransition } from "@/features/cases/caseTransitions"
import type { CaseResponse } from "@/features/cases/api/schema"

type Props = { caseRecord: CaseResponse }

/**
 * The case's state and its lifecycle transitions — US 1.31 (the states) and US 1.30 (rework and
 * resubmission).
 *
 * ── TWO STATUSES ARE SHOWN, AND THE DIFFERENCE IS THE POINT ────────────────────────────────────
 * `display_status` is the **derived** value covering all three sets (case, request, financing) and
 * is what a user reads. `case_status` is the case's own stored four-value state. Both are shown
 * because they answer different questions, and US 1.1 is explicit that filtering and sorting must
 * run on the stored sets and never on the derivation — so conflating them here would teach the
 * wrong model.
 *
 * The request's and the financing's own statuses are not separate fields on `CaseResponse`; the
 * derivation folds them in. That is why there are two badges and not four.
 *
 * ── NO LEGALITY MATRIX ─────────────────────────────────────────────────────────────────────────
 * Q-004: transitions are configured at task level, statuses live on the entities. So this offers
 * the transitions that are *structurally* possible and lets the backend refuse the rest — a 409 is
 * a normal answer here, surfaced as an error message rather than pre-empted by a guess.
 */
export function CaseStatePanel({ caseRecord }: Props) {
  const { t } = useTranslation("cases")
  const transition = useTransitionCase()
  const [confirming, setConfirming] = useState<CaseTransition | null>(null)

  const offered = offeredTransitions(caseRecord.display_status)

  function run(which: CaseTransition) {
    transition.mutate(
      { caseId: caseRecord.id, transition: which },
      {
        onSuccess: updated => {
          toast.success(
            t("state.transitioned", { status: updated.display_status })
          )
          setConfirming(null)
        },
        onError: err => {
          showApiError(err, t)
          setConfirming(null)
        },
      }
    )
  }

  return (
    <section className="flex flex-col gap-4" data-testid="case-state-panel">
      <div className="rounded-lg border px-4 py-3">
        <h3 className="mb-3 text-sm font-semibold">{t("state.title")}</h3>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("state.displayStatus")}
            </dt>
            <dd>
              <CaseStatusBadge status={caseRecord.display_status} />
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{t("state.caseStatus")}</dt>
            <dd>
              <Badge variant="outline" data-testid="case-state-case-status">
                {t(
                  `state.caseStatuses.${caseRecord.case_status}` as "state.caseStatuses.open"
                )}
              </Badge>
            </dd>
          </div>
        </dl>

        {/* Says why there are two, so nobody reads the pair as a duplicate or filters on the
            wrong one. */}
        <p className="mt-3 text-xs text-muted-foreground">
          {t("state.explanation")}
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="case-state-transitions"
      >
        {offered.map(which => (
          <Button
            key={which}
            type="button"
            variant={isDestructiveTransition(which) ? "destructive" : "outline"}
            size="sm"
            data-testid={`case-transition-${which}`}
            disabled={transition.isPending}
            onClick={() =>
              isDestructiveTransition(which) ? setConfirming(which) : run(which)
            }
          >
            {t(`state.transitions.${which}` as "state.transitions.cancel")}
          </Button>
        ))}
      </div>

      {/* Only the destructive one confirms. Returning a case to the queue or resubmitting it are
          both recoverable; cancelling ends it. */}
      <AlertDialog
        open={confirming !== null}
        onOpenChange={open => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("state.cancelConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("state.cancelConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="case-cancel-keep">
              {t("state.cancelConfirm.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="case-cancel-confirm"
              onClick={() => confirming !== null && run(confirming)}
            >
              {t("state.cancelConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
