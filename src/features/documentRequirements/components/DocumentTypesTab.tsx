import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { showApiError, resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import { useDocumentTypeList } from "@/features/documentRequirements/hooks/useTenantDocumentTypes"
import { useUpdateDocumentType } from "@/features/documentRequirements/hooks/useUpdateDocumentType"
import { DocumentTypeTable } from "@/features/documentRequirements/components/DocumentTypeTable"
import { DocumentTypeDialog } from "@/features/documentRequirements/components/DocumentTypeDialog"
import type { DocumentType } from "@/features/documentRequirements/api/schema"

type DialogState =
  | { mode: "add" }
  | { mode: "edit"; documentType: DocumentType }
  | null

type Props = {
  tenantId: string | undefined
  // Bank Power User only. The registry is a pure authoring surface, so it does NOT inherit the
  // catalogue page's wider read set — support_user and auditor reach that page for read-only
  // diagnostics and must not reach this tab. The caller also hides the tab itself; this prop is
  // what keeps the controls off if it is ever rendered another way.
  canManage: boolean
}

/**
 * PRD1042-1794 Block 10 — the tenant's document-type registry, as a tab on the Document Catalog.
 *
 * Was a standalone page under its own route until it moved here: a requirement names a document
 * type by code, so the registry is read and edited in the same sitting as the requirements that
 * depend on it, and a separate sidebar destination made that a round trip.
 */
function DocumentTypesTab({ tenantId, canManage }: Props) {
  const { t } = useTranslation("documentRequirements")

  const [showInactive, setShowInactive] = useState(false)
  const [dialogState, setDialogState] = useState<DialogState>(null)
  // The row whose (de)activation is awaiting confirmation, or null when no confirm is open.
  const [pendingToggle, setPendingToggle] = useState<DocumentType | null>(null)

  const { data, isLoading, isError, error } = useDocumentTypeList(
    tenantId,
    showInactive
  )
  const updateDocumentType = useUpdateDocumentType(tenantId)

  const rows = data?.items ?? []

  function confirmToggle() {
    if (!pendingToggle) return
    const nextActive = !pendingToggle.is_active
    updateDocumentType.mutate(
      { documentTypeId: pendingToggle.id, body: { is_active: nextActive } },
      {
        onSuccess: () => {
          toast.success(
            nextActive
              ? t("documentType.reactivateSuccess")
              : t("documentType.deactivateSuccess")
          )
          setPendingToggle(null)
        },
        onError: err => {
          showApiError(err, t)
          setPendingToggle(null)
        },
      }
    )
  }

  return (
    <div data-testid="document-types-tab">
      <div className="flex items-start justify-between">
        <p className="text-sm text-muted-foreground">
          {t("documentType.list.subtitle")}
        </p>
        {canManage && (
          <Button
            data-testid="add-document-type-button"
            onClick={() => setDialogState({ mode: "add" })}
          >
            <Plus size={16} />
            {t("documentType.list.addButton")}
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Switch
          id="show-inactive-document-types"
          checked={showInactive}
          onCheckedChange={setShowInactive}
          data-testid="show-inactive-document-types-switch"
        />
        <Label htmlFor="show-inactive-document-types">
          {t("documentType.showInactive")}
        </Label>
      </div>

      <div className="mt-4">
        {isError && !isLoading ? (
          <p
            data-testid="document-type-list-error"
            className="text-sm text-destructive py-8 text-center"
          >
            {resolveApiErrorMessage(error, t)}
          </p>
        ) : (
          <DocumentTypeTable
            rows={rows}
            isLoading={isLoading}
            canManage={canManage}
            onEdit={documentType =>
              setDialogState({ mode: "edit", documentType })
            }
            onToggleActive={documentType => setPendingToggle(documentType)}
          />
        )}
      </div>

      {dialogState && (
        <DocumentTypeDialog
          mode={dialogState.mode}
          documentType={
            dialogState.mode === "edit" ? dialogState.documentType : undefined
          }
          onOpenChange={open => !open && setDialogState(null)}
        />
      )}

      <AlertDialog open={pendingToggle !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.is_active
                ? t("documentType.deactivateConfirm.title")
                : t("documentType.reactivateConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.is_active
                ? t("documentType.deactivateConfirm.description")
                : t("documentType.reactivateConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-testid="document-type-toggle-cancel"
              onClick={() => setPendingToggle(null)}
              disabled={updateDocumentType.isPending}
            >
              {t("create.actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="document-type-toggle-confirm"
              onClick={confirmToggle}
              disabled={updateDocumentType.isPending}
            >
              {pendingToggle?.is_active
                ? t("documentType.actions.deactivate")
                : t("documentType.actions.reactivate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export { DocumentTypesTab }
