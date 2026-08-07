import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, parseISO, startOfToday } from "date-fns"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { SelectField } from "@/components/ui/select"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ApiError } from "@/lib/api"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { resolveFormMessage } from "@/lib/formMessages"
import { useCurrentUser } from "@/features/users/hooks/useCurrentUser"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useCreateDocumentRequirementCatalog } from "@/features/documentRequirements/hooks/useCreateDocumentRequirementCatalog"
import { ProcessContextCheckboxGroup } from "@/features/documentRequirements/components/ProcessContextCheckboxGroup"
import { CATALOG_TYPE_OPTIONS } from "@/features/documentRequirements/constants"
import { DocumentRequirementCatalogTypeSchema } from "@/features/documentRequirements/api/schema"

// Every rule carries a message *code*, never bare prose: an unannotated `.max()` would surface
// Zod's own English text to the user (see resolveFormMessage).
const CATALOG_NAME_MAX_LENGTH = 200

// Cross-field rules per US 16.1: Product Template is mandatory only for Product-Specific
// catalogs (null/absent for Global Default), and Valid To must be >= Valid From when both are
// set — both are optional per the story's own field spec, unlike the Workflow Task Catalog's
// equivalent where Valid From is required.
const createCatalogSchema = z
  .object({
    catalogName: z
      .string()
      .trim()
      .min(1, "required")
      .max(CATALOG_NAME_MAX_LENGTH, "tooLong"),
    catalogType: z.string().min(1, "required"),
    productTemplate: z.string(),
    processContexts: z.array(z.string()).min(1, "required"),
    validFrom: z.string(),
    validTo: z.string(),
  })
  .superRefine((data, ctx) => {
    if (
      data.catalogType ===
        DocumentRequirementCatalogTypeSchema.enum.product_specific &&
      !data.productTemplate
    ) {
      ctx.addIssue({
        code: "custom",
        message: "required",
        path: ["productTemplate"],
      })
    }
    if (data.validTo && data.validFrom && data.validTo < data.validFrom) {
      ctx.addIssue({
        code: "custom",
        message: "validToBeforeValidFrom",
        path: ["validTo"],
      })
    }
    // The BE rejects a past valid_from outright on other catalog modules in this codebase; catch
    // it here rather than spend a guaranteed 422. Only applies when a value is actually chosen —
    // the field itself is optional.
    if (data.validFrom && data.validFrom < format(new Date(), "yyyy-MM-dd")) {
      ctx.addIssue({
        code: "custom",
        message: "validFromInPast",
        path: ["validFrom"],
      })
    }
  })

type CreateCatalogFormValues = {
  catalogName: string
  catalogType: string
  productTemplate: string
  processContexts: string[]
  validFrom: string
  validTo: string
}

const EMPTY_FORM_VALUES: CreateCatalogFormValues = {
  catalogName: "",
  catalogType: "",
  productTemplate: "",
  processContexts: [],
  validFrom: "",
  validTo: "",
}

type Props = {
  onOpenChange: (open: boolean) => void
}

