import { useState, useRef, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Activity, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildPageNumbers } from "@/lib/pagination"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ApiError } from "@/lib/api"
import { useGovernedActions } from "@/features/governedActions/hooks/useGovernedActions"
import { useWithdrawAction } from "@/features/governedActions/hooks/useWithdrawAction"
import { useReInitiateAction } from "@/features/governedActions/hooks/useReInitiateAction"
import { ActionRow } from "@/features/governedActions/components/ActionRow"
import { ReviewRequestModal } from "@/features/governedActions/components/ReviewRequestModal"
import { PendingApprovalDetailDrawer } from "@/features/governedActions/components/PendingApprovalDetailDrawer"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useToastStore } from "@/store/toastStore"
import { PATHS } from "@/router/paths"
import {
  canReviewGovernedAction,
  PAGE_SIZES,
} from "@/features/governedActions/constants"
import type { PageSize } from "@/features/governedActions/constants"
import { formatActorName } from "@/features/governedActions/utils"
import { canAccessAuditTrail } from "@/features/audit/types"
import {
  GovernedActionStatusSchema,
  GovernedActionTypeSchema,
  initiatorSnapshot,
  platformInviteSnapshot,
} from "@/features/governedActions/api/schema"
import type {
  GovernedAction,
  GovernedActionStatus,
} from "@/features/governedActions/api/schema"

type Tab = "all" | GovernedActionStatus

const FIRST_PAGE = 1
const DEFAULT_PAGE_SIZE: PageSize = PAGE_SIZES[1]

const TABS: Tab[] = [
  "all",
  GovernedActionStatusSchema.enum.pending,
  GovernedActionStatusSchema.enum.approved,
  GovernedActionStatusSchema.enum.rejected,
  GovernedActionStatusSchema.enum.withdrawn,
  GovernedActionStatusSchema.enum.expired,
]

