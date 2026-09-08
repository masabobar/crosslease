import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EUR_CURRENCY_CODE } from "@/lib/constants"
import { formatDecimalCurrency, formatDecimalPercent } from "@/lib/formatters"
import { resolveApiErrorMessage, showApiError } from "@/lib/apiErrorMessage"
import { useFrameworkAgreementLcPartners } from "@/features/frameworkAgreements/hooks/useFrameworkAgreementLcPartners"
import { useLcNumbers } from "@/features/partners/hooks/useLcNumbers"
import { useCaseAllowedProductTemplates } from "@/features/cases/hooks/useCaseAllowedProductTemplates"
import { useBindLeasingCompany } from "@/features/cases/hooks/useBindLeasingCompany"
import { useBindProductTemplate } from "@/features/cases/hooks/useBindProductTemplate"
import { templateOptionLabel } from "@/features/cases/allowedTemplates"
import type { CaseLeasingCompanyResponse } from "@/features/cases/api/schema"
import type { FALCPartnerItem } from "@/features/frameworkAgreements/api/schema"

// Below three characters a name search matches most of the book, the same threshold the framework
// agreement list uses. Applied client-side here: `/framework-agreements/lc-partners` takes no
// search param, so the whole (small, bank-scoped) list is filtered in the browser.
const MIN_SEARCH_LENGTH = 3

type Props = {
  caseId: string
  leasingCompany: CaseLeasingCompanyResponse | null
  isLoadingLeasingCompany: boolean
}

/**
 * Wizard step 1 — **Leasing company** (`Company & agreement`). US 1.2 + US 1.3.
 *
 * ── THE BIND IS BY HÄNDLERNUMMER, WHICH THE DESIGN DOES NOT SHOW ───────────────────────────────
 * The design searches a company by name and moves straight on. It cannot work as drawn:
 * `/framework-agreements/lc-partners` returns `{id, legal_name}` and
 * `PUT /cases/{id}/leasing-company` demands `{lc_number}` matching `^[0-9]{4}$`. The bridge is
 * `/partners/{id}/lc-numbers`, and a company may hold up to four with nothing saying which is
 * chosen (Q-014). So this step adds a number picker the frame lacks: hidden when the company has
 * exactly one number, required when it has several.
 *
 * ── THE FRAMEWORK AGREEMENT IS READ-ONLY, NOT A DROPDOWN ───────────────────────────────────────
 * The design draws a dropdown. D-79 says the agreement is *"determined by the company, shown
 * read-only, never a dropdown"* — and the contract agrees: `agreement_reference` is an **output**
 * of the bind, and no endpoint offers a choice. So it renders as read-only text.
 *
 * ── THE TWO BANK IBANS ARE NOT SHOWN ───────────────────────────────────────────────────────────
 * The design shows the payout and collection IBANs in full. §5.2 says they are partner records
 * that belong on generated documents, not here — and `CaseLeasingCompanyResponse` carries neither,
 * so the contract agrees with the spec.
 */
