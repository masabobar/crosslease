import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
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
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showApiError } from "@/lib/apiErrorMessage"
import { CaseTypeSchema } from "@/features/cases/api/schema"
import { useClaimCase } from "@/features/cases/hooks/useClaimCase"
import { useRejectCase } from "@/features/cases/hooks/useRejectCase"
import { useTransitionCase } from "@/features/cases/hooks/useTransitionCase"
import {
  isDestructiveTransition,
  isTerminalDisplayStatus,
  offeredTransitions,
} from "@/features/cases/caseTransitions"
import type { CaseTransition } from "@/features/cases/caseTransitions"
import type { CaseResponse } from "@/features/cases/api/schema"

type Props = {
  caseRecord: CaseResponse
  onDecide: () => void
}

/**
 * Every act on the case, behind one `Actions ▾` in the header — the click dummy's own shape.
 *
 * ── WHY ONE MENU AND NOT THE THREE BUTTONS IT REPLACES ─────────────────────────────────────────
 * Take over, Decide and Reject sat as three side-by-side buttons in the header, and the four
 * lifecycle transitions sat as four more buttons inside the Activity tab. So the case's acts were
 * split across two screens by nothing more than where they had been built, and a reader looking for
 * "cancel this case" had to know to open a tab named Activity to find it. The dummy puts all of it
 * in one header menu, which is also where a reader looks.
 *
 * The Activity tab keeps the state read-out and the trail. Reading what happened and making it
 * happen are now in different places on purpose.
 *
 * ── WHAT THE DUMMY OFFERS THAT THIS DOES NOT ───────────────────────────────────────────────────
 * The dummy's menu reads `Approve · Reject · Return to the leasing company · Cancel`.
 *
 *  - **Approve** is not a case endpoint. Approval happens by resolving the four-eyes checklist step
 *    (`A-3`, the sheet's step 4) — which is what actually creates the financing — so this menu
 *    offers `Decide` (US 1.29, the recorded decision) and the approval itself stays on the step.
 *  - **Return to the leasing company** has no endpoint. `POST /cases/{id}/return-to-queue` is a
 *    different act: it releases a claimed case back to the *internal* queue, and it is offered here
 *    under its own name. Per `api-first.md` §4 the LC-facing return is omitted rather than drawn as
 *    a control that cannot work.
 */
export function CaseActionsMenu({ caseRecord, onDecide }: Props) {
  const { t } = useTranslation("cases")
  const claimCase = useClaimCase()
  const rejectCase = useRejectCase()
  const transition = useTransitionCase()
  const [confirming, setConfirming] = useState<CaseTransition | null>(null)

  const isTerminal = isTerminalDisplayStatus(caseRecord.display_status)
  // Claiming, rejecting and deciding all act on a case nobody has taken over yet; the backend
  // 409s each of them once it is claimed or finished, so they are hidden rather than offered.
  const canActOnProposal = caseRecord.owner_user_id === null && !isTerminal
  const isRefinancingRequest =
    caseRecord.case_type === CaseTypeSchema.enum.refinancing_request
  const offered = offeredTransitions(caseRecord.display_status)
  const isBusy =
    claimCase.isPending || rejectCase.isPending || transition.isPending

  function runTransition(which: CaseTransition) {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-testid="case-actions-menu"
          disabled={isBusy}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("actions.menuLabel")}
          <ChevronDown size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {canActOnProposal && (
            <>
              <DropdownMenuItem
                data-testid="case-take-over-button"
                onClick={() =>
                  claimCase.mutate(caseRecord.id, {
                    onSuccess: () => toast.success(t("detail.takeOverSuccess")),
                    onError: err => showApiError(err, t),
                  })
                }
              >
                {t("detail.takeOver")}
              </DropdownMenuItem>

              {/* US 1.29. Deciding is an act on the case, not a view of it. */}
              <DropdownMenuItem
                data-testid="case-decide-button"
                onClick={onDecide}
              >
                {t("decision.title")}
              </DropdownMenuItem>

              {/* Reject only applies to a refinancing request — the only type with a request
                  status. The backend enforces the same; this hides a control that would 409. */}
              {isRefinancingRequest && (
                <DropdownMenuItem
                  data-testid="case-reject-button"
                  onClick={() =>
                    rejectCase.mutate(caseRecord.id, {
                      onSuccess: () => toast.success(t("detail.rejectSuccess")),
                      onError: err => showApiError(err, t),
                    })
                  }
                >
                  {t("detail.reject")}
                </DropdownMenuItem>
              )}

              {offered.length > 0 && <DropdownMenuSeparator />}
            </>
          )}

          {offered.map(which => (
            <DropdownMenuItem
              key={which}
              variant={
                isDestructiveTransition(which) ? "destructive" : undefined
              }
              data-testid={`case-transition-${which}`}
              onClick={() =>
                isDestructiveTransition(which)
                  ? setConfirming(which)
                  : runTransition(which)
              }
            >
              {t(`state.transitions.${which}` as "state.transitions.cancel")}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
              onClick={() => confirming !== null && runTransition(confirming)}
            >
              {t("state.cancelConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
