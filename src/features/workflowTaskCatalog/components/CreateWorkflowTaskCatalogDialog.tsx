import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
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
import {
  CATALOG_LAYER,
  ENTITY_TYPE_OPTIONS,
  PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS,
} from "@/features/workflowTaskCatalog/constants"
import type { CatalogLayer } from "@/features/workflowTaskCatalog/constants"

// Two schemas rather than one shared shape with .extend()/.refine(): the only real
// difference is that productTemplate is required for Product-Specific and unused for
// Global Default (forced null per PRD1042-1158/1159) — duplicating the four shared
// fields keeps each schema readable without fighting zod's typing on refined objects.
const VALID_UNTIL_REFINEMENT = {
  message: "validUntilBeforeValidFrom",
  path: ["validUntil"],
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

// Static shell only — no backend exists yet for Epic 15 (see CLAUDE.md). Submitting
// validates the form client-side, then only closes the dialog; it never simulates a
// network call or shows a success toast.
function CreateWorkflowTaskCatalogDialog({ layer, onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const isGlobalDefault = layer === CATALOG_LAYER.GLOBAL_DEFAULT

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

  function onSubmit() {
    handleClose()
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
              <Controller
                control={control}
                name="productTemplate"
                render={({ field }) => (
                  <SelectField
                    id="create-catalog-product-template"
                    data-testid="create-catalog-product-template-select"
                    value={field.value}
                    onValueChange={field.onChange}
                    options={PLACEHOLDER_PRODUCT_TEMPLATE_OPTIONS}
                    placeholder={t("create.fields.productTemplatePlaceholder")}
                    error={!!errors.productTemplate}
                  />
                )}
              />
              <p className="mt-2 text-sm text-muted-foreground opacity-80">
                {t("create.fields.productTemplateHint")}
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
          <Button type="submit" data-testid="create-catalog-submit">
            {t("create.actions.submit")}
          </Button>
        </div>
      </form>
    </DialogModal>
  )
}

export { CreateWorkflowTaskCatalogDialog }
