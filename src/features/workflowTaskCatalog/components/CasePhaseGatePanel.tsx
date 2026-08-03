import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/formatters"
import { CasePhaseGateStatusBadge } from "@/features/workflowTaskCatalog/components/CaseChecklistStatusBadge"
import { SetPhaseGateDialog } from "@/features/workflowTaskCatalog/components/SetPhaseGateDialog"
import { CASE_PHASE_ORDER } from "@/features/workflowTaskCatalog/constants"
import { PhaseGateStatusSchema } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { PhaseGateResponse } from "@/features/workflowTaskCatalog/api/runtimeSchema"
import type { StageCategorization } from "@/features/workflowTaskCatalog/api/schema"
import type { UserListItem } from "@/features/users/api/schema"

type Props = {
  businessObjectId: string
  gates: readonly PhaseGateResponse[]
  canDecide: boolean
  users: readonly UserListItem[]
}

function CasePhaseGatePanel({
  businessObjectId,
  gates,
  canDecide,
  users,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [activePhase, setActivePhase] = useState<StageCategorization | null>(
    null
  )
  const notApplicable = t("caseChecklist.notApplicable")

  function resolveActor(userId: string | null): string {
    if (!userId) return notApplicable
    const user = users.find(u => u.id === userId)
    return user ? `${user.first_name} ${user.last_name}` : userId
  }

  return (
    <>
      <div className="flex flex-col gap-1 mb-4">
        <h2 className="text-lg font-medium text-foreground">
          {t("caseChecklist.gates.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("caseChecklist.gates.subtitle")}
        </p>
      </div>

      {/* All six phases are listed because StageCategorization is a closed enum on the wire and a
          gate has to be reachable before anyone has decided it. But a phase with no gate renders
          an explicit "not set" rather than an `Open` badge: the gate row is created lazily on first
          decision, so inventing `Open` would show a state the backend does not hold — the thing CR
          PRD1042-1792's "statuses that must never render" forbids. */}
      <div className="border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("caseChecklist.gates.columns.phase")}</TableHead>
              <TableHead>{t("caseChecklist.gates.columns.status")}</TableHead>
              <TableHead>{t("caseChecklist.gates.columns.approver")}</TableHead>
              <TableHead>
                {t("caseChecklist.gates.columns.decidedAt")}
              </TableHead>
              <TableHead>{t("caseChecklist.gates.columns.note")}</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {CASE_PHASE_ORDER.map(phase => {
              const gate = gates.find(g => g.phase === phase) ?? null
              // `approved` is terminal server-side, so no further decision is offered on it.
              // `rejected` may be reopened, which is why it keeps its control.
              const isTerminal =
                gate?.status === PhaseGateStatusSchema.enum.approved

              return (
                <TableRow
                  key={phase}
                  data-testid={`case-phase-gate-row-${phase}`}
                >
                  <TableCell className="font-medium text-foreground">
                    {t(
                      `detail.taskSheet.stages.${phase}` as "detail.taskSheet.stages.pre_submission"
                    )}
                  </TableCell>
                  <TableCell>
                    {gate ? (
                      <CasePhaseGateStatusBadge status={gate.status} />
                    ) : (
                      <span
                        data-testid={`case-phase-gate-not-set-${phase}`}
                        className="text-sm text-muted-foreground"
                      >
                        {t("caseChecklist.gates.notSet")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {resolveActor(gate?.gate_approver ?? null)}
                  </TableCell>
                  <TableCell>
                    {gate?.decided_at
                      ? formatDateTime(gate.decided_at)
                      : notApplicable}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm text-muted-foreground">
                      {gate?.note ?? notApplicable}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canDecide && !isTerminal && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`case-phase-gate-decide-${phase}`}
                        onClick={() => setActivePhase(phase)}
                      >
                        {t("caseChecklist.gates.actions.decide")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {activePhase && (
        <SetPhaseGateDialog
          businessObjectId={businessObjectId}
          phase={activePhase}
          onOpenChange={open => !open && setActivePhase(null)}
        />
      )}
    </>
  )
}

export { CasePhaseGatePanel }
