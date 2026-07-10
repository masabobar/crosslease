import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { LoaderCircle, CircleAlert, CheckCheck, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { partnerDetail, PATHS } from "@/router/paths"
import { countryName } from "@/lib/countries"
import type {
  PartnerMatchResponse,
  PartnerRole,
} from "@/features/partners/api/schema"
import type { PartnerIdentityInput } from "@/features/partners/api/partnersApi"

type MatchingReviewProps = {
  matchResult: PartnerMatchResponse | null
  identity: PartnerIdentityInput
  roles: PartnerRole[]
  isSubmitting: boolean
  onConfirmCreate: () => void
  onCancel: () => void
}

function formatCountry(code: string): string {
  return `${countryName(code)} (${code})`
}

function summaryRows(
  identity: PartnerIdentityInput,
  roles: PartnerRole[],
  t: TFunction<"partners">
) {
  const rolesRow = {
    label: t("submit.matchStep.summaryFields.roles"),
    value: roles.map(role => t(`role.${role}` as "role.lessee")).join(", "),
  }
  if (identity.partner_type === "legal_entity") {
    return [
      {
        label: t("submit.identityStep.fields.legalName"),
        value: identity.legal_name,
      },
      {
        label: t("submit.identityStep.fields.legalForm"),
        value: identity.legal_form,
      },
      {
        label: t("submit.identityStep.fields.country"),
        value: identity.country
          ? formatCountry(identity.country)
          : identity.country,
      },
      {
        label: t("submit.matchStep.summaryFields.hrb"),
        value: identity.commercial_register_no,
      },
      {
        label: t("submit.identityStep.fields.taxIdVat"),
        value: identity.tax_id_vat,
      },
      rolesRow,
    ]
  }
  return [
    {
      label: t("submit.identityStep.fields.fullName"),
      value: identity.full_name,
    },
    {
      label: t("submit.identityStep.fields.dateOfBirth"),
      value: identity.date_of_birth,
    },
    {
      label: t("submit.identityStep.fields.country"),
      value: identity.country
        ? formatCountry(identity.country)
        : identity.country,
    },
    rolesRow,
  ]
}

function MatchingReview({
  matchResult,
  identity,
  roles,
  isSubmitting,
  onConfirmCreate,
  onCancel,
}: MatchingReviewProps) {
  const { t } = useTranslation("partners")

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {t("submit.matchStep.title")}
          </h1>

          {matchResult === null && (
            <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t("submit.matchStep.matchedCandidates")}
                </p>
                <LoaderCircle
                  size={16}
                  className="animate-spin text-muted-foreground"
                />
              </div>
              <div className="h-21 rounded-xl bg-muted flex items-center justify-center">
                <p className="text-sm text-muted-foreground opacity-80">
                  {t("submit.matchStep.checkingResult")}
                </p>
              </div>
            </div>
          )}

          {matchResult?.classification === "exact" && (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-success/60 bg-success/10 px-2.5 py-2 mb-4">
                <CheckCheck size={16} className="text-success shrink-0" />
                <p className="text-sm text-success">
                  {t("submit.matchStep.exactMatchAlert")}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t("submit.matchStep.matchedCandidates")}
                </p>
                <div className="rounded-xl bg-muted border-l-3 border-success px-4 py-3 flex flex-col gap-4">
                  {matchResult.candidate_summaries.map(c => (
                    <div
                      key={c.partner_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">
                          {c.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("submit.matchStep.matchedAnchors")}:{" "}
                          <span className="font-semibold">
                            {c.matched_anchors.join(", ")}
                          </span>
                        </p>
                      </div>
                      <Link
                        to={partnerDetail(c.partner_id)}
                        className="text-sm font-medium text-primary shrink-0"
                      >
                        {t("submit.matchStep.viewPartner")}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {matchResult?.classification === "ambiguous" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-warning/60 bg-warning/10 px-2.5 py-2 mb-4">
                <CircleAlert
                  size={16}
                  className="text-warning shrink-0 mt-0.5"
                />
                <p className="text-sm text-warning">
                  {t("submit.matchStep.ambiguousAlert")}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4 flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">
                  {t("submit.matchStep.matchedCandidates")}
                </p>
                <div className="rounded-xl bg-muted border-l-3 border-warning px-4 py-3 flex flex-col gap-4">
                  {matchResult.candidate_summaries.map(c => (
                    <div
                      key={c.partner_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-foreground">
                          {c.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("submit.matchStep.matchedAnchors")}:{" "}
                          <span className="font-semibold">
                            {c.matched_anchors.join(", ")}
                          </span>
                        </p>
                      </div>
                      <Link
                        to={partnerDetail(c.partner_id)}
                        className="text-sm font-medium text-primary shrink-0"
                      >
                        {t("submit.matchStep.viewPartner")}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {matchResult?.classification === "no_match" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-info/60 bg-info/10 px-2.5 py-2 mb-4">
                <Info size={16} className="text-info shrink-0 mt-0.5" />
                <p className="text-sm text-info opacity-80">
                  {t("submit.matchStep.noMatchAlert")}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  {t("submit.matchStep.newPartnerSummary")}
                </p>
                <div className="rounded-xl bg-muted px-4 py-3 border-l-3 border-info flex flex-col gap-3">
                  {summaryRows(identity, roles, t)
                    .filter(row => row.value)
                    .map(row => (
                      <div key={row.label} className="flex gap-20 text-sm">
                        <span className="text-muted-foreground w-40 shrink-0">
                          {row.label}
                        </span>
                        <span className="text-foreground">{row.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-8 py-3.5 border-t border-border">
        {matchResult?.classification === "exact" ? (
          <>
            <span />
            <Button
              variant="outline"
              render={<Link to={PATHS.PARTNER_REGISTRY} />}
              data-testid="back-to-partner-list"
            >
              {t("submit.matchStep.backToList")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="matching-cancel"
            >
              {t("submit.matchStep.cancel")}
            </Button>
            {matchResult === null && (
              <Button disabled data-testid="matching-loading-submit">
                {t("submit.form.submitButton")}
              </Button>
            )}
            {matchResult?.classification === "ambiguous" && (
              <Button
                onClick={onConfirmCreate}
                disabled={isSubmitting}
                data-testid="go-to-pending-confirmation"
              >
                {isSubmitting
                  ? t("submit.form.submitting")
                  : t("submit.matchStep.goToPendingConfirmation")}
              </Button>
            )}
            {matchResult?.classification === "no_match" && (
              <Button
                onClick={onConfirmCreate}
                disabled={isSubmitting}
                data-testid="confirm-and-create"
              >
                {isSubmitting
                  ? t("submit.form.submitting")
                  : t("submit.matchStep.confirmAndCreate")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { MatchingReview }
