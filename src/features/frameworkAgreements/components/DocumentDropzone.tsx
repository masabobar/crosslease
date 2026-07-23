import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X, FileText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FADocumentTypeSchema } from "@/features/frameworkAgreements/api/schema"
import {
  FA_DOCUMENT_ACCEPTED_MIME,
  FA_DOCUMENT_BYTES_PER_MB,
  FA_DOCUMENT_MAX_FILE_SIZE_BYTES,
} from "@/features/frameworkAgreements/constants"
import type { FrameworkAgreementDocumentDraft } from "@/features/frameworkAgreements/types"

const MAX_FILES = 10

type Props = {
  documents: FrameworkAgreementDocumentDraft[]
  onChange: (documents: FrameworkAgreementDocumentDraft[]) => void
}

function DocumentDropzone({ documents, onChange }: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const incoming = Array.from(newFiles)
    const invalidMime = incoming.filter(
      f => f.type !== FA_DOCUMENT_ACCEPTED_MIME
    )
    const tooLarge = incoming.filter(
      f =>
        f.type === FA_DOCUMENT_ACCEPTED_MIME &&
        f.size > FA_DOCUMENT_MAX_FILE_SIZE_BYTES
    )
    const valid = incoming
      .filter(
        f =>
          f.type === FA_DOCUMENT_ACCEPTED_MIME &&
          f.size <= FA_DOCUMENT_MAX_FILE_SIZE_BYTES
      )
      // Defaults to "other" (uncategorized) — per PRD1042-1495 (A6), categorizing
      // a framework document is not mandatory to the user.
      .map(file => ({
        file,
        documentType: "other" as const,
        documentLabel: "",
      }))

    if (invalidMime.length > 0) {
      toast.error(
        `${invalidMime.map(f => f.name).join(", ")}: ${t("errors.FA_DOC_INVALID_MIME")}`
      )
    }
    if (tooLarge.length > 0) {
      toast.error(
        `${tooLarge.map(f => f.name).join(", ")}: ${t("errors.FA_DOC_FILE_TOO_LARGE")}`
      )
    }

    onChange([...documents, ...valid].slice(0, MAX_FILES))
  }

  function removeDocument(index: number) {
    onChange(documents.filter((_, i) => i !== index))
  }

  function updateDocument(
    index: number,
    changes: Partial<FrameworkAgreementDocumentDraft>
  ) {
    onChange(
      documents.map((doc, i) => (i === index ? { ...doc, ...changes } : doc))
    )
  }

  return (
    <div className="flex flex-col gap-2" data-testid="document-dropzone">
      <div className="flex items-center justify-between text-sm">
        <p className="font-medium text-foreground">
          {t("wizard.documents.uploadPanelTitle")}
        </p>
        <p className="text-muted-foreground">
          {t("wizard.documents.documentCount", { count: documents.length })}
        </p>
      </div>

      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-input bg-accent px-6 pt-6 pb-8 text-center",
          isDragging && "border-primary"
        )}
        onDragOver={e => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        data-testid="document-dropzone-target"
      >
        <div className="rounded-xl border border-input bg-background p-2.5">
          <Upload size={16} />
        </div>
        <p className="text-base font-medium text-card-foreground">
          {t("wizard.documents.dropzoneLabel")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("wizard.documents.dropzoneHint")}
        </p>
        {/* NOTE: raw <input type="file"> — no shadcn file-input primitive exists; hidden input triggered by a styled drop target, same pattern as AttachFrameworkAgreementDocumentDialog */}
        <input
          ref={inputRef}
          type="file"
          accept={FA_DOCUMENT_ACCEPTED_MIME}
          multiple
          className="hidden"
          data-testid="document-dropzone-input"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {documents.map((doc, index) => (
        <div
          key={`${doc.file.name}-${index}`}
          className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
          data-testid={`document-file-${index}`}
        >
          <FileText size={20} className="shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{doc.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(doc.file.size / FA_DOCUMENT_BYTES_PER_MB)} MB
            </p>
          </div>

          <div className="w-40 shrink-0">
            <Select
              value={doc.documentType || null}
              onValueChange={v =>
                updateDocument(index, {
                  documentType:
                    v as FrameworkAgreementDocumentDraft["documentType"],
                })
              }
            >
              <SelectTrigger
                data-testid={`document-type-select-${index}`}
                className="w-full"
              >
                <SelectValue
                  placeholder={t("wizard.documents.documentTypePlaceholder")}
                >
                  {doc.documentType
                    ? t(`documentTypes.${doc.documentType}`)
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FADocumentTypeSchema.options.map(type => (
                  <SelectItem key={type} value={type}>
                    {t(`documentTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44 shrink-0">
            <Input
              data-testid={`document-label-input-${index}`}
              placeholder={t("wizard.documents.documentLabel")}
              value={doc.documentLabel}
              onChange={e =>
                updateDocument(index, { documentLabel: e.target.value })
              }
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => removeDocument(index)}
            aria-label={doc.file.name}
            data-testid={`remove-document-file-${index}`}
          >
            <X size={16} className="text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export { DocumentDropzone }
