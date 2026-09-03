import { useTranslation } from "react-i18next"
import { phaseLetter } from "@/features/cases/utils"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { CaseProgressResponse } from "@/features/cases/api/schema"

/**
 * The case workspace's progress band.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * Built from Figma `npZleFhoF9pXP8x1kVCw88` (E1–E3: Ref Request / Financing), frames
 * `Add convenant` (230:11380) and `BO approval` (230:11589) — the band above the tab bar:
 *
 *   Progress · 2/44 (5%)
 *   (A)━━━━━━━━(B)────────(C)────────(D)────────(E)
 *   Application &   Settlement   Data entry &   Approval &    Post-processing
 *   credit review   documents    loan setup     disbursement  & archive
 *        2/4           0/8          0/11           0/9            0/12
 *
 * A completed connector renders filled, the current node is ringed. Phase letters come from
 * `position`, not from the name — the wire orders the phases and the letter is presentation.
 *
 * The counts are whatever `GET /cases/{id}/progress` returns; nothing is derived here. Note the
 * design shows five phases (A–E) while `StageCategorizationSchema` carries six stages — the band
 * renders what the wire sends rather than forcing either model, so a sixth phase appears as (F).
 */

type Props = {
  progress: CaseProgressResponse | undefined
  isLoading: boolean
}

export function CaseProgressBand({ progress, isLoading }: Props) {
  const { t } = useTranslation("cases")

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    )
  }

  // No band rather than an empty one: a case whose progress the backend cannot report should not
  // render a stepper with zero phases, which reads as "no work to do".
  if (!progress || progress.phases.length === 0) return null

  return (
    <div
      className="rounded-lg border border-border bg-card p-5"
      data-testid="case-progress-band"
    >
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-medium text-foreground">
          {t("workspace.progress.label")}
        </span>
        <span
          className="text-muted-foreground"
          data-testid="case-progress-summary"
        >
          {t("workspace.progress.summary", {
            done: progress.overall_done,
            total: progress.overall_applicable,
            percent: progress.percent_complete,
          })}
        </span>
      </div>

      <ol className="mt-5 flex items-start" data-testid="case-progress-phases">
        {progress.phases.map((phase, index) => {
          const isLast = index === progress.phases.length - 1
          return (
            <li
              key={`${phase.position ?? index}-${phase.phase_name ?? index}`}
              className={cn("flex flex-col items-center", !isLast && "flex-1")}
              data-testid={`case-progress-phase-${phaseLetter(phase.position, index)}`}
            >
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-content-center rounded-full border text-xs font-medium",
                    phase.is_complete
                      ? "border-success bg-success/10 text-success"
                      : phase.is_current
                        ? "border-primary text-primary ring-2 ring-primary/20"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {phaseLetter(phase.position, index)}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "mx-1 h-0.5 flex-1 rounded",
                      phase.is_complete ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>

              <div
                className={cn(
                  "mt-2 px-1 text-center",
                  // The last node has no connector, so its label is not centred under a full cell —
                  // a fixed width keeps the row from collapsing onto it.
                  isLast ? "w-32" : "w-full"
                )}
              >
                <p className="text-xs font-medium leading-4 text-foreground">
                  {phase.phase_name ?? t("workspace.progress.unnamedPhase")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {phase.steps_done}/{phase.steps_applicable}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
