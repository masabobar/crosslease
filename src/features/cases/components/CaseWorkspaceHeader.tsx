import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { caseDisplayStatusBadgeVariant } from "@/features/cases/types"
import type { CaseResponse } from "@/features/cases/api/schema"

/**
 * The case workspace's identity header.
 *
 * ── DESIGN PROVENANCE ──────────────────────────────────────────────────────────────────────
 * Figma `npZleFhoF9pXP8x1kVCw88`, frames `Add convenant` (230:11380) / `BO approval` (230:11589):
 *
 *   REFINANCING REQUEST                       ← eyebrow, the case type, small caps, primary colour
 *   RR-2026-104  ● Submitted                  ← reference as the page title + the derived status
 *   ┌──────────────────────────────────────┐
 *   │ Case Open · Contracts 134 · Objects 5 · Payout amount — · Created 12 Aug 2025 │
 *   └──────────────────────────────────────┘
 *
 * The eyebrow shows the case TYPE and the badge shows the DERIVED display status, which is the
 * design's own split and matches the spec's separate status sets: `case_status` ("Open") sits in the
 * meta row while `display_status` ("Submitted") is the badge.
 *
 * `Objects` and `Payout amount` render as em-dashes: the design shows them, and the endpoints that
 * carry them (`/cases/{id}/data`'s nested blocks, `/financing/overview`) are not read by this screen
 * yet. Showing the labelled placeholder is the honest state — inventing a number would be worse, and
 * dropping the fields would hide that the design asks for them.
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
            <Badge
              variant={caseDisplayStatusBadgeVariant(caseData.display_status)}
            >
              {t(
                `displayStatuses.${caseData.display_status}` as "displayStatuses.open",
                { defaultValue: caseData.display_status }
              )}
            </Badge>
          </div>
        </div>
        {actions}
      </div>

      <dl
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm"
        data-testid="case-workspace-meta"
      >
        <MetaItem
          label={t("workspace.meta.case")}
          value={t(
            `displayStatuses.${caseData.case_status}` as "displayStatuses.open",
            { defaultValue: caseData.case_status }
          )}
        />
        <MetaItem
          label={t("workspace.meta.contracts")}
          value={contractCount === undefined ? none : String(contractCount)}
          testId="case-workspace-meta-contracts"
        />
        <MetaItem label={t("workspace.meta.objects")} value={none} />
        <MetaItem label={t("workspace.meta.payoutAmount")} value={none} />
        <MetaItem label={t("workspace.meta.created")} value={created} />
      </dl>
    </div>
  )
}

function MetaItem({
  label,
  value,
  testId,
}: {
  label: string
  value: string
  testId?: string
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground" data-testid={testId}>
        {value}
      </dd>
    </div>
  )
}
