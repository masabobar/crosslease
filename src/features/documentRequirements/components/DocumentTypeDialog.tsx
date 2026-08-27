import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/ui/select"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveFormMessage } from "@/lib/formMessages"
import { showApiError } from "@/lib/apiErrorMessage"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useCreateDocumentType } from "@/features/documentRequirements/hooks/useCreateDocumentType"
import { useUpdateDocumentType } from "@/features/documentRequirements/hooks/useUpdateDocumentType"
import {
  DocumentRoleScopeSchema,
  DocumentTypeOriginSchema,
} from "@/features/documentRequirements/api/schema"
import type { DocumentType } from "@/features/documentRequirements/api/schema"

// Mirrors the backend CreateDocumentTypeRequest Field bounds. Every rule carries a message *code*,
// never bare prose: an unannotated `.max()` would surface Zod's own English to the user (see
// resolveFormMessage).
const TYPE_CODE_MAX_LENGTH = 100
const TYPE_NAME_MAX_LENGTH = 255

const ROLE_SCOPE_OPTIONS = DocumentRoleScopeSchema.options.map(value => ({
  value,
  labelKey: `documentType.roleScopes.${value}` as const,
}))

const ORIGIN_OPTIONS = DocumentTypeOriginSchema.options.map(value => ({
  value,
  labelKey: `documentType.origins.${value}` as const,
}))

// type_code and origin are set once on create and immutable afterwards (the PATCH contract omits
// both), so the edit form pins them read-only. A single schema serves both modes — in edit the two
// disabled fields keep their prefilled values and validate trivially — so useForm's generic type
// does not have to vary by mode.
const documentTypeSchema = z.object({
  typeCode: z
    .string()
    .trim()
    .min(1, "required")
    .max(TYPE_CODE_MAX_LENGTH, "tooLong"),
  typeName: z
    .string()
    .trim()
    .min(1, "required")
    .max(TYPE_NAME_MAX_LENGTH, "tooLong"),
  roleScope: z.string().min(1, "required"),
  origin: z.string().min(1, "required"),
  note: z.string(),
})

type DocumentTypeFormValues = z.infer<typeof documentTypeSchema>

function toFormValues(documentType?: DocumentType): DocumentTypeFormValues {
  return {
    typeCode: documentType?.type_code ?? "",
    typeName: documentType?.type_name ?? "",
    roleScope: documentType?.role_scope ?? DocumentRoleScopeSchema.enum.lessee,
    origin: documentType?.origin ?? DocumentTypeOriginSchema.enum.requested,
    note: documentType?.note ?? "",
  }
}

type Props = {
  mode: "add" | "edit"
  documentType?: DocumentType
  onOpenChange: (open: boolean) => void
}

function DocumentTypeDialog({ mode, documentType, onOpenChange }: Props) {
  const { t } = useTranslation("documentRequirements")
  const isEdit = mode === "edit"
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? undefined

  const createDocumentType = useCreateDocumentType(tenantId)
  const updateDocumentType = useUpdateDocumentType(tenantId)

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors },
  } = useForm<DocumentTypeFormValues>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: toFormValues(documentType),
  })

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "documentType.errors")
  }

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  const onError = (err: unknown) => {
    if (
      applyApiFieldErrors({
        error: err,
        fields: Object.keys(getValues()),
        setError,
      })
    )
      return

    showApiError(err, t)
  }

  function onSubmit(values: DocumentTypeFormValues) {
    if (isEdit && documentType) {
      updateDocumentType.mutate(
        {
          documentTypeId: documentType.id,
          body: {
            type_name: values.typeName.trim(),
            role_scope: DocumentRoleScopeSchema.parse(values.roleScope),
            note: values.note.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast.success(t("documentType.editSuccess"))
            handleClose()
          },
          onError,
        }
      )
      return
    }

    createDocumentType.mutate(
      {
        type_code: values.typeCode.trim(),
        type_name: values.typeName.trim(),
        role_scope: DocumentRoleScopeSchema.parse(values.roleScope),
        origin: DocumentTypeOriginSchema.parse(values.origin),
        note: values.note.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(t("documentType.addSuccess"))
          handleClose()
        },
        onError,
      }
    )
  }

  const isPending = createDocumentType.isPending || updateDocumentType.isPending

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? t("documentType.editTitle")
                : t("documentType.addTitle")}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t("documentType.editSubtitle")
                : t("documentType.addSubtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label
              htmlFor="document-type-code"
              error={!!errors.typeCode}
              className="mb-2"
            >
              {t("documentType.fields.typeCode")}
            </Label>
            <Input
              id="document-type-code"
              data-testid="document-type-code-input"
              error={!!errors.typeCode}
              disabled={isEdit}
              {...register("typeCode")}
            />
            {errors.typeCode && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.typeCode.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="document-type-name"
              error={!!errors.typeName}
              className="mb-2"
            >
              {t("documentType.fields.typeName")}
            </Label>
            <Input
              id="document-type-name"
              data-testid="document-type-name-input"
              error={!!errors.typeName}
              {...register("typeName")}
            />
            {errors.typeName && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.typeName.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="document-type-role-scope"
              error={!!errors.roleScope}
              className="mb-2"
            >
              {t("documentType.fields.roleScope")}
            </Label>
            <Controller
              control={control}
              name="roleScope"
              render={({ field }) => (
                <SelectField
                  id="document-type-role-scope"
                  data-testid="document-type-role-scope-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={ROLE_SCOPE_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  error={!!errors.roleScope}
                />
              )}
            />
            {errors.roleScope && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.roleScope.message)}
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="document-type-origin"
              error={!!errors.origin}
              className="mb-2"
            >
              {t("documentType.fields.origin")}
            </Label>
            <Controller
              control={control}
              name="origin"
              render={({ field }) => (
                <SelectField
                  id="document-type-origin"
                  data-testid="document-type-origin-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={ORIGIN_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  disabled={isEdit}
                  error={!!errors.origin}
                />
              )}
            />
            {errors.origin && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.origin.message)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="document-type-note" className="mb-2">
              {t("documentType.fields.note")}{" "}
              <span className="font-normal text-muted-foreground">
                {t("create.fields.optional")}
              </span>
            </Label>
            <Textarea
              id="document-type-note"
              data-testid="document-type-note-input"
              rows={3}
              {...register("note")}
            />
            {errors.note && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.note.message)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="document-type-cancel"
            onClick={handleClose}
          >
            {t("create.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="document-type-submit"
            disabled={isPending}
          >
            {isEdit
              ? t("documentType.editSubmit")
              : t("documentType.addSubmit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { DocumentTypeDialog }
