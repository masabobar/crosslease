import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { Button } from "@/components/ui/button"
import { showApiError } from "@/lib/apiErrorMessage"
import { CatalogStateSchema } from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogState } from "@/features/workflowTaskCatalog/api/schema"
import {
  useReactivateWorkflowTaskCatalog,
  useSuspendWorkflowTaskCatalog,
} from "@/features/workflowTaskCatalog/hooks/useWorkflowTaskCatalogLifecycle"

// PRD1042-2148 — a catalogue is created Active, so the only transitions left are the ones that
// come AFTER activation: Suspend an active one, Reactivate a suspended one. There is no Activate
// control because there is no draft to move out of; `draft` is unreachable and `archived` is a
// reserved post-MVP terminal with no route. Exactly one transition is offered at a time because
// the backend accepts exactly one — the others answer WTC_CATALOG_STATE_TRANSITION.
type Props = {
  catalogId: string
  catalogState: CatalogState
  // Bank Power User only — the routes answer 404 to every other role, so a control shown to
  // anyone else would only ever produce a not-found.
  canManage: boolean
}

function CatalogLifecycleActions({
  catalogId,
  catalogState,
  canManage,
}: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false)

  const suspend = useSuspendWorkflowTaskCatalog()
  const reactivate = useReactivateWorkflowTaskCatalog()

  const isPending = suspend.isPending || reactivate.isPending

  if (!canManage) return null

  if (catalogState === CatalogStateSchema.enum.active) {
    return (
      <>
        <Button
          variant="outline"
          data-testid="catalog-suspend-button"
          disabled={isPending}
          onClick={() => setIsSuspendConfirmOpen(true)}
        >
          {t("detail.lifecycleActions.suspend")}
        </Button>

        <AlertDialog
          open={isSuspendConfirmOpen}
          onOpenChange={setIsSuspendConfirmOpen}
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
              <AlertDialogCancel data-testid="catalog-suspend-cancel">
                {t("detail.lifecycleActions.suspendConfirm.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid="catalog-suspend-confirm"
                onClick={() =>
                  suspend.mutate(catalogId, {
                    // Suspending is never blocked, so the response is a report: it names the
                    // cases already resolved against the catalogue. Saying how many keeps the
                    // action from being silent, which is the point of the endpoint returning them.
                    onSuccess: result =>
                      toast.success(
                        t("detail.lifecycleActions.suspended", {
                          count: result.affected_case_ids.length,
                        })
                      ),
                    onError: err => showApiError(err, t),
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

  if (catalogState === CatalogStateSchema.enum.suspended) {
    return (
      <Button
        data-testid="catalog-reactivate-button"
        disabled={isPending}
        onClick={() =>
          reactivate.mutate(catalogId, {
            onSuccess: () =>
              toast.success(t("detail.lifecycleActions.reactivated")),
            onError: err => showApiError(err, t),
          })
        }
      >
        {t("detail.lifecycleActions.reactivate")}
      </Button>
    )
  }

  return null
}

export { CatalogLifecycleActions }
