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
import {
  DEACTIVATION_REASON_MAX_LENGTH,
  DEACTIVATION_REASON_MIN_LENGTH,
  PRODUCT_STATUS_ACTIVE,
  TERMINATION_JUSTIFICATION_MAX_LENGTH,
  TERMINATION_JUSTIFICATION_MIN_LENGTH,
} from "@/features/productTemplates/constants"
import { useCreateNewProductTemplateVersion } from "@/features/productTemplates/hooks/useCreateNewProductTemplateVersion"
import { useTerminateProductTemplateVersion } from "@/features/productTemplates/hooks/useTerminateProductTemplateVersion"
import { useDeactivateProductTemplate } from "@/features/productTemplates/hooks/useDeactivateProductTemplate"
import { useReactivateProductTemplate } from "@/features/productTemplates/hooks/useReactivateProductTemplate"
import { showApiError } from "@/features/productTemplates/utils"
import { productTemplateNewVersionEdit } from "@/router/paths"
import { useDiscardProductTemplateDraft } from "@/features/productTemplates/hooks/useDiscardProductTemplateDraft.ts"
import { TemplateStatusSchema } from "@/features/productTemplates/api/schema"
import type { TemplateStatus } from "@/features/productTemplates/api/schema"

type ProductTemplatePublishedActionsProps = {
  templateId: string
  versionNumber: string
  isDraft: boolean
  // Product-level (TemplateVersionDetail.product_status / TemplateListItem.product_status),
  // not the version's own lifecycle status — decides whether this renders Deactivate or
  // Activate. Passed in rather than fetched here: both call sites (ProductTemplateDetailPage,
  // ProductTemplateDetailDrawer via ProductTemplateListPage) already have it from their own
  // version-detail fetch.
  productStatus: string
  versionStatus: TemplateStatus
}

