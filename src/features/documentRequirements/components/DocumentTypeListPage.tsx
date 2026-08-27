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
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useDocumentTypeList } from "@/features/documentRequirements/hooks/useTenantDocumentTypes"
import { useUpdateDocumentType } from "@/features/documentRequirements/hooks/useUpdateDocumentType"
import { DOCUMENT_TYPE_MANAGE_ALLOWED_ROLES } from "@/features/documentRequirements/types"
import { DocumentTypeTable } from "@/features/documentRequirements/components/DocumentTypeTable"
import { DocumentTypeDialog } from "@/features/documentRequirements/components/DocumentTypeDialog"
import type { DocumentType } from "@/features/documentRequirements/api/schema"

type DialogState =
  | { mode: "add" }
  | { mode: "edit"; documentType: DocumentType }
  | null

export default function DocumentTypeListPage() {
  const { t } = useTranslation("documentRequirements")
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? undefined

  const canManage = Boolean(
    currentUser?.role &&
    DOCUMENT_TYPE_MANAGE_ALLOWED_ROLES.includes(currentUser.role)
  )

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
    <div className="p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("documentType.list.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("documentType.list.subtitle")}
          </p>
        </div>
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
