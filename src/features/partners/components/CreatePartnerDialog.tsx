import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogModal, DialogTitle } from "@/components/ui/dialog"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { showApiError } from "@/lib/apiErrorMessage"
import { PartnerSubmitForm } from "@/features/partners/components/PartnerSubmitForm"
import type {
  PartnerFormSection,
  PartnerSubmitFormDraft,
  SubmitResult,
} from "@/features/partners/components/PartnerSubmitForm"
import { MatchingReview } from "@/features/partners/components/MatchingReview"
import {
  addBankAccount,
  addLcNumber,
  matchPartner,
  submitPartner,
} from "@/features/partners/api/partnersApi"
import type {
  MatchPartnerBody,
  PartnerIdentityInput,
  SubmitPartnerBody,
} from "@/features/partners/api/partnersApi"
import type { PartnerMatchResponse } from "@/features/partners/api/schema"
import type { AccountFormValues } from "@/features/partners/components/AccountFormDialog"

const CREATE_FORM_ID = "create-partner-dialog-form"

/**
 * The dummy's tab bar, minus the four tabs that have no endpoint.
 *
 * It draws six — `Party · Assessment · Bank accounts · Connections · Relationships · Documents`.
 * Two of them are real: Party is `POST /tenants/{id}/partners` (with `/partners/match` and
 * `/partners/{id}/lc-numbers`), Bank accounts is `POST /partners/{id}/bank-accounts`.
 *
 * The other four have **nothing** in the contract — no partner-assessment resource, no
 * object-connections resource, no relationship graph (`/partners/{id}/ubo` answers a narrower
 * question), and no partner-document resource. Drawing them would put four tabs in front of a user
 * that collect entries and silently drop them, which `api-first.md` §4 exists to prevent. They are
 * reported as a contract gap instead.
 */
const DEFAULT_TABS: readonly PartnerFormSection[] = ["party", "accounts"]

type Props = {
  tenantId: string
  onOpenChange: (open: boolean) => void
  /** The new partner's id, so the caller can link it to whatever it was picking for. */
  onCreated: (partnerId: string) => void
}

/**
 * **Create partner**, in context — the design's `CREATE PARTNER modal.pdf`, reached from the party
 * picker's "Create new partner" when the registry has no match.
 *
 * ── WHY THIS IS A WRAPPER AND NOT A NEW FORM ───────────────────────────────────────────────────
 * The whole flow already existed as a **page** (`SubmitPartnerPage`): identity fields per partner
 * type, dealer numbers, bank accounts, then the duplicate check (`POST /tenants/{id}/partners/match`)
 * reviewed before the create (`POST /tenants/{id}/partners`). What was missing was any way to reach
 * it *from inside* the manual contract entry modal — so the Lessee tab carried a notice saying
 * create-in-context was not built and pointing at the registry, which meant abandoning a
 * half-entered contract to go and add a party.
 *
 * So this reuses `PartnerSubmitForm` and `MatchingReview` unchanged and differs from the page in
 * exactly one way: it hands the new partner's id back to the caller instead of navigating to the
 * partner's detail screen. Rebuilding the form here would have produced a second identity form to
 * keep in step with the first.
 *
 * ── THE DUPLICATE CHECK IS NOT SKIPPED ─────────────────────────────────────────────────────────
 * The design's `Check for duplicates` is this flow's second phase, and it stays mandatory in the
 * dialog. Creating a party in context is exactly where a duplicate is most likely — the user is
 * mid-contract and did not find the company by name — so skipping the review to save a click here
 * would seed the registry with the duplicates the whole Partner Duplicates module exists to clean
 * up.
 *
 * ── A NEW PARTNER IS NOT CONFIRMED, AND THAT IS VISIBLE ────────────────────────────────────────
 * `submitPartner` creates it **pending confirmation**, and the party picker's search is filtered to
 * confirmed partners on purpose — so a party created here is deliberately something the search
 * would not have offered.
 *
 * What surfaces it is `partner_status` on the link response, **not** `is_new`. `is_new` means the
 * link itself created the partner, which only happens on the `identity` branch this flow does not
 * use: creating through the registry and then linking by id correctly reports `is_new: false`. The
 * Lessee and Guarantor sections read `partner_status` and say so when it is not confirmed.
 */
