import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
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
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { LEASING_COMPANY_USER_ROLE } from "@/features/users/types"
import { templateOptionLabel } from "@/features/cases/allowedTemplates"
import type { CaseLeasingCompanyResponse } from "@/features/cases/api/schema"
import type {
  FALCPartnerItem,
  SelectableTemplateItem,
} from "@/features/frameworkAgreements/api/schema"

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
 * ── THE COMPANY IS A DROPDOWN, AND CHOOSING ONE BINDS IT ───────────────────────────────────────
 * The click dummy's field is a native combobox over the whole eligible list: it opens showing every
 * company, typing filters it, and picking one resolves the framework agreement straight away — no
 * second click.
 *
 * This had been a plain text input that showed nothing until three characters were typed and then
 * needed two more clicks (pick the row, press Bind). Three characters is a real barrier when the
 * list is a couple of dozen names and the user does not know how the company is spelled in the
 * registry. So it is now a `Combobox` over the full list, and picking a company **binds it
 * immediately** — which is what makes the agreement resolve, since `agreement_reference` is an
 * output of the bind rather than something the client can look up.
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
  const { data: currentUser } = useCurrentUser()

  const partners = useFrameworkAgreementLcPartners()
  const [companyQuery, setCompanyQuery] = useState("")
  const [selectedPartner, setSelectedPartner] =
    useState<FALCPartnerItem | null>(null)

  /**
   * The leasing-company portal variant.
   *
   * The point of the portal is that the leasing company starts the request itself, so it has to get
   * through this wizard — and the three things a bank user decides here are not its to decide. Its
   * own company is **pre-selected and locked**, the one active framework agreement resolves from
   * that, and the **bank product template is not shown to it at all**, so it can never be what
   * stops a portal user continuing.
   *
   * `lc_partner_id` on the user is what ties the session to a company. Without it there is nothing
   * to pre-select, so the search is left in place rather than showing an empty locked field.
   */
  const isPortalUser = currentUser?.role === LEASING_COMPANY_USER_ROLE
  const ownPartner =
    isPortalUser && currentUser?.lc_partner_id
      ? ((partners.data?.items ?? []).find(
          partner => partner.id === currentUser.lc_partner_id
        ) ?? null)
      : null
  const isPortalLocked = isPortalUser && ownPartner !== null

  const bindLeasingCompany = useBindLeasingCompany()
  const bindProductTemplate = useBindProductTemplate()

  // Every eligible company, in name order — the combobox filters this itself as the user types.
  // `/framework-agreements/lc-partners` takes no search param and the list is small and
  // bank-scoped, so there is nothing to page through.
  const companyOptions = [...(partners.data?.items ?? [])]
    .sort((a, b) => a.legal_name.localeCompare(b.legal_name))
    .map(partner => ({ value: partner.id, label: partner.legal_name }))

  const isBound = leasingCompany !== null && leasingCompany.lc_number !== null

  return (
    <div className="flex flex-col gap-6" data-testid="case-wizard-step-company">
      {isPortalLocked ? (
        <section data-testid="case-wizard-lc-locked">
          <Label>{t("wizard.company.searchLabel")}</Label>
          <div className="mt-1.5 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium">{ownPartner.legal_name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("wizard.company.portalLocked")}
            </p>
          </div>
        </section>
      ) : (
        <section>
          <Label htmlFor="lc-company">{t("wizard.company.searchLabel")}</Label>
          <Combobox
            items={companyOptions}
            value={
              companyOptions.find(
                option => option.value === selectedPartner?.id
              ) ?? null
            }
            onValueChange={option => {
              setSelectedPartner(
                option === null
                  ? null
                  : ((partners.data?.items ?? []).find(
                      partner => partner.id === option.value
                    ) ?? null)
              )
            }}
            inputValue={companyQuery}
            onInputValueChange={setCompanyQuery}
          >
            <ComboboxInput
              id="lc-company"
              data-testid="case-wizard-lc-combobox"
              className="mt-1.5"
              placeholder={t("wizard.company.searchPlaceholder")}
              showClear
            />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxEmpty data-testid="case-wizard-lc-no-matches">
                  {t("wizard.company.noMatches")}
                </ComboboxEmpty>
                <ComboboxCollection>
                  {(option: { value: string; label: string }) => (
                    <ComboboxItem
                      key={option.value}
                      value={option}
                      data-testid={`case-wizard-lc-result-${option.value}`}
                    >
                      {option.label}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          {partners.isLoading && (
            <Skeleton
              className="mt-2 h-4 w-40"
              data-testid="case-wizard-lc-loading"
            />
          )}

          {partners.isError && (
            <p
              className="mt-2 text-sm text-destructive"
              data-testid="case-wizard-lc-search-error"
            >
              {resolveApiErrorMessage(partners.error, t)}
            </p>
          )}
        </section>
      )}

      {/* A portal user's own company is bound the same way a searched one is — the endpoint still
          needs a dealer number — but it is never searched for. */}
      {isPortalLocked && !isBound && (
        <LcNumberBind
          caseId={caseId}
          partner={ownPartner}
          isBinding={bindLeasingCompany.isPending}
          bindError={bindLeasingCompany.error}
          onBind={lcNumber =>
            bindLeasingCompany.mutate(
              { caseId, lcNumber },
              { onError: err => showApiError(err, t) }
            )
          }
        />
      )}

      {!isPortalLocked && selectedPartner !== null && !isBound && (
        <LcNumberBind
          caseId={caseId}
          partner={selectedPartner}
          isBinding={bindLeasingCompany.isPending}
          bindError={bindLeasingCompany.error}
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
        <AgreementBlock
          leasingCompany={leasingCompany}
          hideBankOnlyFigures={isPortalUser}
        />
      )}

      {/* Not rendered for a portal user at all — not disabled, not empty. The template is the
          bank's decision and the portal is not asked to make it. */}
      {isBound && !isPortalUser && (
        <ProductTemplateSelect
          lcPartnerId={selectedPartner?.id ?? ownPartner?.id}
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
 * Resolves the selected partner's Händlernummern and binds one **without being asked**.
 *
 * A separate component so `useLcNumbers` — which takes a bare partner id and cannot be disabled —
 * only mounts once a partner is actually selected. Calling it earlier would request `""`.
 *
 * ── WHY IT BINDS BY ITSELF ─────────────────────────────────────────────────────────────────────
 * In the dummy, choosing a company resolves its framework agreement on the spot. Here the agreement
 * only exists as an *output* of `PUT /cases/{id}/leasing-company`, so "resolves on selection" and
 * "binds on selection" are the same act — a separate Bind button would be a click that exists only
 * because of how the endpoint is shaped.
 *
 * It is still a request that can fail, so a failure is visible and retryable rather than silent.
 */
function LcNumberBind({
  partner,
  isBinding,
  bindError,
  onBind,
}: {
  caseId: string
  partner: FALCPartnerItem
  isBinding: boolean
  bindError: unknown
  onBind: (lcNumber: string) => void
}) {
  const { t } = useTranslation("cases")
  const lcNumbers = useLcNumbers(partner.id)

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
  const numbers = lcNumbers.data?.items ?? []
  const lcNumber = numbers.length > 0 ? numbers[0].lc_number : null

  // One automatic attempt per company. Without the guard the mutation would re-fire on every
  // render while it is in flight, and a failure would retry forever instead of surfacing.
  const onBindRef = useRef(onBind)
  const attemptedRef = useRef<string | null>(null)
  useEffect(() => {
    onBindRef.current = onBind
  })
  useEffect(() => {
    if (lcNumber === null) return
    if (attemptedRef.current === partner.id) return
    attemptedRef.current = partner.id
    onBindRef.current(lcNumber)
  }, [partner.id, lcNumber])

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

  /**
   * A company with no dealer number cannot be bound — but this is not an error the user caused, so
   * it does not shout.
   *
   * It had been a red destructive alert, which read like a validation failure on a screen where the
   * user had simply picked a name from a list. The dummy never shows anything of the sort because
   * its picker cannot offer such a company in the first place: its eligibility rule requires at
   * least one dealer number. This app cannot filter the same way — `/framework-agreements/lc-partners`
   * returns `{id, legal_name}` and the numbers live behind a per-partner request, so pre-filtering
   * the dropdown would mean one request per company.
   *
   * So the state stays reachable in principle and says so quietly. It is not reachable in the
   * prototype: every company in the mock now holds a number, matching the dummy.
   */
  if (lcNumber === null) {
    return (
      <p
        className="text-sm text-muted-foreground"
        data-testid="case-wizard-lc-no-numbers"
      >
        {t("wizard.company.noLcNumber.description", {
          name: partner.legal_name,
        })}
      </p>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
      <div className="text-sm">
        <p className="font-medium">{partner.legal_name}</p>
        <p className="text-muted-foreground">
          {t("wizard.company.lcNumber", { number: lcNumber })}
        </p>
      </div>
      {isBinding ? (
        <span
          className="text-sm text-muted-foreground"
          data-testid="case-wizard-lc-binding"
        >
          {t("wizard.company.binding")}
        </span>
      ) : (
        bindError !== null &&
        bindError !== undefined && (
          <div className="flex items-center gap-3">
            <p
              className="text-sm text-destructive"
              data-testid="case-wizard-bind-lc-error"
            >
              {resolveApiErrorMessage(bindError, t)}
            </p>
            <Button
              variant="outline"
              size="sm"
              data-testid="case-wizard-bind-lc-button"
              onClick={() => onBind(lcNumber)}
            >
              {t("wizard.company.retryBind")}
            </Button>
          </div>
        )
      )}
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
  hideBankOnlyFigures = false,
}: {
  leasingCompany: CaseLeasingCompanyResponse
  /**
   * A portal user does not see the bank's own figures on the agreement. The click dummy hides the
   * refinancing quota and the utilisation pair from `lc_user`; the quota is the one of those this
   * response actually carries.
   */
  hideBankOnlyFigures?: boolean
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
        {!hideBankOnlyFigures && (
          <Row
            label={t("wizard.company.refinancingQuota")}
            value={formatDecimalPercent(leasingCompany.refinancing_quota)}
          />
        )}
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

      {/* The click dummy resolves this rather than asking: "One framework agreement per leasing
          company is active at a time, and the template follows the agreement. Both resolve from the
          company; neither is offered as a choice."
 
          It can only be honoured when the agreement allows exactly one template. Picking one out of
          several would need the agreement's pinned version, and that is not on the wire —
          `SelectableTemplateItem` carries no pinned flag, and CR-FA-05 is recorded as still
          backend-blocked (Q-063 / Q-068). So one template resolves; several still ask, because the
          alternative is choosing for the user on no evidence. */}
      {allowed.templates.length === 1 ? (
        <ResolvedTemplate
          template={allowed.templates[0]}
          onResolved={onSelect}
        />
      ) : (
        <>
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
        </>
      )}
    </section>
  )
}

/**
 * The template as a **resolved value**, not a choice — the dummy's `resolved()` field with its
 * "Set by the framework agreement." hint.
 *
 * It reports itself upward on mount so Continue is satisfied without the user picking something
 * there was never a choice about. Reported in an effect rather than during render, because
 * `onSelect` sets state in the parent.
 */
function ResolvedTemplate({
  template,
  onResolved,
}: {
  template: SelectableTemplateItem
  onResolved: (productTemplateId: string) => void
}) {
  const { t } = useTranslation("cases")

  /**
   * Reported once per template, and never again.
   *
   * `onResolved` is an inline arrow in the parent that fires the bind mutation, so its identity
   * changes on every render. Depending on it re-ran this effect each render and bound the template
   * in a loop until the wizard crashed. The callback is therefore read through a ref, and a second
   * ref records which id has already been reported so a re-render cannot re-fire it.
   */
  const onResolvedRef = useRef(onResolved)
  const reportedRef = useRef<string | null>(null)

  useEffect(() => {
    onResolvedRef.current = onResolved
  })

  useEffect(() => {
    if (reportedRef.current === template.template_id) return
    reportedRef.current = template.template_id
    onResolvedRef.current(template.template_id)
  }, [template.template_id])

  return (
    <div data-testid="case-wizard-template-resolved">
      <p className="text-xs text-muted-foreground">
        {t("wizard.company.templateLabel")}
      </p>
      <p className="mt-0.5 text-sm font-medium">
        {templateOptionLabel(template)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("wizard.company.templateResolved")}
      </p>
    </div>
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
