import { useState } from "react"
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
import { LesseeTab } from "@/features/cases/components/steps/LesseeTab"
import { ObjectTab } from "@/features/cases/components/steps/ObjectTab"

// The design's four tabs, in its order.
const MANUAL_ENTRY_TABS = [
  "lessee",
  "object",
  "contractDetails",
  "cashFlow",
] as const

type ManualEntryTab = (typeof MANUAL_ENTRY_TABS)[number]

type Props = {
  caseId: string
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
  onOpenChange,
  onSaved,
}: Props) {
  const { t } = useTranslation("cases")
  const queryClient = useQueryClient()
  // Opens on the design's first tab now that it is built.
  const [tab, setTab] = useState<ManualEntryTab>("lessee")
  const [contractId, setContractId] = useState<string | null>(null)
  const [isCreating, setCreating] = useState(false)

  // Created on demand rather than on mount, so opening the modal and closing it again without
  // touching anything leaves nothing behind.
  async function ensureContract(): Promise<string | null> {
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
    <DialogModal open onOpenChange={open => !open && onOpenChange(false)}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("wizard.manual.title")}</DialogTitle>
        </DialogHeader>
      </div>

      <UnderlineTabBar
        tabs={MANUAL_ENTRY_TABS.map(key => ({
          key,
          label: t(`wizard.manual.tabs.${key}` as "wizard.manual.tabs.object"),
          testId: `manual-entry-tab-${key}`,
        }))}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
        {isCreating && <Skeleton className="h-40 w-full" />}

        {tab === "lessee" && !isCreating && (
          <LesseeTab contractId={contractId} onNeedContract={ensureContract} />
        )}

        {tab === "object" && !isCreating && (
          <ObjectTab contractId={contractId} onNeedContract={ensureContract} />
        )}

        {tab === "contractDetails" && !isCreating && (
          <ContractDetailsTab
            caseId={caseId}
            contractId={contractId}
            onNeedContract={ensureContract}
          />
        )}

        {tab === "cashFlow" && !isCreating && (
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
          disabled={contractId === null}
          onClick={() => {
            toast.success(t("wizard.manual.saved"))
            onSaved()
            onOpenChange(false)
          }}
        >
          {t("wizard.manual.save")}
        </Button>
      </div>
    </DialogModal>
  )
}
