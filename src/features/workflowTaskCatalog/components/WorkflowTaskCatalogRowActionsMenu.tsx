import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MoreVertical } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { showApiError } from "@/lib/apiErrorMessage"
import { CatalogStateSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogState } from "@/features/workflowTaskCatalog/api/schema"
import {
  useActivateWorkflowTaskCatalog,
  useReactivateWorkflowTaskCatalog,
  useSuspendWorkflowTaskCatalog,
} from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogLifecycle"

type Props = {
  catalogId: string
  catalogName: string
  catalogState: CatalogState
  /**
   * Bank Power User only — the lifecycle routes answer 404 to every other role (US 15.1/15.2
   * existence non-disclosure), so a transition shown to anyone else could only ever not-find.
   */
  canManage: boolean
  onOpenDetail: () => void
}

/**
 * The row's `⋮` menu — Edit, then whichever lifecycle transition the catalogue's state allows.
 *
 * ── WHY THE MENU GREW BACK ─────────────────────────────────────────────────────────────────────
 * It had been cut to a single `Open detail` under CR PRD1042-1554, on the grounds that
 * `/workflow-task-catalogs` exposed no state-transition route at all. That is no longer true: the
 * contract now carries `/activate`, `/suspend` and `/reactivate`, and the list carries draft rows —
 * so the design's menu is buildable again, which is why that note is gone rather than kept.
 *
 * ── EXACTLY ONE TRANSITION IS OFFERED ──────────────────────────────────────────────────────────
 * Because the backend accepts exactly one: every other route answers `WTC_CATALOG_STATE_TRANSITION`
 * from the state the row is in. Offering all three and letting two of them fail would turn a state
 * machine the UI can read into an error the user has to.
 *
 * ── WHAT THE DUMMY HAS THAT THIS DOES NOT ──────────────────────────────────────────────────────
 * Its **DANGER → Delete draft**. There is no `DELETE /workflow-task-catalogs/{id}` and no other
 * route that removes one, so per `api-first.md` §4 it is omitted rather than drawn as a control
 * that cannot work. Suspend is the nearest thing that exists and is already here.
 *
 * `Open detail` stays as a menu item as well as the row click: the testid is what QA's suite
 * selects on, and a row click is not reachable from a keyboard-only walk of the menu.
 */
function WorkflowTaskCatalogRowActionsMenu({
  catalogId,
  catalogName,
  catalogState,
  canManage,
  onOpenDetail,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [isSuspendConfirmOpen, setSuspendConfirmOpen] = useState(false)

  const activate = useActivateWorkflowTaskCatalog()
  const suspend = useSuspendWorkflowTaskCatalog()
  const reactivate = useReactivateWorkflowTaskCatalog()
  const isPending =
    activate.isPending || suspend.isPending || reactivate.isPending

  const states = CatalogStateSchema.enum

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-testid={`catalog-row-menu-${catalogId}`}
          aria-label={t("list.table.actionsMenuLabel")}
          className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <MoreVertical size={16} />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* The dummy's `Edit`. There is no PATCH on the catalogue itself — its tasks and phases
              are what get edited, and the detail page is where that happens — so Edit opens it
              rather than a second form that would have nothing to submit to. */}
          <DropdownMenuItem
            data-testid={`catalog-action-open-detail-${catalogId}`}
            onClick={onOpenDetail}
          >
            {t("list.table.actions.edit")}
          </DropdownMenuItem>

          {canManage && catalogState === states.draft && (
            <DropdownMenuItem
              data-testid={`catalog-action-activate-${catalogId}`}
              disabled={isPending}
              onClick={() =>
                activate.mutate(catalogId, {
                  onSuccess: () =>
                    toast.success(
                      t("list.table.actions.activated", { name: catalogName })
                    ),
                  onError: error => showApiError(error, t),
                })
              }
            >
              {t("list.table.actions.activate")}
            </DropdownMenuItem>
          )}

          {canManage && catalogState === states.active && (
            <DropdownMenuItem
              data-testid={`catalog-action-suspend-${catalogId}`}
              disabled={isPending}
              onClick={() => setSuspendConfirmOpen(true)}
            >
              {t("list.table.actions.suspend")}
            </DropdownMenuItem>
          )}

          {canManage && catalogState === states.suspended && (
            <DropdownMenuItem
              data-testid={`catalog-action-reactivate-${catalogId}`}
              disabled={isPending}
              onClick={() =>
                reactivate.mutate(catalogId, {
                  onSuccess: () =>
                    toast.success(
                      t("list.table.actions.reactivated", { name: catalogName })
                    ),
                  onError: error => showApiError(error, t),
                })
              }
            >
              {t("list.table.actions.reactivate")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspending is never refused — it reports the cases already resolved against the catalogue
          and proceeds — so the confirm is where the reader is told what it will affect. */}
      <AlertDialog
        open={isSuspendConfirmOpen}
        onOpenChange={setSuspendConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detail.lifecycleActions.suspendConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detail.lifecycleActions.suspendConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("detail.lifecycleActions.suspendConfirm.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid={`catalog-action-suspend-confirm-${catalogId}`}
              disabled={isPending}
              onClick={() =>
                suspend.mutate(catalogId, {
                  onSuccess: () => {
                    setSuspendConfirmOpen(false)
                    toast.success(
                      t("list.table.actions.suspended", { name: catalogName })
                    )
                  },
                  onError: error => showApiError(error, t),
                })
              }
            >
              {t("detail.lifecycleActions.suspendConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { WorkflowTaskCatalogRowActionsMenu }
