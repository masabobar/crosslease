import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { showApiError } from "@/lib/apiErrorMessage"
import { useDecideCase } from "@/features/cases/hooks/useDecideCase"
import {
  DECISION_OUTCOMES,
  canSubmitDecision,
  requiresReason,
} from "@/features/cases/decisionOutcomes"
import type { DecisionOutcome } from "@/features/cases/decisionOutcomes"

type Props = {
  caseId: string
  onOpenChange: (open: boolean) => void
}

/**
 * The step-4 decision (US 1.29) — the hinge of the whole process.
 *
 * ── FOUR OUTCOMES, AGAINST A DESIGN THAT DRAWS TWO ─────────────────────────────────────────────
 * The Figma frame offers Approve / Reject. The client confirmed four on 2026-09-08 (Q-007) and the
 * wire agrees — `StateTransitionOutcome` is exactly those four. AC-04 additionally forbids
 * collapsing *Information missing* into *Internal rework*: one asks the leasing company for
 * something, the other sends the case back inside the bank. They are different instructions to
 * different people, so they are separate buttons here.
 *
 * ── A REASON IS REQUIRED FOR EVERYTHING BUT APPROVAL ───────────────────────────────────────────
 * `reason` is nullable on the wire, so the backend would take a bare refusal. Three of the four
 * outcomes send the case back to somebody who has to know what to do next, and an unexplained one
 * is a dead end — so the reason is required here for those three. Approval needs none: the case is
 * its own record of what was approved.
 *
 * ── WHY THIS IS A CONFIRMATION AND NOT A ONE-CLICK ACTION ──────────────────────────────────────
 * The decision is not reversible from this screen. Approving brings a financing into existence
 * (US 1.32), and the other three move the case out of the decider's hands. So the outcome is
 * chosen, then explained, then submitted — never fired off a single button.
 */
export function CaseDecisionDialog({ caseId, onOpenChange }: Props) {
  const { t } = useTranslation("cases")
  const decide = useDecideCase()
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null)
  const [reason, setReason] = useState("")

  return (
    <DialogModal open onOpenChange={open => !open && onOpenChange(false)}>
      <div className="px-4 py-4">
        <DialogHeader>
          <DialogTitle>{t("decision.title")}</DialogTitle>
          <DialogDescription>{t("decision.subtitle")}</DialogDescription>
        </DialogHeader>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-2" data-testid="decision-outcomes">
          {DECISION_OUTCOMES.map(value => (
            <button
              key={value}
              type="button"
              data-testid={`decision-outcome-${value}`}
              onClick={() => setOutcome(value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                outcome === value && "border-primary bg-accent"
              )}
            >
              {/* NOTE: raw <button> — a selectable option row, not an action button. shadcn Button
                  centres its content and fixes a height, both wrong for a two-line option. */}
              <span className="block font-medium">
                {t(
                  `decision.outcomes.${value}.label` as "decision.outcomes.committed.label"
                )}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t(
                  `decision.outcomes.${value}.description` as "decision.outcomes.committed.description"
                )}
              </span>
            </button>
          ))}
        </div>

        {outcome !== null && (
          <div>
            <Label htmlFor="decision-reason" className="mb-1.5">
              {requiresReason(outcome)
                ? t("decision.reasonRequired")
                : t("decision.reasonOptional")}
            </Label>
            <Textarea
              id="decision-reason"
              rows={3}
              value={reason}
              data-testid="decision-reason-input"
              placeholder={t("decision.reasonPlaceholder")}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        )}

        {/* Said before the click, not after: this cannot be undone from here, and approving is
            what creates the financing. */}
        {outcome !== null && (
          <Alert data-testid="decision-irreversible">
            <AlertDescription>
              {t(
                outcome === "committed"
                  ? "decision.approveWarning"
                  : "decision.sendBackWarning"
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button
          type="button"
          variant="outline"
          data-testid="decision-cancel"
          onClick={() => onOpenChange(false)}
        >
          {t("wizard.actions.cancel")}
        </Button>
        <Button
          type="button"
          data-testid="decision-submit"
          disabled={decide.isPending || !canSubmitDecision(outcome, reason)}
          onClick={() =>
            decide.mutate(
              {
                caseId,
                outcome: outcome as DecisionOutcome,
                reason: reason.trim() === "" ? null : reason.trim(),
              },
              {
                onSuccess: updated => {
                  toast.success(
                    t("decision.recorded", { status: updated.display_status })
                  )
                  onOpenChange(false)
                },
                onError: err => showApiError(err, t),
              }
            )
          }
        >
          {t("decision.submit")}
        </Button>
      </div>
    </DialogModal>
  )
}
