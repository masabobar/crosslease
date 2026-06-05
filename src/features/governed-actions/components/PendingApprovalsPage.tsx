import { useState, useRef } from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Activity, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGovernedActions } from "@/features/governed-actions/hooks/useGovernedActions"
import { useWithdrawAction } from "@/features/governed-actions/hooks/useWithdrawAction"
import { useReInitiateAction } from "@/features/governed-actions/hooks/useReInitiateAction"
import { ActionRow } from "@/features/governed-actions/components/ActionRow"
import { ReviewRequestModal } from "@/features/governed-actions/components/ReviewRequestModal"
import { PendingApprovalDetailDrawer } from "@/features/governed-actions/components/PendingApprovalDetailDrawer"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useToastStore } from "@/store/toastStore"
import type {
  GovernedAction,
  GovernedActionStatus,
} from "@/features/governed-actions/api/schema"

type Tab = "all" | GovernedActionStatus

const TABS: Tab[] = [
  "all",
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "expired",
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
  const highlightRowRef = useRef<HTMLDivElement | null>(null)
  const [reviewAction, setReviewAction] = useState<GovernedAction | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsAction, setDetailsAction] = useState<GovernedAction | null>(
    null
  )

  const statusFilter =
    activeTab === "all" ? undefined : ([activeTab] as GovernedActionStatus[])

  const { data, isLoading } = useGovernedActions({ status: statusFilter })

  const withdrawAction = useWithdrawAction()
  const reInitiateAction = useReInitiateAction()

  const canReview = currentUser?.role === "system_admin"

  const actions = data?.actions ?? []

  const highlightedActionId = highlightUserId
    ? (actions.find(a => a.subject_id === highlightUserId)?.id ?? null)
    : null

  const filtered = search.trim()
    ? actions.filter(a => {
        const q = search.toLowerCase()
        const typeName = t(`actionTypes.${a.action_type}`).toLowerCase()
        const snap = a.initiator_snapshot as Record<string, unknown>
        const firstName =
          typeof snap.first_name === "string"
            ? snap.first_name.toLowerCase()
            : ""
        const lastName =
          typeof snap.last_name === "string" ? snap.last_name.toLowerCase() : ""
        return (
          typeName.includes(q) ||
          firstName.includes(q) ||
          lastName.includes(q) ||
          `${firstName} ${lastName}`.includes(q)
        )
      })
    : actions

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
      }
    )
  }

  function resolvePersonName(action: GovernedAction): string {
    const snap = action.display_snapshot as Record<string, unknown>
    if (typeof snap.full_name === "string") return snap.full_name
    const initiator = action.initiator_snapshot as Record<string, unknown>
    return typeof initiator.first_name === "string"
      ? `${initiator.first_name} ${initiator.last_name}`
      : "—"
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
        <div className="relative w-[288px]">
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-sm border border-border rounded-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="search-input"
          />
          <Search
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>

        {/* Status toggle group */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("view", { defaultValue: "View" })}
          </span>
          <div className="flex items-center border border-border rounded-[10px] overflow-hidden h-9">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "h-full px-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === tab
                    ? "bg-white text-foreground"
                    : "bg-slate-100 text-foreground hover:bg-slate-200",
                  i === 0 && "rounded-l-[10px]",
                  i === TABS.length - 1 && "rounded-r-[10px]"
                )}
                data-testid={`tab-${tab}`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {t("loading", { defaultValue: "Loading…" })}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
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
                  {t("empty.filtered.subtitle")}
                </p>
              </div>
            )}
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium border border-border rounded-[12px] bg-card hover:bg-muted transition-colors"
            >
              <Activity size={16} />
              {t("empty.viewAuditLog")}
            </button>
          </div>
        )}

        {!isLoading &&
          filtered.map(action => (
            <ActionRow
              key={action.id}
              action={action}
              currentUserId={currentUser?.id ?? ""}
              canReview={canReview}
              isHighlighted={action.id === highlightedActionId}
              ref={
                action.id === highlightedActionId
                  ? (el: HTMLDivElement | null) => {
                      highlightRowRef.current = el
                      el?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      })
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
