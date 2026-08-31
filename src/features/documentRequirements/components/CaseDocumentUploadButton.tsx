import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { showApiError } from "@/lib/apiErrorMessage"
import { useUploadCaseDocument } from "@/features/documentRequirements/hooks/useUploadCaseDocument"
import {
  CASE_DOCUMENT_ACCEPTED_MIME,
  CASE_DOCUMENT_MAX_FILE_SIZE_BYTES,
} from "@/features/documentRequirements/constants"

type Props = {
  catalogId: string
  businessObjectId: string
  requirementDefinitionId: string
  // Labels the hidden input / button for the row, so a test (and a screen reader) can tell the
  // per-requirement controls apart.
  requirementLabel: string
  // Disable uploading when the bank has not taken the case over yet. A bank user works a case only
  // after claiming it (the backend refuses an upload to an unclaimed case, PRD1042-1794); disabling
  // here means they never hit that error. Carries a reason for the tooltip.
  disabled?: boolean
  disabledReason?: string
}

// PRD1042-1794 item 6 — the upload affordance for a single missing/rejected requirement row. A
// styled Button triggers a hidden file input (no shadcn file primitive exists — same hidden-input
// pattern as the FA DocumentDropzone). MIME + size are validated here before the round trip; the
// backend remains the authority.
function CaseDocumentUploadButton({
  catalogId,
  businessObjectId,
  requirementDefinitionId,
  requirementLabel,
  disabled = false,
  disabledReason,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadCaseDocument(catalogId, businessObjectId)

  function handleFile(file: File | undefined) {
    if (!file) return
    if (
      !(CASE_DOCUMENT_ACCEPTED_MIME as readonly string[]).includes(file.type)
    ) {
      toast.error(`${file.name}: ${t("caseDocuments.upload.invalidMime")}`)
      return
    }
    if (file.size > CASE_DOCUMENT_MAX_FILE_SIZE_BYTES) {
      toast.error(`${file.name}: ${t("caseDocuments.upload.fileTooLarge")}`)
      return
    }
    upload.mutate(
      { requirementDefinitionId, file },
      {
        onSuccess: () => toast.success(t("caseDocuments.upload.success")),
        onError: err => showApiError(err, t),
      }
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || upload.isPending}
        title={disabled ? disabledReason : undefined}
        onClick={() => inputRef.current?.click()}
        aria-label={t("caseDocuments.upload.button", {
          requirement: requirementLabel,
        })}
        data-testid={`case-documents-upload-${requirementDefinitionId}`}
      >
        <Upload size={14} />
        {upload.isPending
          ? t("caseDocuments.upload.uploading")
          : t("caseDocuments.upload.label")}
      </Button>
      {/* NOTE: raw <input type="file"> — no shadcn file-input primitive; hidden input triggered by
          the styled Button, same pattern as DocumentDropzone. */}
      <input
        ref={inputRef}
        type="file"
        accept={CASE_DOCUMENT_ACCEPTED_MIME.join(",")}
        className="hidden"
        data-testid={`case-documents-upload-input-${requirementDefinitionId}`}
        onChange={e => {
          handleFile(e.target.files?.[0])
          // Clear so re-selecting the same file after a rejected upload fires onChange again.
          e.target.value = ""
        }}
      />
    </>
  )
}

export { CaseDocumentUploadButton }
