import { useTranslation } from "react-i18next"
import { CircleAlert } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentDropzone } from "@/features/frameworkAgreements/components/DocumentDropzone"
import type { FrameworkAgreementDocumentDraft } from "@/features/frameworkAgreements/types"

type Props = {
  documents: FrameworkAgreementDocumentDraft[]
  onDocumentsChange: (documents: FrameworkAgreementDocumentDraft[]) => void
}

function DocumentsStep({ documents, onDocumentsChange }: Props) {
  const { t } = useTranslation("frameworkAgreements")

  return (
    <div className="flex flex-col gap-4" data-testid="fa-documents-step">
      <Alert className="border-info bg-info/10">
        <CircleAlert className="text-info" />
        <AlertDescription className="text-info">
          {t("wizard.documents.optionalNotice")}
        </AlertDescription>
      </Alert>

      <DocumentDropzone documents={documents} onChange={onDocumentsChange} />
    </div>
  )
}

export { DocumentsStep }