export default function PendingApprovalsPage() {
  const { t } = useTranslation("pendingApprovals")
  const { showToast } = useToastStore()
  const { data: currentUser } = useCurrentUser()
  const location = useLocation()
  const highlightUserId = (
    location.state as { highlightUserId?: string } | null
  )?.highlightUserId

  const [activeTab, setActiveTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(FIRST_PAGE)
  const [perPage, setPerPage] = useState<PageSize>(DEFAULT_PAGE_SIZE)
  const highlightRowRef = useRef<HTMLDivElement | null>(null)
  const [reviewAction, setReviewAction] = useState<GovernedAction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsAction, setDetailsAction] = useState<GovernedAction | null>(
    null
  )

  const statusFilter =
    activeTab === "all" ? undefined : ([activeTab] as GovernedActionStatus[])

  // `per_page` is sent explicitly: the endpoint's own default is 20, and without a
  // pagination control that silently capped the screen at the first 20 actions.
  const { data, isLoading, isError, refetch, isFetching } = useGovernedActions({
    status: statusFilter,
    page,
    per_page: perPage,
  })

  const withdrawAction = useWithdrawAction()
  const reInitiateAction = useReInitiateAction()

  const actions = data?.actions ?? []

  const highlightedActionId = highlightUserId
    ? (actions.find(a => a.subject_id === highlightUserId)?.id ?? null)
    : null

  // Scroll to the highlighted row once per highlight change — not on every
  // re-render — since the ref callback below only assigns the DOM node and
  // no longer triggers the scroll itself.
  useEffect(() => {
    if (highlightedActionId) {
      highlightRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [highlightedActionId])

  const filtered = search.trim()
    ? actions.filter(a => {
        const q = search.toLowerCase()
        const typeName = t(`actionTypes.${a.action_type}`).toLowerCase()
        const { first_name, last_name } = initiatorSnapshot(a)
        const firstName = first_name?.toLowerCase() ?? ""
        const lastName = last_name?.toLowerCase() ?? ""
        return (
          typeName.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          `${firstName} ${lastName}`.includes(q)
        )
      })
    : actions

  // Both reset to page 1: the current page number is meaningless against a different
  // result set, and landing on a page that no longer exists renders an empty list.
  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setPage(FIRST_PAGE)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(FIRST_PAGE)
  }

  function handlePerPageChange(size: PageSize) {
    setPerPage(size)
    setPage(FIRST_PAGE)
  }

  function handleReview(action: GovernedAction) {
    setReviewAction(action)
    setModalOpen(true)
  }

  function handleWithdraw(action: GovernedAction) {
    withdrawAction.mutate(
      { id: action.id },
      {
        onSuccess: () => {
          showToast({
            variant: "info",
            title: t("toast.withdrawn.title"),
            message: t("toast.withdrawn.message", {
              action: t(`actionTypes.${action.action_type}`),
            }),
          })
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, {
                  defaultValue: t("toast.error.message"),
                })
              : t("toast.error.message")
          )
        },
      }
    )
  }

  function handleReInitiate(action: GovernedAction) {
    reInitiateAction.mutate(
      { id: action.id },
      {
        onSuccess: () => {
          showToast({
            variant: "success",
            title: t("toast.reInitiated.title"),
            message: t("toast.reInitiated.message", {
              action: t(`actionTypes.${action.action_type}`),
            }),
          })
        },
        onError: (err: unknown) => {
          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}`, {
                  defaultValue: t("toast.error.message"),
                })
              : t("toast.error.message")
          )
        },
      }
    )
  }

  function resolvePersonName(action: GovernedAction): string {
    if (
      action.action_type === GovernedActionTypeSchema.enum.user_platform_invite
    ) {
      const display = platformInviteSnapshot(action)
      if (display.full_name) return display.full_name
    }
    return formatActorName(initiatorSnapshot(action))
  }

  function handleApproveSuccess(action: GovernedAction) {
    const actionLabel = t(`actionTypes.${action.action_type}`)
    const name = resolvePersonName(action)
    showToast({
      variant: "success",
      title: t("toast.approved.title"),
      message: t("toast.approved.message", { name, action: actionLabel }),
    })
  }

  function handleViewDetails(action: GovernedAction) {
    setDetailsAction(action)
  }

  function handleRejectSuccess(action: GovernedAction) {
    const actionLabel = t(`actionTypes.${action.action_type}`)
    const name = resolvePersonName(action)
    showToast({
      variant: "error",
      title: t("toast.rejected.title"),
      message: t("toast.rejected.message", { name, action: actionLabel }),
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("page.subtitle")}</p>
      </div>

      {/* Search + View toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Search */}
        <SearchInput
          placeholder={t("search.placeholder")}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          className="w-[288px]"
          data-testid="search-input"
        />

        {/* Status toggle group */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("view", { defaultValue: "View" })}
          </span>
          <div className="flex items-center border border-border rounded-[10px] overflow-hidden h-9">
            {TABS.map((tab, i) => (
              <Button
                key={tab}
                type="button"
                variant="ghost"
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "h-full rounded-none px-2.5 text-sm whitespace-nowrap",
                  activeTab === tab
                    ? "bg-white text-foreground hover:bg-white"
                    : "bg-slate-100 text-foreground hover:bg-slate-200",
                  i === 0 && "rounded-l-[10px]",
                  i === TABS.length - 1 && "rounded-r-[10px]"
                )}
                data-testid={`tab-${tab}`}
              >
                {t(`tabs.${tab}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {isError && !isLoading && (
          <div
            className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground"
            data-testid="actions-load-error"
          >
            {t("page.loadError")}
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
              data-testid="actions-load-retry"
            >
              {t("page.retry")}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("loading", { defaultValue: "Loading…" })}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div
            className="flex flex-col items-center gap-4 py-12 border border-border rounded-[10px] bg-card"
            data-testid="empty-state"
          >
            {activeTab === "all" && !search.trim() ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-[14px] bg-green-500/10">
                  <Check size={24} className="text-green-600" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {t("empty.allCaughtUp.title")}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-[364px]">
                    {t("empty.allCaughtUp.subtitle")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {t("empty.filtered.title")}
                </p>
                <p className="text-sm text-muted-foreground max-w-[364px]">
                  {/* Search is client-side over the loaded page — GET /governed-actions
                      exposes no search parameter (only status / action_type /
                      subject_type / initiator_id / page / per_page), so a match on
                      another page cannot be found from here. The copy says so rather
                      than implying the request does not exist. */}
                  {search.trim()
                    ? t("empty.filtered.searchSubtitle")
                    : t("empty.filtered.subtitle")}
                </p>
              </div>
            )}
            {canAccessAuditTrail(currentUser?.role) && (
              <Link
                to={PATHS.AUDIT_TRAIL}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto gap-1.5 rounded-[12px] px-2.5 py-2 text-sm"
                )}
              >
                <Activity size={16} />
                {t("empty.viewAuditLog")}
              </Link>
            )}
          </div>
        )}

        {!isLoading &&
          filtered.map(action => (
            <ActionRow
              key={action.id}
              action={action}
              currentUserId={currentUser?.id ?? ""}
              canReview={canReviewGovernedAction(
                action.action_type,
                currentUser?.role
              )}
              isHighlighted={action.id === highlightedActionId}
              ref={
                action.id === highlightedActionId
                  ? (el: HTMLDivElement | null) => {
                      highlightRowRef.current = el
                    }
                  : undefined
              }
              onReview={handleReview}
              onWithdraw={handleWithdraw}
              onReInitiate={handleReInitiate}
              onViewDetails={handleViewDetails}
            />
          ))}
      </div>

      {/* Pagination — shown whenever a page loaded, so the row-count control stays
          reachable even on a single-page result set */}
      {data && !isError && (
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {t("page.pagination.rowsPerPage")}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={v => handlePerPageChange(Number(v) as PageSize)}
            >
              <SelectTrigger
                data-testid="pagination-page-size-select"
                className="h-8 rounded-xl px-2 text-xs w-auto gap-1"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NOTE: Button children rather than shadcn PaginationLink — PaginationLink
              renders an <a>, and these controls change page state in place rather than
              navigating, so an anchor would be a false affordance. The Pagination /
              PaginationContent / PaginationItem wrappers still supply the nav + list
              semantics. Same reasoning as UserManagementPage. */}
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  data-testid="pagination-prev-button"
                  onClick={() => setPage(Math.max(FIRST_PAGE, page - 1))}
                  disabled={page === FIRST_PAGE}
                  className="h-8 gap-1.5 rounded-xl pl-1.5 pr-2.5 text-sm"
                >
                  <ChevronLeft size={16} />
                  {t("page.pagination.previous")}
                </Button>
              </PaginationItem>

              {buildPageNumbers(page, data.total_pages).map((item, idx) => (
                <PaginationItem key={item === "..." ? `ellipsis-${idx}` : item}>
                  {item === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <Button
                      variant={item === page ? "outline" : "ghost"}
                      data-testid={`pagination-page-${item}`}
                      onClick={() => setPage(item)}
                      className="size-8 rounded-xl p-0 text-sm"
                    >
                      {item}
                    </Button>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <Button
                  variant="ghost"
                  data-testid="pagination-next-button"
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page >= data.total_pages}
                  className="h-8 gap-1.5 rounded-xl pl-2.5 pr-1.5 text-sm"
                >
                  {t("page.pagination.next")}
                  <ChevronRight size={16} />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Details drawer */}
      <PendingApprovalDetailDrawer
        open={!!detailsAction}
        onClose={() => setDetailsAction(null)}
        action={detailsAction}
      />

      {/* Review modal */}
      <ReviewRequestModal
        open={modalOpen}
        onOpenChange={open => {
          setModalOpen(open)
          if (!open) setReviewAction(null)
        }}
        action={reviewAction}
        onApproveSuccess={handleApproveSuccess}
        onRejectSuccess={handleRejectSuccess}
      />
    </div>
  )
}
