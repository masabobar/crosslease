import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { TERMINATION_JUSTIFICATION_MIN_LENGTH } from "@/features/productTemplates/constants"
import { useCreateNewProductTemplateVersion } from "@/features/productTemplates/hooks/useCreateNewProductTemplateVersion"
import { useTerminateProductTemplateVersion } from "@/features/productTemplates/hooks/useTerminateProductTemplateVersion"
import { showApiError } from "@/features/productTemplates/utils"
import { productTemplateNewVersionEdit } from "@/router/paths"

type ProductTemplatePublishedActionsProps = {
  templateId: string
  versionNumber: string
}

// Terminate + Author-new-version actions for an Active template version. Extracted from
// VersionHistoryPage so the detail drawer (US-10.8) and any future surface share one
// implementation. Per the design these live on the detail drawer, not on Version History.
export function ProductTemplatePublishedActions({
  templateId,
  versionNumber,
}: ProductTemplatePublishedActionsProps) {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()

  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false)
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false)
  const [terminationJustification, setTerminationJustification] = useState("")

  const { mutateAsync: createNewVersion, isPending: isCreatingNewVersion } =
    useCreateNewProductTemplateVersion()
  const { mutateAsync: terminateVersion, isPending: isTerminating } =
    useTerminateProductTemplateVersion()

  async function handleConfirmAuthorNewVersion() {
    try {
      const result = await createNewVersion({ templateId })
      setIsAuthorDialogOpen(false)
      navigate(productTemplateNewVersionEdit(templateId, result.version_number))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleConfirmTerminate() {
    try {
      await terminateVersion({
        templateId,
        versionNumber,
        body: { justification: terminationJustification },
      })
      setIsTerminateDialogOpen(false)
      setTerminationJustification("")
    } catch (err) {
      showApiError(err, t)
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="terminate-version-button"
          className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setIsTerminateDialogOpen(true)}
        >
          {t("versionHistory.terminate")}
        </Button>
        <Button
          type="button"
          size="sm"
          data-testid="author-new-version-button"
          onClick={() => setIsAuthorDialogOpen(true)}
        >
          {t("versionHistory.authorNewVersion")}
        </Button>
      </div>

      <AlertDialog
        open={isAuthorDialogOpen}
        onOpenChange={setIsAuthorDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.authorNewVersionDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.authorNewVersionDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-new-dialog-keep">
              {t("versionHistory.authorNewVersionDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-new-dialog-confirm"
              onClick={handleConfirmAuthorNewVersion}
              disabled={isCreatingNewVersion}
            >
              {t("versionHistory.authorNewVersionDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isTerminateDialogOpen}
        onOpenChange={open => {
          setIsTerminateDialogOpen(open)
          if (!open) setTerminationJustification("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.terminateDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.terminateDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <Label htmlFor="terminate-justification">
              {t("versionHistory.terminateDialog.justificationLabel")}
            </Label>
            <Textarea
              id="terminate-justification"
              data-testid="terminate-justification-input"
              rows={3}
              value={terminationJustification}
              onChange={e => setTerminationJustification(e.target.value)}
            />
            <p className="text-sm text-muted-foreground opacity-80">
              {t("versionHistory.terminateDialog.justificationHint")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-terminate-dialog-keep">
              {t("versionHistory.terminateDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-terminate-dialog-confirm"
              onClick={handleConfirmTerminate}
              disabled={
                isTerminating ||
                terminationJustification.trim().length <
                  TERMINATION_JUSTIFICATION_MIN_LENGTH
              }
            >
              {t("versionHistory.terminateDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