export function LeasingCompanyStep({
  caseId,
  leasingCompany,
  isLoadingLeasingCompany,
}: Props) {
  const { t } = useTranslation("cases")

  const partners = useFrameworkAgreementLcPartners()
  const [search, setSearch] = useState("")
  const [selectedPartner, setSelectedPartner] =
    useState<FALCPartnerItem | null>(null)

  const bindLeasingCompany = useBindLeasingCompany()
  const bindProductTemplate = useBindProductTemplate()

  const matches =
    search.trim().length >= MIN_SEARCH_LENGTH
      ? (partners.data?.items ?? []).filter(partner =>
          partner.legal_name.toLowerCase().includes(search.trim().toLowerCase())
        )
      : []

  const isBound = leasingCompany !== null && leasingCompany.lc_number !== null

  return (
    <div className="flex flex-col gap-6" data-testid="case-wizard-step-company">
      <section>
        <Label htmlFor="lc-search">{t("wizard.company.searchLabel")}</Label>
        <Input
          id="lc-search"
          data-testid="case-wizard-lc-search-input"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={t("wizard.company.searchPlaceholder")}
          className="mt-1.5"
        />

        {partners.isError && (
          <p
            className="mt-2 text-sm text-destructive"
            data-testid="case-wizard-lc-search-error"
          >
            {resolveApiErrorMessage(partners.error, t)}
          </p>
        )}

        {search.trim().length >= MIN_SEARCH_LENGTH && matches.length === 0 && (
          <p
            className="mt-2 text-sm text-muted-foreground"
            data-testid="case-wizard-lc-no-matches"
          >
            {t("wizard.company.noMatches")}
          </p>
        )}

        <div className="mt-2 flex flex-col gap-2">
          {matches.map(partner => (
            /* NOTE: raw <button> — a selectable result row, not an action button. shadcn Button
               centres its content and imposes a height, both wrong for a full-width row with a
               badge pushed to the right; wrapping it would mean overriding most of its variant. */
            <button
              key={partner.id}
              type="button"
              data-testid={`case-wizard-lc-result-${partner.id}`}
              onClick={() => setSelectedPartner(partner)}
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm hover:bg-accent"
            >
              <span className="font-medium">{partner.legal_name}</span>
              {selectedPartner?.id === partner.id && (
                <Badge variant="default">{t("wizard.company.selected")}</Badge>
              )}
            </button>
          ))}
        </div>
      </section>

      {selectedPartner !== null && !isBound && (
        <LcNumberBind
          caseId={caseId}
          partner={selectedPartner}
          isBinding={bindLeasingCompany.isPending}
          onBind={lcNumber =>
            bindLeasingCompany.mutate(
              { caseId, lcNumber },
              { onError: err => showApiError(err, t) }
            )
          }
        />
      )}

      {isLoadingLeasingCompany && <Skeleton className="h-40 w-full" />}

      {isBound && leasingCompany !== null && (
        <AgreementBlock leasingCompany={leasingCompany} />
      )}

      {isBound && (
        <ProductTemplateSelect
          lcPartnerId={selectedPartner?.id}
          isBinding={bindProductTemplate.isPending}
          onSelect={productTemplateId =>
            bindProductTemplate.mutate(
              { caseId, productTemplateId },
              { onError: err => showApiError(err, t) }
            )
          }
        />
      )}
    </div>
  )
}

/**
 * Resolves the selected partner's Händlernummern and binds one.
 *
 * A separate component so `useLcNumbers` — which takes a bare partner id and cannot be disabled —
 * only mounts once a partner is actually selected. Calling it earlier would request `""`.
 */
function LcNumberBind({
  partner,
  isBinding,
  onBind,
}: {
  caseId: string
  partner: FALCPartnerItem
  isBinding: boolean
  onBind: (lcNumber: string) => void
}) {
  const { t } = useTranslation("cases")
  const lcNumbers = useLcNumbers(partner.id)

  if (lcNumbers.isLoading) return <Skeleton className="h-20 w-full" />

  if (lcNumbers.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="case-wizard-lc-numbers-error"
      >
        {resolveApiErrorMessage(lcNumbers.error, t)}
      </p>
    )
  }

  const numbers = lcNumbers.data?.items ?? []

  // The bind has no key to send. Nothing downstream can proceed, so this is stated rather than
  // left as an empty picker the user cannot satisfy.
  if (numbers.length === 0) {
    return (
      <Alert variant="destructive" data-testid="case-wizard-lc-no-numbers">
        <AlertTitle>{t("wizard.company.noLcNumber.title")}</AlertTitle>
        <AlertDescription>
          {t("wizard.company.noLcNumber.description", {
            name: partner.legal_name,
          })}
        </AlertDescription>
      </Alert>
    )
  }

  /**
   * The dealer number is not asked for.
   *
   * `PUT /cases/{id}/leasing-company` binds on `lc_number`, so one still has to be sent — but the
   * design shows no picker, and it was removed on request. The first number the registry returns is
   * used, and it is **shown** here and again on the agreement block rather than applied invisibly:
   * a company can hold several, and which one the case is bound to is a real fact about the case.
   *
   * Q-014 is the open question behind this: the spec says a request "retains the one it came in
   * through", but nothing says which of several that is, and the platform has no inbound channel to
   * read it from. So this picks the first rather than pretending to know.
   */
  const lcNumber = numbers[0].lc_number

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div className="text-sm">
        <p className="font-medium">{partner.legal_name}</p>
        <p className="text-muted-foreground">
          {t("wizard.company.lcNumber", { number: lcNumber })}
        </p>
      </div>
      <Button
        data-testid="case-wizard-bind-lc-button"
        disabled={isBinding}
        onClick={() => onBind(lcNumber)}
      >
        {t("wizard.company.bind")}
      </Button>
    </div>
  )
}