// Terminate + Author-new-version actions for an Active template version. Extracted from
// VersionHistoryPage so the detail drawer (US-10.8) and any future surface share one
// implementation. Per the design these live on the detail drawer, not on Version History.
export function ProductTemplatePublishedActions({
  templateId,
  versionNumber,
  isDraft,
  productStatus,
  versionStatus,
}: ProductTemplatePublishedActionsProps) {
  const { t } = useTranslation("productTemplates")
  const navigate = useNavigate()
  const isDeactivated = productStatus !== PRODUCT_STATUS_ACTIVE

  const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false)
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false)
  const [isDiscardDraftDialogOpen, setIsDiscardDraftDialogOpen] =
    useState(false)
  const [isEditDraftDialogOpen, setIsEditDraftDialogOpen] = useState(false)
  const [terminationJustification, setTerminationJustification] = useState("")
  const [deactivationReason, setDeactivationReason] = useState("")

  const { mutateAsync: createNewVersion, isPending: isCreatingNewVersion } =
    useCreateNewProductTemplateVersion()
  const { mutateAsync: terminateVersion, isPending: isTerminating } =
    useTerminateProductTemplateVersion()
  const { mutateAsync: deactivateTemplate, isPending: isDeactivating } =
    useDeactivateProductTemplate()
  const { mutateAsync: reactivateTemplate, isPending: isReactivating } =
    useReactivateProductTemplate()
  const { mutateAsync: discardDraft, isPending: isDiscarding } =
    useDiscardProductTemplateDraft()

  async function handleConfirmAuthorNewVersion() {
    try {
      const result = await createNewVersion({ templateId })
      setIsAuthorDialogOpen(false)
      navigate(productTemplateNewVersionEdit(templateId, result.version_number))
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleEditDraft() {
    setIsEditDraftDialogOpen(false)
    navigate(productTemplateNewVersionEdit(templateId, versionNumber))
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

  async function handleConfirmDeactivate() {
    try {
      await deactivateTemplate({
        templateId,
        body: { reason: deactivationReason },
      })
      setIsDeactivateDialogOpen(false)
      setDeactivationReason("")
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleConfirmActivate() {
    try {
      await reactivateTemplate(templateId)
      setIsActivateDialogOpen(false)
    } catch (err) {
      showApiError(err, t)
    }
  }

  async function handleDraftDiscard() {
    try {
      await discardDraft({
        templateId,
        versionNumber,
      })
      setIsDiscardDraftDialogOpen(false)
    } catch (err) {
      showApiError(err, t)
    }
  }

  // Product-level, so available regardless of whether the current version is a draft or
  // published — shown on both action sets with the same isDeactivated branch.
  function getActivateDeactivateButton() {
    return isDeactivated ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="activate-template-button"
        className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setIsActivateDialogOpen(true)}
      >
        {t("versionHistory.activate")}
      </Button>
    ) : (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="deactivate-template-button"
        className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setIsDeactivateDialogOpen(true)}
      >
        {t("versionHistory.deactivate")}
      </Button>
    )
  }

  function getDraftActions() {
    return (
      <div className="flex justify-end gap-2">
        {getActivateDeactivateButton()}
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="terminate-version-button"
          className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setIsDiscardDraftDialogOpen(true)}
        >
          {t("versionHistory.discard")}
        </Button>
        <Button
          type="button"
          size="sm"
          data-testid="author-new-version-button"
          onClick={() => setIsEditDraftDialogOpen(true)}
        >
          {t("versionHistory.editDraft")}
        </Button>
      </div>
    )
  }

  function getRegularActions() {
    const canTerminate =
      versionStatus !== TemplateStatusSchema.enum.terminated &&
      versionStatus !== TemplateStatusSchema.enum.discarded

    return (
      <div className="flex justify-end gap-2">
        {getActivateDeactivateButton()}
        {canTerminate && (
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
        )}
        <Button
          type="button"
          size="sm"
          data-testid="author-new-version-button"
          onClick={() => setIsAuthorDialogOpen(true)}
        >
          {t("versionHistory.authorNewVersion")}
        </Button>
      </div>
    )
  }

  function getActions() {
    // Deactivated is product-level and overrides everything else: a deactivated product's
    // only available action is reactivating it, regardless of the current version's own
    // lifecycle status or draft state.
    if (isDeactivated) {
      return (
        <div className="flex justify-end gap-2">
          {getActivateDeactivateButton()}
        </div>
      )
    }
    return isDraft ? getDraftActions() : getRegularActions()
  }

  function getDiscardDraftConfirmationDialog() {
    return (
      <AlertDialog
        open={isDiscardDraftDialogOpen}
        onOpenChange={setIsDiscardDraftDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.discardDraftDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.discardDraftDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-new-dialog-keep">
              {t("versionHistory.discardDraftDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-new-dialog-confirm"
              onClick={handleDraftDiscard}
              disabled={isDiscarding}
            >
              {t("versionHistory.discardDraftDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  function getAuthorNewTemplateConfirmationDialog() {
    return (
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
    )
  }

  function getTerminateTemplateConfirmationDialog() {
    return (
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
              maxLength={TERMINATION_JUSTIFICATION_MAX_LENGTH}
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
    )
  }

  function getDeactivateTemplateConfirmationDialog() {
    return (
      <AlertDialog
        open={isDeactivateDialogOpen}
        onOpenChange={open => {
          setIsDeactivateDialogOpen(open)
          if (!open) setDeactivationReason("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.deactivateDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.deactivateDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 px-1">
            <Label htmlFor="deactivate-reason">
              {t("versionHistory.deactivateDialog.reasonLabel")}
            </Label>
            <Textarea
              id="deactivate-reason"
              data-testid="deactivate-reason-input"
              rows={3}
              maxLength={DEACTIVATION_REASON_MAX_LENGTH}
              value={deactivationReason}
              onChange={e => setDeactivationReason(e.target.value)}
            />
            <p className="text-sm text-muted-foreground opacity-80">
              {t("versionHistory.deactivateDialog.reasonHint")}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-deactivate-dialog-keep">
              {t("versionHistory.deactivateDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-deactivate-dialog-confirm"
              onClick={handleConfirmDeactivate}
              disabled={
                isDeactivating ||
                deactivationReason.trim().length < DEACTIVATION_REASON_MIN_LENGTH
              }
            >
              {t("versionHistory.deactivateDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // No reason field — reactivate_product takes no request body, unlike deactivate.
  function getActivateTemplateConfirmationDialog() {
    return (
      <AlertDialog
        open={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("versionHistory.activateDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("versionHistory.activateDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="version-activate-dialog-keep">
              {t("versionHistory.activateDialog.keep")}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="version-activate-dialog-confirm"
              onClick={handleConfirmActivate}
              disabled={isReactivating}
            >
              {t("versionHistory.activateDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  function getEditDraftConfirmationDialog() {
    return (
      <AlertDialog
        open={isEditDraftDialogOpen}
        onOpenChange={setIsEditDraftDialogOpen}
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
              onClick={handleEditDraft}
            >
              {t("versionHistory.authorNewVersionDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <>
      {getActions()}
      {getAuthorNewTemplateConfirmationDialog()}
      {getTerminateTemplateConfirmationDialog()}
      {getDeactivateTemplateConfirmationDialog()}
      {getActivateTemplateConfirmationDialog()}
      {getDiscardDraftConfirmationDialog()}
      {getEditDraftConfirmationDialog()}
    </>
  )
}
