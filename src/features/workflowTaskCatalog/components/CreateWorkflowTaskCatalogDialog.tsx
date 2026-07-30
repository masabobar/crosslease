import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Lock } from "lucide-react"
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
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useCreateWorkflowTaskCatalog } from "@/features/workflowTaskCatalog/hooks/useCreateWorkflowTaskCatalog"
import { ENTITY_TYPE_OPTIONS } from "@/features/workflowTaskCatalog/constants"
import {
  CatalogEntityTypeSchema,
  CatalogLayerSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogLayer } from "@/features/workflowTaskCatalog/api/schema"

// Two schemas rather than one shared shape with .extend()/.refine(): the only real
// difference is that productTemplate is required for Product-Specific and unused for
// Global Default (entity_id must be null for that layer) — duplicating the four shared
// fields keeps each schema readable without fighting zod's typing on refined objects.
const VALID_UNTIL_REFINEMENT = {
  message: "validUntilBeforeValidFrom",
  path: ["validUntil"],
}

// The BE rejects a past valid_from outright (WTC_CATALOG_INVALID_VALID_FROM;
// BACKDATING_TOLERANCE_DAYS is 0), so catch it here rather than spend a guaranteed 422.
// Same shape as ProductTemplateWizardFormSchema's validFromInPast rule.
function refineValidFrom(
  data: { validFrom: string },
  ctx: z.RefinementCtx
): void {
  if (
    data.validFrom !== "" &&
    data.validFrom < format(new Date(), "yyyy-MM-dd")
  ) {
    ctx.addIssue({
      code: "custom",
      message: "validFromInPast",
      path: ["validFrom"],
    })
  }
}

// productTemplate/validUntil are plain (non-optional) z.string() in both schemas —
// "not set" is represented as "" rather than undefined — so both schemas produce the
// exact same output shape as CreateCatalogFormValues below.
const globalDefaultCatalogSchema = z
  .object({
    catalogName: z.string().trim().min(1, "required"),
    entityType: z.string().min(1, "required"),
    productTemplate: z.string(),
    validFrom: z.string().min(1, "required"),
    validUntil: z.string(),
  })
  .refine(
    data => !data.validUntil || data.validUntil >= data.validFrom,
    VALID_UNTIL_REFINEMENT
  )
  .superRefine(refineValidFrom)

const productSpecificCatalogSchema = z
  .object({
    catalogName: z.string().trim().min(1, "required"),
    entityType: z.string().min(1, "required"),
    productTemplate: z.string().min(1, "required"),
    validFrom: z.string().min(1, "required"),
    validUntil: z.string(),
  })
  .refine(
    data => !data.validUntil || data.validUntil >= data.validFrom,
    VALID_UNTIL_REFINEMENT
  )
  .superRefine(refineValidFrom)

type CreateCatalogFormValues = {
  catalogName: string
  entityType: string
  productTemplate: string
  validFrom: string
  validUntil: string
}

const EMPTY_FORM_VALUES: CreateCatalogFormValues = {
  catalogName: "",
  entityType: "",
  productTemplate: "",
  validFrom: "",
  validUntil: "",
}

type Props = {
  layer: CatalogLayer
  onOpenChange: (open: boolean) => void
}