export function CreatePartnerDialog({
  tenantId,
  onOpenChange,
  onCreated,
}: Props) {
  const { t } = useTranslation("partners")
  const { t: tCases } = useTranslation("cases")

  const [view, setView] = useState<"form" | "matching">("form")
  const [tab, setTab] = useState<PartnerFormSection>("party")
  // The form reports which sections it has; a natural person has no accounts, so the tab goes
  // rather than sitting over an empty panel.
  const [tabs, setTabs] = useState<readonly PartnerFormSection[]>(DEFAULT_TABS)
  const [pending, setPending] = useState<{
    identity: PartnerIdentityInput
  } | null>(null)
  // Outlives `pending` on purpose: the form is unmounted while the review is on screen, so this is
  // what restores the user's entry when the match fails or they cancel out.
  const [draft, setDraft] = useState<PartnerSubmitFormDraft | null>(null)
  const [matchResult, setMatchResult] = useState<PartnerMatchResponse | null>(
    null
  )
  const [dealerNumbers, setDealerNumbers] = useState<string[]>([])
  const [bankAccounts, setBankAccounts] = useState<AccountFormValues[]>([])

  const matchMutation = useMutation({
    mutationFn: (body: MatchPartnerBody) => matchPartner(tenantId, body),
    onError: err => {
      showApiError(err, t, t("submit.errors.matchFailed"))
      setView("form")
    },
  })

  // The two follow-on writes are per-entry and independent of the create: a dealer number that
  // fails to attach must not read as a failed partner creation, so each surfaces its own error and
  // the partner still exists. Same handling as the page.
  const addLcNumberMutation = useMutation({
    mutationFn: ({
      partnerId,
      lcNumber,
    }: {
      partnerId: string
      lcNumber: string
    }) => addLcNumber(partnerId, { lc_number: lcNumber }),
    onError: (err, variables) =>
      showApiError(
        err,
        t,
        t("submit.errors.lcNumberAddFailed", { number: variables.lcNumber })
      ),
  })

  const addBankAccountMutation = useMutation({
    mutationFn: ({
      partnerId,
      account,
    }: {
      partnerId: string
      account: AccountFormValues
    }) => addBankAccount(partnerId, account),
    onError: (err, variables) =>
      showApiError(
        err,
        t,
        t("submit.errors.bankAccountAddFailed", {
          iban: variables.account.iban,
        })
      ),
  })

  const submitMutation = useMutation({
    mutationFn: (body: SubmitPartnerBody) => submitPartner(tenantId, body),
    onSuccess: result => {
      dealerNumbers.forEach(lcNumber => {
        addLcNumberMutation.mutate({ partnerId: result.partner_id, lcNumber })
      })
      bankAccounts.forEach(account => {
        addBankAccountMutation.mutate({ partnerId: result.partner_id, account })
      })
      toast.success(tCases("wizard.manual.parties.partnerCreated"))
      onCreated(result.partner_id)
      onOpenChange(false)
    },
    onError: err => showApiError(err, t, t("submit.errors.submitFailed")),
  })

  async function handleFormSubmit({
    identity,
    draft: values,
    dealerNumbers: lcNumbers,
    bankAccounts: accounts,
  }: SubmitResult) {
    setDraft(values)
    setPending({ identity })
    setDealerNumbers(lcNumbers)
    setBankAccounts(accounts)
    setMatchResult(null)
    setView("matching")
    try {
      const result = await matchMutation.mutateAsync({ identity })
      if (result) setMatchResult(result)
    } catch {
      // onError above already surfaces the message; caught only to avoid an unhandled rejection.
    }
  }

  return (
    <DialogModal open onOpenChange={open => !open && onOpenChange(false)}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>
            {tCases("wizard.manual.parties.createPartnerTitle")}
          </DialogTitle>
        </DialogHeader>
      </div>

      {/* The tab bar belongs to the form phase. The matching review is a decision about what was
          entered, not another place to enter it. */}
      {view === "form" && (
        <UnderlineTabBar
          tabs={tabs.map(key => ({
            key,
            label: tCases(
              `wizard.manual.parties.createPartnerTabs.${key}` as "wizard.manual.parties.createPartnerTabs.party"
            ),
            testId: `create-partner-tab-${key}`,
          }))}
          activeTab={tab}
          onChange={setTab}
        />
      )}

      <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
        {view === "form" ? (
          <PartnerSubmitForm
            formId={CREATE_FORM_ID}
            onSubmit={handleFormSubmit}
            initialDraft={draft}
            visibleSection={tab}
            onAvailableSectionsChange={next => {
              setTabs(next)
              // Switching to a person while sitting on Bank accounts would leave the modal on a
              // tab that no longer exists.
              setTab(current => (next.includes(current) ? current : "party"))
            }}
            partyFooter={
              /* The dummy's box at the foot of the Party tab: the note about which identifier
                 actually identifies the party, and the Check-for-duplicates button beside it.

                 It submits the form, exactly as the footer's Save party does, and that is not a
                 duplicated control by accident — the check IS how a party gets saved here. The
                 platform will not create one without it, so "check" and "save" reach the same
                 review; the dummy's own Save party could not skip it either. */
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {tCases("wizard.manual.parties.identifierHint")}
                </p>
                <Button
                  type="submit"
                  form={CREATE_FORM_ID}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={matchMutation.isPending}
                  data-testid="create-partner-check-duplicates"
                >
                  {tCases("wizard.manual.parties.checkForDuplicates")}
                </Button>
              </div>
            }
          />
        ) : (
          pending && (
            <MatchingReview
              matchResult={matchResult}
              identity={pending.identity}
              isSubmitting={submitMutation.isPending}
              onConfirmCreate={() => submitMutation.mutate(pending)}
              onCancel={() => {
                setView("form")
                setMatchResult(null)
                setPending(null)
              }}
            />
          )
        )}
      </div>

      {/* Only the form phase gets a footer. `MatchingReview` carries its own confirm and cancel,
          and a second pair below them would leave two Cancels on one surface. */}
      {view === "form" && (
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            data-testid="create-partner-dialog-cancel"
            onClick={() => onOpenChange(false)}
          >
            {t("submit.form.cancel")}
          </Button>
          <Button
            type="submit"
            form={CREATE_FORM_ID}
            disabled={matchMutation.isPending}
            data-testid="create-partner-dialog-submit"
          >
            {matchMutation.isPending
              ? t("submit.form.submitting")
              : tCases("wizard.manual.parties.saveParty")}
          </Button>
        </div>
      )}
    </DialogModal>
  )
}
