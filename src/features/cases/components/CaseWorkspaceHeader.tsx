import { useTranslation } from "react-i18next"
import { Box, Briefcase, Calendar, Files, Landmark } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { CaseStatusBadge } from "@/features/cases/components/CaseStatusBadge"
import { useFinancingOverview } from "@/features/financing/hooks/useFinancingOverview"
import type { CaseResponse } from "@/features/cases/api/schema"

/**
 * The case workspace's identity header.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * The click dummy's `ehead` block, which supersedes the earlier Figma frames where they differ:
 *
 *   REFINANCING REQUEST                                          [ Actions ▾ ]
 *   RR-2026-104  ● Submitted
 *   🗂 Case Open · 🏦 Financing does not exist yet · 📄 Contracts 134 · 📦 Objects 5 · 📅 Created …
 *
 * Each meta item carries an icon, which is what makes the row scannable rather than a run of
 * label/value pairs.
 *
 * ── WHAT THE DUMMY SHOWS THAT THIS CANNOT, AND WHAT IT DROPPED ─────────────────────────────
 * The dummy has a **Request** chip beside Case and Financing, reading its own `c.rs`. There is no
 * such field: `CaseResponse` carries `case_status` and the *derived* `display_status`, and the
 * derivation folds the request's and the financing's own statuses into that one value — the same
 * reason `caseTransitions.ts` refuses to reconstruct them. Rendering a third chip would mean
 * inventing the split, so the request's state stays where the contract puts it, in the badge.
 *
 * The dummy has **no Payout amount** item, and this no longer renders one. It had been a permanent
 * em-dash since the screen shipped: the field was in the Figma frame, no endpoint carried it, and
 * `financing_amount` is a different figure that it would have been wrong to relabel.
 *
 * `Objects` now reads the financing's own `object_count` instead of a dash, and the financing chip
 * links to the financing when one exists. A case with no financing yet 404s that query, which is an
 * ordinary state and the source of the dummy's "does not exist yet".
 */

type Props = {
  caseData: CaseResponse
  contractCount: number | undefined
  actions?: React.ReactNode
}

export function CaseWorkspaceHeader({
  caseData,
  contractCount,
  actions,
}: Props) {
  const financing = useFinancingOverview(caseData.id)
  const { t } = useTranslation("cases")
  const none = t("workspace.meta.none")

  const createdAt = new Date(caseData.created_at)
  const created = Number.isNaN(createdAt.getTime())
    ? caseData.created_at
    : createdAt.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })

  return (
    <div className="flex flex-col gap-3" data-testid="case-workspace-header">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p
            className="text-xs font-semibold tracking-wide text-primary"
            data-testid="case-workspace-eyebrow"
          >
            {t(
              `workspace.eyebrow.${caseData.case_type}` as "workspace.eyebrow.refinancing_request",
              { defaultValue: caseData.case_type }
            )}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {caseData.case_reference}
            </h1>
            <CaseStatusBadge status={caseData.display_status} />
          </div>
        </div>
        {actions}
      </div>

      <dl
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm"
        data-testid="case-workspace-meta"
      >
        <MetaItem
          icon={Briefcase}
          label={t("workspace.meta.case")}
          value={t(
            `displayStatuses.${caseData.case_status}` as "displayStatuses.open",
            { defaultValue: caseData.case_status }
          )}
        />
        <MetaItem
          icon={Landmark}
          label={t("workspace.meta.financing")}
          testId="case-workspace-meta-financing"
          value={
            financing.isLoading
              ? none
              : financing.data === undefined
                ? t("workspace.meta.noFinancingYet")
                : financing.data.financing_reference
          }
          // Muted when there is nothing there yet, matching the dummy's `none` styling — the
          // absence is the information, and setting it in the same weight as a reference reads
          // as a value.
          //
          // The dummy makes this reference a link to a Financings screen. This app has no such
          // route — the financing is read through the case's own Calculations and Data tabs — so
          // it stays text rather than a link to nowhere.
          isMuted={!financing.isLoading && financing.data === undefined}
        />
        <MetaItem
          icon={Files}
          label={t("workspace.meta.contracts")}
          value={contractCount === undefined ? none : String(contractCount)}
          testId="case-workspace-meta-contracts"
        />
        <MetaItem
          icon={Box}
          label={t("workspace.meta.objects")}
          value={
            financing.data === undefined
              ? none
              : String(financing.data.object_count)
          }
          testId="case-workspace-meta-objects"
        />
        <MetaItem
          icon={Calendar}
          label={t("workspace.meta.created")}
          value={created}
        />
      </dl>
    </div>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  testId,
  isMuted,
}: {
  icon: LucideIcon
  label: string
  value: string
  testId?: string
  isMuted?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={15} className="shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          isMuted ? "text-muted-foreground" : "font-medium text-foreground"
        }
        data-testid={testId}
      >
        {value}
      </dd>
    </div>
  )
}