function CreateDocumentRequirementCatalogDialog({ onOpenChange }: Props) {
  const { t } = useTranslation("documentRequirements")
  const { data: currentUser } = useCurrentUser()
  const tenantId = currentUser?.tenant_id ?? undefined

  const {
    data: templates,
    isLoading: isLoadingTemplates,
    isError: isTemplatesError,
    error: templatesError,
  } = useSelectableProductTemplates()
  const createCatalog = useCreateDocumentRequirementCatalog(tenantId)

  const templateOptions = (templates?.items ?? []).map(item => ({
    value: item.template_id,
    label: `${item.template_name} (${item.version_number})`,
  }))

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors },
  } = useForm<CreateCatalogFormValues>({
    resolver: zodResolver(createCatalogSchema),
    defaultValues: EMPTY_FORM_VALUES,
  })

  const catalogType = useWatch({ control, name: "catalogType" })
  const isProductSpecific =
    catalogType === DocumentRequirementCatalogTypeSchema.enum.product_specific

  // Calendar floors matched to the schema rules above: validFromInPast rejects a past Valid
  // From, and the cross-field rule accepts validTo >= validFrom — equal dates are legal, so the
  // end floor is the chosen start itself.
  const validFrom = useWatch({ control, name: "validFrom" })
  const today = startOfToday()
  const validToMin = validFrom ? parseISO(validFrom) : today

  function resolveMessage(message: string | undefined): string | undefined {
    return resolveFormMessage(message, t, "create.errors")
  }

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: CreateCatalogFormValues) {
    createCatalog.mutate(
      {
        catalog_name: values.catalogName.trim(),
        catalog_type: DocumentRequirementCatalogTypeSchema.parse(
          values.catalogType
        ),
        applicable_process_contexts: values.processContexts,
        product_template_id: isProductSpecific ? values.productTemplate : null,
        valid_from: values.validFrom || null,
        valid_to: values.validTo || null,
      },
      {
        onSuccess: () => {
          toast.success(t("create.success"))
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

          toast.error(
            err instanceof ApiError
              ? t(`errors.${err.code}` as "errors.generic", {
                  defaultValue: t("errors.generic"),
                })
              : t("errors.generic")
          )
        },
      }
    )
  }

  return (
    <DialogModal open onOpenChange={o => !o && handleClose()}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-4 py-4">
          <DialogHeader>
            <DialogTitle>{t("create.title")}</DialogTitle>
            <DialogDescription>{t("create.subtitle")}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label
              htmlFor="create-catalog-name"
              error={!!errors.catalogName}
              className="mb-2"
            >
              {t("create.fields.catalogName")}
            </Label>
            <Input
              id="create-catalog-name"
              data-testid="create-catalog-name-input"
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
            <Label
              htmlFor="create-catalog-type"
              error={!!errors.catalogType}
              className="mb-2"
            >
              {t("create.fields.catalogType")}
            </Label>
            <Controller
              control={control}
              name="catalogType"
              render={({ field }) => (
                <SelectField
                  id="create-catalog-type"
                  data-testid="create-catalog-type-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={CATALOG_TYPE_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  placeholder={t("create.fields.catalogTypePlaceholder")}
                  error={!!errors.catalogType}
                />
              )}
            />
            {errors.catalogType && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.catalogType.message)}
              </p>
            )}
          </div>

          {isProductSpecific && (
            <div>
              <Label
                htmlFor="create-catalog-product-template"
                error={!!errors.productTemplate}
                className="mb-2"
              >
                {t("create.fields.productTemplate")}
              </Label>
              {isTemplatesError ? (
                <p
                  data-testid="create-catalog-product-template-error"
                  className="text-sm text-destructive"
                >
                  {templatesError instanceof ApiError
                    ? t(`errors.${templatesError.code}` as "errors.generic", {
                        defaultValue: t("errors.generic"),
                      })
                    : t("errors.generic")}
                </p>
              ) : (
                <Controller
                  control={control}
                  name="productTemplate"
                  render={({ field }) => (
                    <SelectField
                      id="create-catalog-product-template"
                      data-testid="create-catalog-product-template-select"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={templateOptions}
                      placeholder={t(
                        "create.fields.productTemplatePlaceholder"
                      )}
                      error={!!errors.productTemplate}
                      disabled={isLoadingTemplates}
                    />
                  )}
                />
              )}
              {errors.productTemplate && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.productTemplate.message)}
                </p>
              )}
            </div>
          )}

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
                  testIdPrefix="create-catalog"
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
              <Label htmlFor="create-catalog-valid-from" className="mb-2">
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
                    id="create-catalog-valid-from"
                    data-testid="create-catalog-valid-from-datepicker"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.validFrom}
                    minDate={today}
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
              <Label htmlFor="create-catalog-valid-to" className="mb-2">
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
                    id="create-catalog-valid-to"
                    data-testid="create-catalog-valid-to-datepicker"
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
            data-testid="create-catalog-cancel"
            onClick={handleClose}
          >
            {t("create.actions.cancel")}
          </Button>
          <Button
            type="submit"
            data-testid="create-catalog-submit"
            disabled={createCatalog.isPending}
          >
            {t("create.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { CreateDocumentRequirementCatalogDialog }
