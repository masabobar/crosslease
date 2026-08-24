import { useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Upload, X, FileText } from "lucide-react"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DialogModal, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useAttachFrameworkAgreementDocument } from "@/features/frameworkAgreements/hooks/useAttachFrameworkAgreementDocument"
import { useResolveFrameworkAgreementFieldError } from "@/features/frameworkAgreements/utils"
import { FADocumentTypeSchema } from "@/features/frameworkAgreements/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"
import {
  FA_DOCUMENT_ACCEPTED_MIME,
  FA_DOCUMENT_BYTES_PER_MB,
  FA_DOCUMENT_MAX_FILE_SIZE_BYTES,
} from "@/features/frameworkAgreements/constants"

const attachDocumentFormSchema = z.object({
  document_type: FADocumentTypeSchema,
  document_label: z.string().max(200, "tooLong").optional(),
  file: z
    .custom<File>(v => v instanceof File, { message: "required" })
    .refine(f => f.type === FA_DOCUMENT_ACCEPTED_MIME, "invalidMime")
    .refine(f => f.size <= FA_DOCUMENT_MAX_FILE_SIZE_BYTES, "fileTooLarge"),
})
type AttachDocumentFormValues = z.infer<typeof attachDocumentFormSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkAgreementId: string
}

function AttachFrameworkAgreementDocumentDialog({
  open,
  onOpenChange,
  frameworkAgreementId,
}: Props) {
  const { t } = useTranslation("frameworkAgreements")
  const mutation = useAttachFrameworkAgreementDocument()
  const resolveMsg = useResolveFrameworkAgreementFieldError()
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    setError,
    getValues,
    handleSubmit,
    reset,
    control,
    register,
    formState: { errors },
  } = useForm<AttachDocumentFormValues>({
    resolver: zodResolver(attachDocumentFormSchema),
    // Defaults to "other" (uncategorized) — per PRD1042-1495 (A6), categorizing a
    // framework document is not mandatory to the user.
    defaultValues: {
      document_type: FADocumentTypeSchema.enum.other,
      document_label: "",
    },
  })

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: AttachDocumentFormValues) {
    mutation.mutate(
      {
        faId: frameworkAgreementId,
        file: values.file,
        documentType: values.document_type,
        documentLabel: values.document_label || undefined,
      },
      {
        onSuccess: () => handleClose(),
        onError: err => {
          if (
            applyApiFieldErrors({
              error: err,
              fields: Object.keys(getValues()),
              setError,
            })
          )
            return

          toast.error(resolveApiErrorMessage(err, t))
        },
      }
    )
  }

  return (
    <DialogModal open={open} onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("documentsTab.attachDialog.title")}</DialogTitle>
          </DialogHeader>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 px-4 py-4">
          <div>
            <Label htmlFor="attach_document_type" className="mb-2">
              {t("wizard.documents.documentType")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Controller
              control={control}
              name="document_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="attach_document_type"
                    data-testid="attach-document-dialog-type-select"
                  >
                    <SelectValue>
                      {t(`documentTypes.${field.value}`)}
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
              )}
            />
          </div>

          <div>
            <Label htmlFor="attach_document_label" className="mb-2">
              {t("wizard.documents.documentLabel")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("fields.optional")}
              </span>
            </Label>
            <Input
              id="attach_document_label"
              data-testid="attach-document-dialog-label-input"
              error={!!errors.document_label}
              {...register("document_label")}
            />
            {errors.document_label && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMsg(errors.document_label.message)}
              </p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="file"
              render={({ field }) =>
                field.value ? (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                    data-testid="attach-document-dialog-selected-file"
                  >
                    <FileText
                      size={20}
                      className="shrink-0 text-muted-foreground"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {field.value.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(
                          field.value.size / FA_DOCUMENT_BYTES_PER_MB
                        )}{" "}
                        MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => field.onChange(undefined)}
                      aria-label={field.value.name}
                      data-testid="attach-document-dialog-remove-file"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
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
                      const dropped = e.dataTransfer.files[0]
                      if (dropped) field.onChange(dropped)
                    }}
                    onClick={() => inputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    data-testid="attach-document-dialog-dropzone-target"
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
                    {/* NOTE: raw <input type="file"> — no shadcn file-input primitive exists; hidden input triggered by a styled drop target, same pattern as DocumentDropzone */}
                    <input
                      ref={inputRef}
                      type="file"
                      accept={FA_DOCUMENT_ACCEPTED_MIME}
                      className="hidden"
                      data-testid="attach-document-dialog-file-input"
                      onChange={e => {
                        const selected = e.target.files?.[0]
                        if (selected) field.onChange(selected)
                      }}
                    />
                  </div>
                )
              }
            />
            {errors.file && (
              <p className="mt-1 text-sm text-destructive">
                {errors.file.message === "invalidMime"
                  ? t("errors.FA_DOC_INVALID_MIME")
                  : errors.file.message === "fileTooLarge"
                    ? t("errors.FA_DOC_FILE_TOO_LARGE")
                    : resolveMsg(errors.file.message)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            data-testid="attach-document-dialog-cancel"
          >
            {t("wizard.actions.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            data-testid="attach-document-dialog-confirm"
          >
            {t("documentsTab.attachDialog.confirmButton")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { AttachFrameworkAgreementDocumentDialog }
