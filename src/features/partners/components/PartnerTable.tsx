import { useTranslation } from "react-i18next"
import { TableEmptyState } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Archive, Handshake, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PartnerStatusBadge } from "@/features/partners/components/PartnerStatusBadge"
import { UBO_STATUS_DOT_COLOR } from "@/features/partners/constants"
import {
  PartnerStatusSchema,
  UboCompletenessStatusSchema,
} from "@/features/partners/api/schema"
import type { PartnerListItem } from "@/features/partners/api/schema"
import type { PartnerActionType } from "@/features/partners/types"

// NOTE: this table is a flex/div grid rather than shadcn <Table>. The columns
// below mix fixed widths with flex-grow so every partners table lines up
// column-for-column across tabs; <table>'s own sizing algorithm does not honour
// those constraints. Converting is tracked as a follow-up and needs per-screen
// visual verification, so it is deliberately not a drop-in change.
const COL_NAME = "flex-1 min-w-[200px] max-w-[320px]"
const COL_ROLES = "w-[200px] shrink-0"
const COL_COUNTRY = "w-[90px] shrink-0"
const COL_STATUS = "w-[160px] shrink-0"
const COL_UBO = "w-[130px] shrink-0"
const COL_ACTIONS = "shrink-0 ml-auto flex items-center justify-center p-2"
const ROW_H = "h-[52px]"
const SKELETON_COUNT = 5

type KebabMenuProps = {
  partner: PartnerListItem
  canAction: boolean
  onAction?: (type: PartnerActionType) => void
}

function KebabMenu({ partner, canAction, onAction }: KebabMenuProps) {
  const { t } = useTranslation("partners")

  const canArchive =
    canAction && partner.status === PartnerStatusSchema.enum.confirmed

  if (!canArchive) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        disabled
        className="text-muted-foreground/30 disabled:opacity-100"
      >
        <MoreHorizontal size={16} />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid={`partner-row-menu-${partner.partner_id}`}
        aria-label={t("list.table.actionsMenuLabel")}
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <MoreHorizontal size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          data-testid="partner-action-archive"
          onClick={() => onAction?.("archive")}
        >
          <Archive size={14} className="text-muted-foreground" />
          {t("list.table.actions.archive")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type PartnerTableProps = {
  partners: PartnerListItem[]
  isLoading: boolean
  hasActiveFilters: boolean
  canAction?: boolean
  onAction?: (type: PartnerActionType, partner: PartnerListItem) => void
  onRowClick?: (partner: PartnerListItem) => void
  onSubmitPartner?: () => void
}

function PartnerTable({
  partners,
  isLoading,
  hasActiveFilters,
  canAction = false,
  onAction,
  onRowClick,
  onSubmitPartner,
}: PartnerTableProps) {
  const { t } = useTranslation("partners")

  return (
    <div
      className="w-full border border-border rounded-[10px] overflow-hidden bg-background"
      data-testid="partner-table"
    >
      {/* Header */}
      <div className="flex border-b border-border h-10 items-center">
        <div className={`${COL_NAME} text-sm font-medium text-foreground px-2`}>
          {t("list.table.columns.name")}
        </div>
        <div
          className={`${COL_ROLES} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.role")}
        </div>
        <div
          className={`${COL_COUNTRY} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.country")}
        </div>
        <div
          className={`${COL_STATUS} text-sm font-medium text-foreground px-2`}
        >
          {t("list.table.columns.status")}
        </div>
        <div className={`${COL_UBO} text-sm font-medium text-foreground px-2`}>
          {t("list.table.columns.uboStatus")}
        </div>
        <div className={COL_ACTIONS} />
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div data-testid="partner-table-loading">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div
              key={i}
              className={`flex border-b border-border ${ROW_H} items-center`}
            >
              <div className={`${COL_NAME} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-40 mb-1" />
                <div className="bg-muted rounded h-3 animate-pulse w-24" />
              </div>
              <div className={`${COL_ROLES} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-28" />
              </div>
              <div className={`${COL_COUNTRY} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-8" />
              </div>
              <div className={`${COL_STATUS} p-2`}>
                <div className="bg-muted rounded-full h-5 animate-pulse w-20" />
              </div>
              <div className={`${COL_UBO} p-2`}>
                <div className="bg-muted rounded h-4 animate-pulse w-16" />
              </div>
              <div className={COL_ACTIONS} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading &&
        partners.length === 0 &&
        (hasActiveFilters ? (
          <TableEmptyState
            title={t("list.emptyFiltered.title")}
            description={t("list.emptyFiltered.description")}
          />
        ) : (
          <TableEmptyState
            title={t("list.emptyState.title")}
            description={t("list.emptyState.description")}
            action={
              onSubmitPartner && (
                <Button
                  onClick={onSubmitPartner}
                  data-testid="partner-empty-state-submit-button"
                  className="h-9 rounded-xl px-4 gap-1.5"
                >
                  <Handshake size={16} />
                  {t("list.addButton")}
                </Button>
              )
            }
          />
        ))}

      {/* Data rows */}
      {!isLoading &&
        partners.map(partner => (
          <div
            key={partner.partner_id}
            data-testid={`partner-row-${partner.partner_id}`}
            onClick={() => onRowClick?.(partner)}
            // A clickable row needs to be reachable without a mouse. NOTE: no
            // shadcn primitive covers "row that navigates" — role/tabIndex/key
            // handling is applied by hand, and only when the row is clickable.
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={
              onRowClick
                ? e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onRowClick(partner)
                    }
                  }
                : undefined
            }
            className={`flex border-b border-border ${ROW_H} items-center hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${onRowClick ? "cursor-pointer" : ""}`}
          >
            <div className={`${COL_NAME} p-2`}>
              <p className="text-sm font-medium truncate text-foreground leading-tight">
                {partner.display_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t(`type.${partner.partner_type}` as "type.legal_entity")}
              </p>
            </div>
            <div className={`${COL_ROLES} p-2`}>
              {partner.roles.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <span className="text-sm text-foreground">
                  {partner.roles
                    // roles is z.array(z.string()) on purpose — rows may carry
                    // historical values dropped from PartnerRoleSchema, so fall
                    // back to the raw value rather than render a bare i18n key.
                    .map(role =>
                      t(`role.${role}` as "role.lessee", { defaultValue: role })
                    )
                    .join(", ")}
                </span>
              )}
            </div>
            <div className={`${COL_COUNTRY} p-2`}>
              <span className="text-sm text-muted-foreground">
                {partner.country ?? "—"}
              </span>
            </div>
            <div className={`${COL_STATUS} p-2`}>
              <PartnerStatusBadge status={partner.status} />
            </div>
            <div className={`${COL_UBO} p-2`}>
              {partner.ubo_completeness_status ===
              UboCompletenessStatusSchema.enum.missing ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <span
                    className={`size-2 rounded-full shrink-0 ${UBO_STATUS_DOT_COLOR[partner.ubo_completeness_status]}`}
                  />
                  {t(
                    `uboStatus.${partner.ubo_completeness_status}` as "uboStatus.complete"
                  )}
                </span>
              )}
            </div>
            <div className={COL_ACTIONS} onClick={e => e.stopPropagation()}>
              <KebabMenu
                partner={partner}
                canAction={canAction}
                onAction={type => onAction?.(type, partner)}
              />
            </div>
          </div>
        ))}
    </div>
  )
}

export { PartnerTable }
