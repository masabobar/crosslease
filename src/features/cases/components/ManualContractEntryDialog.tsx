import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { UnderlineTabBar } from "@/components/ui/underline-tabs"
import { showApiError } from "@/lib/apiErrorMessage"
import { createCaseContract } from "@/features/cases/api/casesApi"
import { CASE_QUERY_KEYS } from "@/features/cases/api/casesApi"
import { useQueryClient } from "@tanstack/react-query"
import { CashFlowTab } from "@/features/cases/components/steps/CashFlowTab"
import { ContractDetailsTab } from "@/features/cases/components/steps/ContractDetailsTab"
import {
  GuarantorsTab,
  LesseeTab,
} from "@/features/cases/components/steps/LesseeTab"
import { ObjectTab } from "@/features/cases/components/steps/ObjectTab"

/**
 * The click dummy's tab order (Figma V2, 31 Aug – 1 Sep 2026). Two things in it are decisions
 * rather than layout:
 *
 * - **Guarantors / co-obligors is its own tab**, not a block under Lessee.
 * - **Payment plan is hidden** until the non-linear plan is switched on. The dummy is explicit
 *   about why: *"99 % of contracts are linear and the plan is produced in the background from
 *   start, term, frequency and rate on save… The non-linear case is an edge case reached through
 *   one link, deliberately not designed further."* Showing the table by default would invite
 *   hand-entry for the 99 % that must not have it.
 *
 * The dummy also has a **Collaterals** tab. It is not here: collateral in the contract is
 * case-level — one type, one total, one evidence document — while the dummy's tab is a per-contract
 * list of Type / Value / Guarantor rows. There is no per-contract collateral endpoint and no
 * guarantor-per-collateral field, so the tab would be a form that cannot save (Q-022).
 */
const BASE_MANUAL_ENTRY_TABS = [
  "lessee",
  "guarantors",
  "objects",
  "contractDetails",
] as const

const PAYMENT_PLAN_TAB = "paymentPlan" as const

type ManualEntryTab =
  | (typeof BASE_MANUAL_ENTRY_TABS)[number]
  | typeof PAYMENT_PLAN_TAB