function CreateWorkflowTaskCatalogDialog({ layer, onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const isGlobalDefault = layer === CatalogLayerSchema.enum.global_default

  // Reused from the FA feature: GET /product-templates/selectable returns only templates
  // with a published version valid today, which is what the catalog's entity_id must be
  // (services.py _validate_product_template rejects anything else).
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    isError: isTemplatesError,
    error: templatesError,
  } = useSelectableProductTemplates()
  const createCatalog = useCreateWorkflowTaskCatalog()

  const templateOptions = (templates?.items ?? []).map(item => ({
    value: item.template_id,
    label: `${item.template_name} (${item.version_number})`,
  }))

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCatalogFormValues>({
    resolver: zodResolver(
      isGlobalDefault
        ? globalDefaultCatalogSchema
        : productSpecificCatalogSchema
    ),
    defaultValues: EMPTY_FORM_VALUES,
  })

  function resolveMessage(message: string | undefined): string | undefined {
    if (!message) return undefined
    if (message === "required") return tCommon("validation.required")
    return t(
      `create.errors.${message}` as "create.errors.validUntilBeforeValidFrom"
    )
  }

  function handleClose() {
    onOpenChange(false)
    reset()
  }

  function onSubmit(values: CreateCatalogFormValues) {
    createCatalog.mutate(
      {
        catalog_name: values.catalogName.trim(),
        catalog_layer: layer,
        // Form fields are strings ("" = unset); parse at the form → wire boundary so an
        // unexpected value throws here instead of travelling as a bad request param.
        entity_type: CatalogEntityTypeSchema.parse(values.entityType),
        // entity_id carries the Product Template UUID and must be null on Global Default.
        entity_id: isGlobalDefault ? null : values.productTemplate,
        valid_from: values.validFrom,
        valid_until: values.validUntil || null,
      },
      {
        onSuccess: response => {
          toast.success(t("create.success"))
          // The BE warns when a Product-Specific catalog is created with no Global Default
          // for its Tenant × Entity Type — only Supplement tasks can be authored until one
          // exists, so it must not be swallowed.
          for (const warning of response.warnings) {
            toast.warning(warning)
          }
          handleClose()
        },
        onError: err => {
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
            <DialogDescription>
              {t(
                isGlobalDefault
                  ? "create.subtitleGlobalDefault"
                  : "create.subtitleProductSpecific"
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-4 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label className="mb-2">{t("create.fields.catalogLayer")}</Label>
            <div
              data-testid="create-catalog-layer-locked"
              className="flex h-8 items-center justify-between rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground"
            >
              <span>
                {t(`catalogLayers.${layer}` as "catalogLayers.global_default")}
              </span>
              <Lock size={14} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground opacity-80">
              {t(
                isGlobalDefault
                  ? "create.fields.catalogLayerHintGlobalDefault"
                  : "create.fields.catalogLayerHintProductSpecific"
              )}
            </p>
          </div>

          <div>
            <Label
              htmlFor="create-catalog-entity-type"
              error={!!errors.entityType}
              className="mb-2"
            >
              {t("create.fields.entityType")}
            </Label>
            <Controller
              control={control}
              name="entityType"
              render={({ field }) => (
                <SelectField
                  id="create-catalog-entity-type"
                  data-testid="create-catalog-entity-type-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={ENTITY_TYPE_OPTIONS.map(o => ({
                    value: o.value,
                    label: t(o.labelKey),
                  }))}
                  placeholder={t("create.fields.entityTypePlaceholder")}
                  error={!!errors.entityType}
                />
              )}
            />
            {errors.entityType && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.entityType.message)}
              </p>
            )}
          </div>

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
            <p className="mt-2 text-sm text-muted-foreground opacity-80">
              {t("create.fields.catalogNameHint")}
            </p>
            {errors.catalogName && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.catalogName.message)}
              </p>
            )}
          </div>

          {isGlobalDefault ? (
            <div>
              <Label className="mb-2">
                {t("create.fields.productTemplate")}
              </Label>
              <div
                data-testid="create-catalog-product-template-locked"
                className="flex h-8 items-center justify-between rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground"
              >
                <span>{t("create.fields.productTemplateNotApplicable")}</span>
                <Lock size={14} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground opacity-80">
                {t("create.fields.productTemplateLockedHint")}
              </p>
            </div>
          ) : (
            <div>
              <Label
                htmlFor="create-catalog-product-template"
                error={!!errors.productTemplate}
                className="mb-2"
              >
                {t("create.fields.productTemplate")}
              </Label>
              {/* entity_id is required for this layer, so a failed or empty template query
                  is a dead end — say so rather than rendering an empty select. */}
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
              <p className="mt-2 text-sm text-muted-foreground opacity-80">
                {!isTemplatesError &&
                !isLoadingTemplates &&
                templateOptions.length === 0
                  ? t("create.fields.productTemplateEmpty")
                  : t("create.fields.productTemplateHint")}
              </p>
              {errors.productTemplate && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.productTemplate.message)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="create-catalog-valid-from"
                error={!!errors.validFrom}
                className="mb-2"
              >
                {t("create.fields.validFrom")}
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
              <Label
                htmlFor="create-catalog-valid-until"
                error={!!errors.validUntil}
                className="mb-2"
              >
                {t("create.fields.validUntil")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("create.fields.optional")}
                </span>
              </Label>
              <Controller
                control={control}
                name="validUntil"
                render={({ field }) => (
                  <DatePicker
                    id="create-catalog-valid-until"
                    data-testid="create-catalog-valid-until-datepicker"
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.validUntil}
                    captionLayout="dropdown"
                  />
                )}
              />
              {errors.validUntil && (
                <p className="mt-1 text-sm text-destructive">
                  {resolveMessage(errors.validUntil.message)}
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

export { CreateWorkflowTaskCatalogDialog }
