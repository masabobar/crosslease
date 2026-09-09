import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge"
import type { CaseResponse } from "@/features/cases/api/schema"

type Props = { caseRecord: CaseResponse }

/**
 * The case's state — US 1.31 (the three status sets).
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
 * ── THE TRANSITIONS ARE NOT HERE ANY MORE ──────────────────────────────────────────────────────
 * They moved to the header's `Actions` menu (`CaseActionsMenu`), which is the click dummy's own
 * shape and, more to the point, the only place they now exist: they had been rendered both here and
 * as header buttons, so cancelling a case could be reached from two screens and found from neither.
 * This panel is the read-out; acting on the case is one menu, in the header.
 */
export function CaseStatePanel({ caseRecord }: Props) {
  const { t } = useTranslation("cases")

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
    </section>
  )
}
