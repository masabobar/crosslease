import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Upload, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FADocumentTypeSchema } from "@/features/frameworkAgreements/api/schema"
import type { FrameworkAgreementDocumentDraft } from "@/features/frameworkAgreements/types"

const MAX_FILES = 10
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
const BYTES_PER_MB = 1024 * 1024

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
    const valid = Array.from(newFiles)
      .filter(
        f => f.type === "application/pdf" && f.size <= MAX_FILE_SIZE_BYTES
      )
      .map(file => ({ file, documentType: "" as const, documentLabel: "" }))
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
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
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
              {Math.round(doc.file.size / BYTES_PER_MB)} MB
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

          <button
            type="button"
            onClick={() => removeDocument(index)}
            aria-label={doc.file.name}
            data-testid={`remove-document-file-${index}`}
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  )
}

export { DocumentDropzone }
