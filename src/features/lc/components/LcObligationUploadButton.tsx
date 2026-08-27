import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { showApiError } from "@/lib/apiErrorMessage"
import { useUploadLcObligationDocument } from "@/features/lc/hooks/useUploadLcObligationDocument"
import {
  CASE_DOCUMENT_ACCEPTED_MIME,
  CASE_DOCUMENT_MAX_FILE_SIZE_BYTES,
} from "@/features/documentRequirements/constants"

type Props = {
  businessObjectId: string
  requirementDefinitionId: string
  // Labels the hidden input / button for the row, so a test (and a screen reader) can tell the
  // per-obligation controls apart.
  requirementLabel: string
}

// PRD1042-1794 — the upload affordance for a single outstanding/rejected LC obligation row. Mirrors
// the bank-side CaseDocumentUploadButton exactly (styled Button triggers a hidden file input, same
// MIME + size guard, same shared POST /cases/{case_id}/documents endpoint) — the only differences are
// the `lc` translation namespace and that success refetches the LC obligations surface. The API
// function and MIME/size constants are imported, never duplicated.
function LcObligationUploadButton({
  businessObjectId,
  requirementDefinitionId,
  requirementLabel,
}: Props) {
  const { t } = useTranslation("lc")
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadLcObligationDocument(businessObjectId)

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
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        aria-label={t("caseDocuments.upload.button", {
          requirement: requirementLabel,
        })}
        data-testid={`lc-case-documents-upload-${requirementDefinitionId}`}
      >
        <Upload size={14} />
        {upload.isPending
          ? t("caseDocuments.upload.uploading")
          : t("caseDocuments.upload.label")}
      </Button>
      {/* NOTE: raw <input type="file"> — no shadcn file-input primitive; hidden input triggered by
          the styled Button, same pattern as the bank-side CaseDocumentUploadButton. */}
      <input
        ref={inputRef}
        type="file"
        accept={CASE_DOCUMENT_ACCEPTED_MIME.join(",")}
        className="hidden"
        data-testid={`lc-case-documents-upload-input-${requirementDefinitionId}`}
        onChange={e => {
          handleFile(e.target.files?.[0])
          // Clear so re-selecting the same file after a rejected upload fires onChange again.
          e.target.value = ""
        }}
      />
    </>
  )
}

export { LcObligationUploadButton }
