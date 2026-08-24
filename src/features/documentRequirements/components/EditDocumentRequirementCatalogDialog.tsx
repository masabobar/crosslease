import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { parseISO } from "date-fns"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveFormMessage } from "@/lib/formMessages"
import { useUpdateDocumentRequirementCatalog } from "@/features/documentRequirements/hooks/useUpdateDocumentRequirementCatalog"
import { ProcessContextCheckboxGroup } from "@/features/documentRequirements/components/ProcessContextCheckboxGroup"
import type { DocumentRequirementCatalogDetailResponse } from "@/features/documentRequirements/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

// Every rule carries a message *code*, never bare prose: an unannotated `.max()` would surface
// Zod's own English text to the user (see resolveFormMessage).
const CATALOG_NAME_MAX_LENGTH = 200

// Editing an existing catalog does NOT floor Valid From at today — unlike creation, an existing
// record may legitimately have a start date in the past (date-inputs.md §4). Valid To must still
// be >= Valid From when both are present.
const editCatalogSchema = z
  .object({
    catalogName: z
      .string()
      .trim()
      .min(1, "required")
      .max(CATALOG_NAME_MAX_LENGTH, "tooLong"),
    processContexts: z.array(z.string()).min(1, "required"),
    validFrom: z.string(),
    validTo: z.string(),
  })
  .refine(
    data => !data.validTo || !data.validFrom || data.validTo >= data.validFrom,
    {
      message: "validToBeforeValidFrom",
      path: ["validTo"],
    }
  )

type EditCatalogFormValues = {
  catalogName: string
  processContexts: string[]
  validFrom: string
  validTo: string
}

type Props = {
  catalog: DocumentRequirementCatalogDetailResponse
  onOpenChange: (open: boolean) => void
}

function EditDocumentRequirementCatalogDialog({
  catalog,
  onOpenChange,
}: Props) {
  const { t } = useTranslation("documentRequirements")
  const updateCatalog = useUpdateDocumentRequirementCatalog(catalog.id)

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<EditCatalogFormValues>({
    resolver: zodResolver(editCatalogSchema),
    defaultValues: {
      catalogName: catalog.catalog_name,
      processContexts: catalog.applicable_process_contexts,
      validFrom: catalog.valid_from ?? "",
      validTo: catalog.valid_to ?? "",
    },
  })

  const validFrom = useWatch({ control, name: "validFrom" })
  const validToMin = validFrom ? parseISO(validFrom) : undefined

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "create.errors")
  }

  function handleClose() {
    onOpenChange(false)
  }

  function onSubmit(values: EditCatalogFormValues) {
    updateCatalog.mutate(
      {
        catalog_name: values.catalogName.trim(),
        applicable_process_contexts: values.processContexts,
        valid_from: values.validFrom || null,
        valid_to: values.validTo || null,
      },
      {
        onSuccess: () => {
          toast.success(t("detail.identity.editSuccess"))
          handleClose()
        },
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
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("detail.identity.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("detail.identity.editSubtitle")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label
              htmlFor="edit-catalog-name"
              error={!!errors.catalogName}
              className="mb-2"
            >
              {t("create.fields.catalogName")}
            </Label>
            <Input
              id="edit-catalog-name"
              data-testid="edit-catalog-name-input"
              error={!!errors.catalogName}
              {...register("catalogName")}
            />
            {errors.catalogName && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.catalogName.message)}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2" error={!!errors.processContexts}>
              {t("create.fields.processContexts")}
            </Label>
            <Controller
              control={control}
              name="processContexts"
              render={({ field }) => (
                <ProcessContextCheckboxGroup
                  value={field.value}
                  onChange={field.onChange}
                  testIdPrefix="edit-catalog"
                />
              )}
            />
            {errors.processContexts && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.processContexts.message)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-catalog-valid-from" className="mb-2">
                {t("create.fields.validFrom")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Controller
                control={control}
                name="validFrom"
                render={({ field }) => (
                  <DatePicker
                    id="edit-catalog-valid-from"
                    data-testid="edit-catalog-valid-from-datepicker"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.validFrom}
                    captionLayout="dropdown"
                  />
                )}
              />
              {errors.validFrom && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.validFrom.message)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-catalog-valid-to" className="mb-2">
                {t("create.fields.validTo")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Controller
                control={control}
                name="validTo"
                render={({ field }) => (
                  <DatePicker
                    id="edit-catalog-valid-to"
                    data-testid="edit-catalog-valid-to-datepicker"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.validTo}
                    minDate={validToMin}
                    captionLayout="dropdown"
                  />
                )}
              />
              {errors.validTo && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.validTo.message)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 px-4 py-4 border-t bg-slate-50/50 rounded-b-2xl">
          <Button
            type="button"
            variant="outline"
            data-testid="edit-catalog-cancel"
            onClick={handleClose}
          >
            {t("create.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="edit-catalog-submit"
            disabled={updateCatalog.isPending}
          >
            {t("detail.identity.editSubmit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { EditDocumentRequirementCatalogDialog }