type Props = {
  caseId: string
  /**
   * An existing contract to open for editing.
   *
   * Omitted for the wizard's own "Manual contract entry", which creates one on first write. Passed
   * by the workspace's Contracts tab, where the same four tabs are how a contract already on the
   * case is edited — the dummy's per-row `Edit` opens this, and every tab writes to the same
   * contract-scoped endpoints either way, so there is no second surface to build.
   */
  contractId?: string
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

/**
 * **Manual contract entry** — the second entry route on wizard step 2
 * (`MANUAL CONTRACT ENTRY - Step 2 modal.pdf`), US 1.6–1.9.
 *
 * ── THE CONTRACT IS CREATED BEFORE THE TABS CAN WRITE ──────────────────────────────────────────
 * Every tab writes to a *contract*-scoped endpoint — `POST /contracts/{id}/lessee`,
 * `POST /contracts/{id}/objects`, `PUT .../payment-plan`. None can be called without a contract id,
 * and `ContractCreate` requires no field, so the modal creates an empty contract on open and the
 * tabs fill it. That mirrors how the wizard itself creates the case before step 1.
 *
 * The consequence is honest but worth knowing: cancelling after the contract exists leaves an empty
 * contract on the case. The design's `Cancel` has no delete behind it, and `DELETE /contracts/{id}`
 * is not in the contract, so there is nothing to undo it with — recorded as an open question rather
 * than papered over with a hidden cleanup that cannot actually run.
 *
 * ── WHAT IS BUILT ──────────────────────────────────────────────────────────────────────────────
 * All four tabs: **Lessee** (US 1.6 + US 1.7 — guarantors and co-obligors share the tab),
 * **Object** (US 1.8), **Contract details** (US 1.9) and **Cash flow** (US 1.11).
 *
 * What is still absent inside them is stated on each surface rather than here — chiefly
 * create-partner-in-context on the Lessee tab and the DAT-evidence upload on the Object tab, both
 * because no endpoint supports them yet.
 */
export function ManualContractEntryDialog({
  caseId,
  contractId: existingContractId,
  onOpenChange,
  onSaved,
}: Props) {
  const { t } = useTranslation("cases")
  const queryClient = useQueryClient()
  // Opens on the design's first tab now that it is built.
  const [tab, setTab] = useState<ManualEntryTab>("lessee")
  // Off by default, and the only way to reach the Payment plan tab. A linear plan is produced from
  // the contract's terms on save; this is the edge case, reached deliberately.
  const [isNonLinearPlan, setNonLinearPlan] = useState(false)
  const [contractId, setContractId] = useState<string | null>(
    existingContractId ?? null
  )
  const [isCreating, setCreating] = useState(false)
  const [isSaving, setSaving] = useState(false)
  // Create partner opens on top of this modal. Two popups drawn at once is two modals, not a
  // stacking problem, so this one steps out of the way while that one is up — see DialogModal's
  // `isConcealed`. It stays mounted, so the tab and the contract survive.
  const [isNestedDialogOpen, setNestedDialogOpen] = useState(false)
  // The Contract details tab is the only surface holding unsaved form state, so it hands its
  // submit up and the footer's single Save flushes it. The design has one Save on the modal, not
  // one per tab.
  const submitDetailsRef = useRef<(() => Promise<void>) | null>(null)

  // Created on demand rather than on mount, so opening the modal and closing it again without
  // touching anything leaves nothing behind.
  async function ensureContract(): Promise<string | null> {
    // Already given one in edit mode, so nothing is ever created there.
    if (contractId !== null) return contractId
    setCreating(true)
    try {
      const created = await createCaseContract(caseId, {})
      setContractId(created.id)
      void queryClient.invalidateQueries({
        queryKey: CASE_QUERY_KEYS.contracts(caseId),
      })
      return created.id
    } catch (error) {
      showApiError(error, t)
      return null
    } finally {
      setCreating(false)
    }
  }

  return (
    <DialogModal
      open
      isConcealed={isNestedDialogOpen}
      onOpenChange={open => !open && onOpenChange(false)}
    >
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>
            {t(
              existingContractId === undefined
                ? "wizard.manual.title"
                : "wizard.manual.editTitle"
            )}
          </DialogTitle>
        </DialogHeader>
      </div>

      <UnderlineTabBar
        tabs={[
          ...BASE_MANUAL_ENTRY_TABS,
          ...(isNonLinearPlan ? [PAYMENT_PLAN_TAB] : []),
        ].map(key => ({
          key,
          label: t(`wizard.manual.tabs.${key}` as "wizard.manual.tabs.objects"),
          testId: `manual-entry-tab-${key}`,
        }))}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
        {isCreating && <Skeleton className="h-40 w-full" />}

        {tab === "lessee" && !isCreating && (
          <LesseeTab
            contractId={contractId}
            onNeedContract={ensureContract}
            onNestedDialogOpenChange={setNestedDialogOpen}
          />
        )}

        {tab === "guarantors" && !isCreating && (
          <GuarantorsTab
            contractId={contractId}
            onNeedContract={ensureContract}
            onNestedDialogOpenChange={setNestedDialogOpen}
          />
        )}

        {tab === "objects" && !isCreating && (
          <ObjectTab contractId={contractId} onNeedContract={ensureContract} />
        )}

        {tab === "contractDetails" && !isCreating && (
          <ContractDetailsTab
            caseId={caseId}
            contractId={contractId}
            onNeedContract={ensureContract}
            onRegisterSubmit={submit => {
              submitDetailsRef.current = submit
            }}
            isNonLinearPlan={isNonLinearPlan}
            onToggleNonLinearPlan={() => {
              const next = !isNonLinearPlan
              setNonLinearPlan(next)
              // Switching it off while sitting on the Payment plan tab would leave the modal on a
              // tab that no longer exists. Read through the updater rather than the narrowed `tab`
              // this branch closes over.
              setTab(current =>
                !next && current === PAYMENT_PLAN_TAB
                  ? "contractDetails"
                  : current
              )
            }}
          />
        )}

        {tab === PAYMENT_PLAN_TAB && !isCreating && (
          <CashFlowTab caseId={caseId} contractId={contractId} />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          data-testid="manual-entry-cancel-button"
          onClick={() => onOpenChange(false)}
        >
          {t("wizard.actions.cancel")}
        </Button>
        <Button
          type="button"
          data-testid="manual-entry-save-button"
          disabled={isSaving}
          onClick={async () => {
            setSaving(true)
            try {
              // Nothing has been entered on any tab yet, so there is no contract to save. Creating
              // an empty one here would leave a blank row on the case that cannot be deleted.
              if (contractId === null) {
                toast.error(t("wizard.manual.nothingToSave"))
                return
              }
              // Flush the details form if it has been opened, and stop on a failed write rather
              // than closing over it — a "saved" toast on a contract that was not saved is worse
              // than the error.
              if (submitDetailsRef.current !== null) {
                await submitDetailsRef.current()
              }
              toast.success(t("wizard.manual.saved"))
              onSaved()
              onOpenChange(false)
            } catch {
              // The tab already surfaced the error; the modal stays open so the entry is not lost.
            } finally {
              setSaving(false)
            }
          }}
        >
          {t("wizard.manual.save")}
        </Button>
      </div>
    </DialogModal>
  )
}
