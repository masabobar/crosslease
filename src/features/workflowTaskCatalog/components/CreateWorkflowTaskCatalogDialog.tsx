import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectField } from "@/components/ui/select"
import {
  DialogModal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { applyApiFieldErrors } from "@/lib/apiFieldErrors"
import { useSelectableProductTemplates } from "@/features/frameworkAgreements/hooks/useSelectableProductTemplates"
import { useCreateWorkflowTaskCatalog } from "@/features/workflowTaskCatalog/hooks/useCreateWorkflowTaskCatalog"
import { useCatalogCaseTypes } from "@/features/workflowTaskCatalog/hooks/useCatalogCaseTypes"
import {
  CaseTypeSchema,
  CatalogLayerSchema,
} from "@/features/workflowTaskCatalog/api/schema"
import type { CatalogLayer } from "@/features/workflowTaskCatalog/api/schema"
import { resolveApiErrorMessage } from "@/lib/apiErrorMessage"

// Two schemas rather than one shared shape with .extend()/.refine(): the only real
// difference is that productTemplate is required for Product-Specific and unused for
// Global Default (entity_id must be null for that layer) — duplicating the four shared
// fields keeps each schema readable without fighting zod's typing on refined objects.
// PRD1042-2150 — the wizard no longer asks for a validity window. Both dates, their
// cross-field rule and the past-date guard went with the fields: there is nothing left on
// this form to validate, and the backend now accepts a catalogue without one. A window can
// still be set later from the catalogue's own edit surface.

// productTemplate is a plain (non-optional) z.string() in both schemas — "not set" is
// represented as "" rather than undefined — so both schemas produce the exact same output
// shape as CreateCatalogFormValues below.
const globalDefaultCatalogSchema = z.object({
  catalogName: z.string().trim().min(1, "required"),
  caseType: z.string().min(1, "required"),
  productTemplate: z.string(),
})

const productSpecificCatalogSchema = z.object({
  catalogName: z.string().trim().min(1, "required"),
  caseType: z.string().min(1, "required"),
  productTemplate: z.string().min(1, "required"),
})

type CreateCatalogFormValues = {
  catalogName: string
  caseType: string
  productTemplate: string
}

const EMPTY_FORM_VALUES: CreateCatalogFormValues = {
  catalogName: "",
  caseType: "",
  productTemplate: "",
}

type Props = {
  layer: CatalogLayer
  onOpenChange: (open: boolean) => void
}

function CreateWorkflowTaskCatalogDialog({ layer, onOpenChange }: Props) {
  const { t } = useTranslation("workflowTaskCatalog")
  const { t: tCommon } = useTranslation("common")
  const isGlobalDefault = layer === CatalogLayerSchema.enum.global_default
  // PRD1042-1790 item 1 — the scopeable case types come from the backend, never a local list.
  const {
    data: caseTypes,
    isError: isCaseTypesError,
    error: caseTypesError,
  } = useCatalogCaseTypes()

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
    getValues,
    setError,
    formState: { errors },
  } = useForm<CreateCatalogFormValues>({
    resolver: zodResolver(
      isGlobalDefault
        ? globalDefaultCatalogSchema
        : productSpecificCatalogSchema
    ),
    defaultValues: EMPTY_FORM_VALUES,
  })

  // Every rule left on this form is a presence check, so `required` is the only message the
  // resolver can receive — PRD1042-2150 removed the two date rules that were not.
  function resolveMessage(message: string | undefined): string | undefined {
    return message ? tCommon("validation.required") : undefined
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
        // entity_type is not part of CreateCatalogRequest (PRD1042-1790 item 1) — the backend
        // derives it from case_type and returns it on the response instead.
        // entity_id carries the Product Template UUID and must be null on Global Default.
        entity_id: isGlobalDefault ? null : values.productTemplate,
        // The case type IS the scope key (PRD1042-1790 item 1), so it is asked for directly. It
        // used to be derived from a chosen Entity type, which capped the axis at the two case
        // types an entity type maps to and put the superseded vocabulary on screen.
        case_type: CaseTypeSchema.parse(values.caseType),
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
          // A VALIDATION_ERROR names the offending wire fields; the helper camel-cases them
          // (catalog_name → catalogName) so they land on this form's own fields rather than
          // being flattened into a generic toast. Falls through when nothing maps.
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
              htmlFor="create-catalog-case-type"
              error={!!errors.caseType}
              className="mb-2"
            >
              {t("create.fields.caseType")}
            </Label>
            <Controller
              control={control}
              name="caseType"
              render={({ field }) => (
                <SelectField
                  id="create-catalog-case-type"
                  data-testid="create-catalog-case-type-select"
                  value={field.value}
                  onValueChange={field.onChange}
                  // Exactly what the backend reports as scopeable — no local list, so a further
                  // case type appears here with no frontend release (AC-74/AC-94).
                  options={(caseTypes ?? []).map(item => ({
                    value: item.case_type,
                    label: t(`caseTypes.${item.case_type}`),
                  }))}
                  placeholder={t("create.fields.caseTypePlaceholder")}
                  error={!!errors.caseType}
                />
              )}
            />
            {errors.caseType && (
              <p className="mt-1 text-sm text-destructive">
                {resolveMessage(errors.caseType.message)}
              </p>
            )}
            {isCaseTypesError && (
              <p
                className="mt-1 text-sm text-destructive"
                data-testid="create-catalog-case-types-error"
              >
                {resolveApiErrorMessage(caseTypesError, t)}
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
                  {resolveApiErrorMessage(templatesError, t)}
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