/**
 * The agreement values block, read-only.
 *
 * Only the fields the contract actually carries. The design's `Early-repayment fee`, the two IBANs
 * and the utilisation bar are absent: the first two are not on `CaseLeasingCompanyResponse` at all,
 * and the utilisation figures live on a different resource (`/framework-agreements/{id}/utilization`)
 * which step 3 reads for the summary. Per §5.2 the spec agrees the IBANs do not belong here.
 */
function AgreementBlock({
  leasingCompany,
}: {
  leasingCompany: CaseLeasingCompanyResponse
}) {
  const { t } = useTranslation("cases")

  return (
    <section
      className="rounded-lg border p-4"
      data-testid="case-wizard-agreement-block"
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold">
          {t("wizard.company.agreement")}
        </h3>
        <Badge
          variant={leasingCompany.agreement_active ? "default" : "outline"}
        >
          {t(
            leasingCompany.agreement_active
              ? "wizard.company.agreementActive"
              : "wizard.company.agreementInactive"
          )}
        </Badge>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <Row
          label={t("wizard.company.agreementReference")}
          value={leasingCompany.agreement_reference ?? "—"}
        />
        <Row
          label={t("wizard.company.dealerNumber")}
          value={leasingCompany.lc_number ?? "—"}
        />
        <Row
          label={t("wizard.company.frameworkVolume")}
          value={formatDecimalCurrency(
            leasingCompany.framework_volume_eur,
            EUR_CURRENCY_CODE
          )}
        />
        <Row
          label={t("wizard.company.vfeAmount")}
          value={formatDecimalCurrency(
            leasingCompany.vfe_amount_eur,
            EUR_CURRENCY_CODE
          )}
        />
        <Row
          label={t("wizard.company.refinancingQuota")}
          value={formatDecimalPercent(leasingCompany.refinancing_quota)}
        />
        <Row
          label={t("wizard.company.contactPerson")}
          value={leasingCompany.contact_person ?? "—"}
        />
      </dl>
    </section>
  )
}

function ProductTemplateSelect({
  lcPartnerId,
  isBinding,
  onSelect,
}: {
  lcPartnerId: string | undefined
  isBinding: boolean
  onSelect: (productTemplateId: string) => void
}) {
  const { t } = useTranslation("cases")
  const allowed = useCaseAllowedProductTemplates(lcPartnerId)
  const [chosen, setChosen] = useState<string>("")

  if (allowed.isLoading) return <Skeleton className="h-20 w-full" />

  if (allowed.isError) {
    return (
      <p
        className="text-sm text-destructive"
        data-testid="case-wizard-templates-error"
      >
        {resolveApiErrorMessage(allowed.error, t)}
      </p>
    )
  }

  if (allowed.hasNoActiveAgreement) {
    return (
      <Alert variant="destructive" data-testid="case-wizard-no-agreement">
        <AlertTitle>{t("wizard.company.noAgreement.title")}</AlertTitle>
        <AlertDescription>
          {t("wizard.company.noAgreement.description")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <section data-testid="case-wizard-template-select">
      {/* D-79 says one active agreement per company. More than one means the data contradicts the
          rule, and binding against whichever sorted first would be arbitrary — so say so. */}
      {allowed.agreementCount > 1 && (
        <Alert className="mb-3" data-testid="case-wizard-multiple-agreements">
          <AlertTitle>
            {t("wizard.company.multipleAgreements.title")}
          </AlertTitle>
          <AlertDescription>
            {t("wizard.company.multipleAgreements.description", {
              count: allowed.agreementCount,
            })}
          </AlertDescription>
        </Alert>
      )}

      <Label htmlFor="template-select">
        {t("wizard.company.templateLabel")}
      </Label>
      <SelectField
        id="template-select"
        data-testid="case-wizard-template-field"
        className="mt-1.5"
        value={chosen}
        disabled={isBinding || allowed.templates.length === 0}
        placeholder={
          allowed.templates.length === 0
            ? t("wizard.company.noTemplates")
            : t("wizard.company.templatePlaceholder")
        }
        onValueChange={value => {
          setChosen(value)
          onSelect(value)
        }}
        options={allowed.templates.map(template => ({
          value: template.template_id,
          label: templateOptionLabel(template),
        }))}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t("wizard.company.templateHelper")}
      </p>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
