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
import { DEPRECATION_JUSTIFICATION_MIN_LENGTH } from "@/features/productTemplates/constants"
import { useCreateNewProductTemplateVersion } from "@/features/productTemplates/hooks/useCreateNewProductTemplateVersion"
import { useDeprecateProductTemplateVersion } from "@/features/productTemplates/hooks/useDeprecateProductTemplateVersion"
import { showApiError } from "@/features/productTemplates/utils"
import { productTemplateNewVersionEdit } from "@/router/paths"

type ProductTemplatePublishedActionsProps = {
  templateId: string
  versionNumber: string
}

// Deprecate + Author-new-version actions for a Published template version. Extracted from
// VersionHistoryPage so the detail drawer (US-10.8) and any future surface share one
// implementation. Per the design these live on the detail drawer, not on Version History.
export function ProductTemplatePublishedActions({
  templateId,
  versionNumber,
}: ProductTemplatePublishedActionsProps) {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()

  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false)
  const [isDeprecateDialogOpen, setIsDeprecateDialogOpen] = useState(false)
  const [deprecationJustification, setDeprecationJustification] = useState("")

  const { mutateAsync: createNewVersion, isPending: isCreatingNewVersion } =
    useCreateNewProductTemplateVersion()
  const { mutateAsync: deprecateVersion, isPending: isDeprecating } =
    useDeprecateProductTemplateVersion()

  async function handleConfirmAuthorNewVersion() {
    try {
      const result = await createNewVersion({ templateId })
      setIsAuthorDialogOpen(false)
      navigate(productTemplateNewVersionEdit(templateId, result.version_number))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleConfirmDeprecate() {
    try {
      await deprecateVersion({
        templateId,
        versionNumber,
        body: { justification: deprecationJustification },
      })
      setIsDeprecateDialogOpen(false)
      setDeprecationJustification("")
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
          data-testid="deprecate-version-button"
          className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setIsDeprecateDialogOpen(true)}
        >
          {t("versionHistory.deprecate")}
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
        open={isDeprecateDialogOpen}
        onOpenChange={open => {
          setIsDeprecateDialogOpen(open)
          if (!open) setDeprecationJustification("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.deprecateDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.deprecateDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <Label htmlFor="deprecate-justification">
              {t("versionHistory.deprecateDialog.justificationLabel")}
            </Label>
            <Textarea
              id="deprecate-justification"
              data-testid="deprecate-justification-input"
              rows={3}
              value={deprecationJustification}
              onChange={e => setDeprecationJustification(e.target.value)}
            />
            <p className="text-sm text-muted-foreground opacity-80">
              {t("versionHistory.deprecateDialog.justificationHint")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-deprecate-dialog-keep">
              {t("versionHistory.deprecateDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-deprecate-dialog-confirm"
              onClick={handleConfirmDeprecate}
              disabled={
                isDeprecating ||
                deprecationJustification.trim().length <
                  DEPRECATION_JUSTIFICATION_MIN_LENGTH
              }
            >
              {t("versionHistory.deprecateDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
