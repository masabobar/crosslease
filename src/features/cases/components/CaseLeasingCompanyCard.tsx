import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useCaseLeasingCompany } from "@/features/cases/hooks/useCaseLeasingCompany"

/**
 * The Data tab's **Leasing company** block — the click dummy's first card on that tab:
 *
 *   Leasing company            Framework agreement        Dealer number
 *   Premium Leasing GmbH       FA-2026-004, active        4711
 *
 * ── WHY THIS WAS MISSING ───────────────────────────────────────────────────────────────────────
 * The tab had been built from the Figma *financing* Data frame, so it opened on outstanding
 * balance, claim and pricing — and the three facts the dummy leads with were nowhere on the
 * workspace at all once the wizard was behind you. They are the case's own identity: which company
 * this is, under which agreement, on which dealer number. All three come back from
 * `GET /cases/{id}/leasing-company`, which the wizard already reads.
 *
 * ── NO EDIT ────────────────────────────────────────────────────────────────────────────────────
 * The dummy draws no edit control here and there is none to draw: the agreement is an *output* of
 * the bind (D-79 — determined by the company, never chosen), and re-binding a different company on
 * a live case is not something `PUT /cases/{id}/leasing-company` is offered for from this screen.
 * So this is a read-out, and the DAT block below it is the tab's editable half.
 */
export function CaseLeasingCompanyCard({ caseId }: { caseId: string }) {
  const { t } = useTranslation("cases")
  const leasingCompany = useCaseLeasingCompany(caseId)

  if (leasingCompany.isLoading) {
    return (
      <Skeleton className="h-24 w-full" data-testid="case-lc-card-loading" />
    )
  }

  if (leasingCompany.isError) {
    return (
      <p className="text-sm text-destructive" data-testid="case-lc-card-error">
        {resolveApiErrorMessage(leasingCompany.error, t)}
      </p>
    )
  }

  const data = leasingCompany.data ?? null

  // A case exists before its company is bound, and the endpoint answers `null` rather than 404 for
  // exactly that state. Saying so beats three em-dashes that read like missing data.
  if (data === null || data.lc_number === null) {
    return (
      <section
        className="rounded-lg border px-4 py-3"
        data-testid="case-lc-card-unbound"
      >
        <h3 className="text-sm font-semibold">{t("dataTab.company.title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dataTab.company.notBound")}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border" data-testid="case-lc-card">
      <header className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t("dataTab.company.title")}</h3>
      </header>
      <dl className="grid gap-x-8 gap-y-4 px-4 py-4 sm:grid-cols-3">
        <Field
          label={t("dataTab.company.leasingCompany")}
          testId="case-lc-card-name"
        >
          {data.name ?? t("dataTab.company.unnamed")}
        </Field>

        <Field
          label={t("dataTab.company.frameworkAgreement")}
          testId="case-lc-card-agreement"
        >
          {data.agreement_reference === null ? (
            <span className="text-muted-foreground">
              {t("dataTab.company.noAgreement")}
            </span>
          ) : (
            <span className="flex flex-wrap items-center gap-2">
              {data.agreement_reference}
              <Badge variant={data.agreement_active ? "default" : "outline"}>
                {t(
                  data.agreement_active
                    ? "wizard.company.agreementActive"
                    : "wizard.company.agreementInactive"
                )}
              </Badge>
            </span>
          )}
        </Field>

        <Field
          label={t("dataTab.company.dealerNumber")}
          testId="case-lc-card-lc-number"
        >
          <span className="tabular-nums">{data.lc_number}</span>
        </Field>
      </dl>
    </section>
  )
}

function Field({
  label,
  testId,
  children,
}: {
  label: string
  testId: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium" data-testid={testId}>
        {children}
      </dd>
    </div>
  )
}
